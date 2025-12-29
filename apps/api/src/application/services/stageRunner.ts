import { Stage, RunStatus, TaskStatus } from "@coding-agent/shared";
import {
  AcceptanceRepository,
  CodexClient,
  EventBus,
  ImpactRepository,
  IntentRepository,
  RequirementRepository,
  RunEventRepository,
  RunRepository,
  SessionRepository,
  TaskRepository
} from "../ports";
import { formatSequentialId } from "../utils/idGenerator";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const inferOutput = (raw: Record<string, unknown>) => {

  if (raw.type === "item.completed") {
    return raw.item as Record<string, unknown>;
  }

  
  return null;
};

const enforceStrictSchema = (schema: unknown): unknown => {
  if (!schema || typeof schema !== "object") {
    return schema;
  }

  if (Array.isArray(schema)) {
    return schema.map((item) => enforceStrictSchema(item));
  }

  const record = schema as Record<string, unknown>;
  const next: Record<string, unknown> = { ...record };

  const type = record.type;
  const hasProperties = !!record.properties && typeof record.properties === "object";
  if (type === "object" || hasProperties) {
    next.additionalProperties = false;
  }

  if (record.properties && typeof record.properties === "object") {
    const props = record.properties as Record<string, unknown>;
    const nextProps: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(props)) {
      nextProps[key] = enforceStrictSchema(value);
    }
    next.properties = nextProps;
  }

  if (record.items) {
    next.items = enforceStrictSchema(record.items);
  }

  for (const key of ["allOf", "anyOf", "oneOf"] as const) {
    if (record[key]) {
      next[key] = enforceStrictSchema(record[key]);
    }
  }

  return next;
};

const toOutputSchema = (schema: z.ZodTypeAny): Record<string, unknown> => {
  const jsonSchema = zodToJsonSchema(schema, { target: "openAi" }) as Record<string, unknown>;
  return enforceStrictSchema(jsonSchema) as Record<string, unknown>;
};

const getThreadIdFromEvent = (raw: Record<string, unknown>) => {
  if (raw.type !== "thread.started") {
    return null;
  }

  const threadId = (raw as { thread_id?: unknown }).thread_id;
  return typeof threadId === "string" ? threadId : null;
};

export class StageRunner {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly intents: IntentRepository,
    private readonly requirements: RequirementRepository,
    private readonly acceptance: AcceptanceRepository,
    private readonly impact: ImpactRepository,
    private readonly tasks: TaskRepository,
    private readonly runs: RunRepository,
    private readonly events: RunEventRepository,
    private readonly codex: CodexClient,
    private readonly eventBus: EventBus
  ) {}

  async handleStageGeneration(runId: string, sessionId: string, stage: Stage) {
    const session = await this.sessions.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    await this.runs.updateRun(runId, { status: RunStatus.RUNNING, startedAt: new Date() });

    let finalOutput: Record<string, unknown> | null = null;
    let threadId = session.codexThreadId;
    const prompt = await this.buildStagePrompt(stage, sessionId);
    const outputSchema = this.buildStageSchema(stage);

    try {
      for await (const event of this.codex.runStreamed({
        threadId,
        prompt,
        outputSchema,
        workingDirectory: session.projectPath
      })) {
        const startedThreadId = !threadId ? getThreadIdFromEvent(event.raw) : null;
        if (startedThreadId) {
          threadId = startedThreadId;
          await this.sessions.updateSession(sessionId, { codexThreadId: startedThreadId });
        }

        await this.events.createEvent({
          runId,
          ts: new Date(event.ts),
          type: event.type,
          payload: event.raw
        });

        this.eventBus.emitSessionEvent(sessionId, {
          sessionId,
          runId,
          stage,
          ts: event.ts,
          type: event.type,
          itemType: event.itemType,
          message: event.message,
          raw: event.raw
        });

        const output = inferOutput(event.raw);
        if (output) {
          try {
            finalOutput = JSON.parse(output.text as string) as Record<string, unknown>;
          } catch(error) {
            console.info("Failed to parse Codex output as JSON", error.message);
          }
          
        }
      }

      if (!finalOutput) {
        throw new Error("No structured output from Codex");
      }

      await this.persistStageOutput(stage, sessionId, finalOutput);
      await this.sessions.updateSession(sessionId, { currentStage: stage });
      await this.runs.updateRun(runId, { status: RunStatus.SUCCEEDED, endedAt: new Date() });
    } catch (error) {
      await this.runs.updateRun(runId, {
        status: RunStatus.FAILED,
        endedAt: new Date(),
        error: error instanceof Error ? error.message : "Unknown error"
      });
      throw error;
    }
  }

  async handleTaskExecution(runId: string, sessionId: string, taskId: string, extraPrompt?: string) {
    const session = await this.sessions.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const task = (await this.tasks.list(sessionId)).find((item) => item.taskId === taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    await this.runs.updateRun(runId, { status: RunStatus.RUNNING, startedAt: new Date() });
    await this.tasks.update(sessionId, taskId, { attempts: task.attempts + 1, status: TaskStatus.RUNNING });

    let finalOutput: Record<string, unknown> | null = null;
    let threadId = session.codexThreadId;
    const prompt = this.buildTaskPrompt(task, extraPrompt);
    const outputSchema = this.buildTaskSchema();

    try {
      for await (const event of this.codex.runStreamed({
        threadId,
        prompt,
        outputSchema,
        workingDirectory: session.projectPath,
        fullAuto: true
      })) {
        const startedThreadId = !threadId ? getThreadIdFromEvent(event.raw) : null;
        if (startedThreadId) {
          threadId = startedThreadId;
          await this.sessions.updateSession(sessionId, { codexThreadId: startedThreadId });
        }

        await this.events.createEvent({
          runId,
          ts: new Date(event.ts),
          type: event.type,
          payload: event.raw
        });

        this.eventBus.emitSessionEvent(sessionId, {
          sessionId,
          runId,
          stage: Stage.EXECUTION,
          ts: event.ts,
          type: event.type,
          itemType: event.itemType,
          message: event.message,
          raw: event.raw
        });

        const output = inferOutput(event.raw);
        if (output) {
          finalOutput = output;
        }
      }

      if (!finalOutput) {
        throw new Error("No structured output from Codex");
      }

      const status = (finalOutput.status as string) ?? "SUCCEEDED";
      const resultSummary = (finalOutput.resultSummary as string) ?? "";
      const isFailed = status === "FAILED";

      await this.tasks.update(sessionId, taskId, {
        status: isFailed ? TaskStatus.FAILED : TaskStatus.SUCCEEDED,
        resultSummary,
        lastError: isFailed ? (finalOutput.error as string) : null
      });

      await this.runs.updateRun(runId, {
        status: isFailed ? RunStatus.FAILED : RunStatus.SUCCEEDED,
        endedAt: new Date(),
        error: isFailed ? (finalOutput.error as string) : null
      });
    } catch (error) {
      await this.tasks.update(sessionId, taskId, {
        status: TaskStatus.FAILED,
        lastError: error instanceof Error ? error.message : "Unknown error"
      });

      await this.runs.updateRun(runId, {
        status: RunStatus.FAILED,
        endedAt: new Date(),
        error: error instanceof Error ? error.message : "Unknown error"
      });
      throw error;
    }
  }

  private async buildStagePrompt(stage: Stage, sessionId: string) {
    const intent = await this.intents.getIntent(sessionId);
    const requirements = await this.requirements.list(sessionId);

    if (stage === Stage.REQUIREMENTS) {
      return `You are a product analyst. Use the intent to produce requirement briefs.\n\nIntent:\n${intent?.text ?? ""}`;
    }

    if (stage === Stage.ACCEPTANCE_CRITERIA) {
      const list = requirements.map((req) => `- ${req.reqId}: ${req.shortName}`).join("\n");
      return `Generate Gherkin acceptance criteria for each requirement.\n\nRequirements:\n${list}`;
    }

    if (stage === Stage.IMPACT_ANALYSIS) {
      return `Inspect the repository and identify impacted modules. Provide impact level, explanation, and risks.\n\nIntent:\n${intent?.text ?? ""}`;
    }

    if (stage === Stage.TASKS) {
      const list = requirements.map((req) => `- ${req.reqId}: ${req.shortName}`).join("\n");
      return `Generate implementation tasks mapped to requirements.\n\nRequirements:\n${list}`;
    }

    throw new Error("Unsupported stage");
  }

  private buildStageSchema(stage: Stage): Record<string, unknown> {
    if (stage === Stage.REQUIREMENTS) {
      return toOutputSchema(
        z.object({
          requirements: z.array(
            z.object({
              id: z.string().optional(),
              shortName: z.string(),
              currentState: z.string(),
              desiredState: z.string(),
              explanation: z.string()
            })
          )
        })
      );
    }

    if (stage === Stage.ACCEPTANCE_CRITERIA) {
      return toOutputSchema(
        z.object({
          criteria: z.array(
            z.object({
              id: z.string().optional(),
              requirementId: z.string(),
              given: z.string(),
              when: z.string(),
              then: z.string()
            })
          )
        })
      );
    }

    if (stage === Stage.IMPACT_ANALYSIS) {
      return toOutputSchema(
        z.object({
          impact: z.object({
            id: z.string().optional(),
            impactLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
            affectedModules: z.array(z.string()),
            explanation: z.string(),
            risks: z.array(z.string()).optional(),
            assumptions: z.array(z.string()).optional()
          })
        })
      );
    }

    if (stage === Stage.TASKS) {
      return toOutputSchema(
        z.object({
          tasks: z.array(
            z.object({
              id: z.string().optional(),
              shortName: z.string(),
              description: z.string(),
              relatedRequirementIds: z.array(z.string()).optional()
            })
          )
        })
      );
    }

    throw new Error("Unsupported stage");
  }

  private buildTaskPrompt(task: { taskId: string; shortName: string; description: string }, extraPrompt?: string) {
    const extra = extraPrompt ? `\n\nExtra instructions:\n${extraPrompt}` : "";
    return `Execute the following task in the repository. Make code changes, run relevant tests if available, and summarize the results.\n\nTask ${task.taskId}: ${task.shortName}\n${task.description}${extra}`;
  }

  private buildTaskSchema(): Record<string, unknown> {
    return toOutputSchema(
      z.object({
        status: z.enum(["SUCCEEDED", "FAILED"]),
        resultSummary: z.string(),
        error: z.string().optional()
      })
    );
  }

  private async persistStageOutput(stage: Stage, sessionId: string, output: Record<string, unknown>) {
    if (stage === Stage.REQUIREMENTS) {
      const items = (output.requirements as any[]) ?? [];
      const mapped = items.map((item, index) => ({
        reqId: (item.id as string) ?? formatSequentialId("req", index + 1),
        shortName: String(item.shortName ?? ""),
        currentState: String(item.currentState ?? ""),
        desiredState: String(item.desiredState ?? ""),
        explanation: String(item.explanation ?? ""),
        order: index
      }));
      await this.requirements.upsertMany(sessionId, mapped);
      return;
    }

    if (stage === Stage.ACCEPTANCE_CRITERIA) {
      const items = (output.criteria as any[]) ?? [];
      const mapped = items.map((item, index) => {
        const given = String(item.given ?? "");
        const when = String(item.when ?? "");
        const then = String(item.then ?? "");
        const rendered = `Given ${given}\nWhen ${when}\nThen ${then}`;
        return {
          acId: (item.id as string) ?? formatSequentialId("ac", index + 1),
          requirementReqId: String(item.requirementId ?? ""),
          given,
          when,
          then,
          rendered,
          order: index
        };
      });
      await this.acceptance.upsertMany(sessionId, mapped);
      return;
    }

    if (stage === Stage.IMPACT_ANALYSIS) {
      const impact = output.impact as any;
      await this.impact.upsert(sessionId, {
        impactId: impact.id ?? formatSequentialId("ia", 1),
        impactLevel: impact.impactLevel,
        affectedModules: impact.affectedModules ?? [],
        explanation: impact.explanation ?? "",
        risks: impact.risks ?? [],
        assumptions: impact.assumptions ?? []
      });
      return;
    }

    if (stage === Stage.TASKS) {
      const items = (output.tasks as any[]) ?? [];
      const mapped = items.map((item, index) => ({
        taskId: (item.id as string) ?? formatSequentialId("task", index + 1),
        shortName: String(item.shortName ?? ""),
        description: String(item.description ?? ""),
        relatedRequirementIds: item.relatedRequirementIds ?? [],
        status: TaskStatus.PENDING,
        attempts: 0,
        order: index
      }));
      await this.tasks.upsertMany(sessionId, mapped);
      return;
    }

    throw new Error("Unsupported stage output");
  }
}
