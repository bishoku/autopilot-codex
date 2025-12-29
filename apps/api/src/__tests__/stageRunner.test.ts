import { describe, expect, it } from "vitest";
import { StageRunner } from "../application/services";
import { RunStatus, Stage, TaskStatus } from "@coding-agent/shared";

const createAsyncGenerator = async function* (events: any[]) {
  for (const event of events) {
    yield event;
  }
};

describe("StageRunner", () => {
  it("persists requirement output and run events", async () => {
    const requirements: any[] = [];
    const runEvents: any[] = [];
    const runUpdates: any[] = [];

    const runner = new StageRunner(
      {
        getSession: async () => ({
          id: "session-1",
          name: null,
          projectPath: "/tmp/project",
          createdAt: new Date(),
          updatedAt: new Date(),
          codexThreadId: "thread-1",
          currentStage: null
        })
      } as any,
      {
        getIntent: async () => ({ sessionId: "session-1", text: "Build feature", updatedAt: new Date() })
      } as any,
      {
        list: async () => [],
        upsertMany: async (_sessionId: string, items: any[]) => {
          requirements.push(...items);
        }
      } as any,
      {
        list: async () => [],
        upsertMany: async () => {}
      } as any,
      {
        upsert: async () => ({})
      } as any,
      {
        list: async () => [],
        upsertMany: async () => {}
      } as any,
      {
        updateRun: async (_runId: string, data: any) => {
          runUpdates.push(data);
          return { ...data };
        }
      } as any,
      {
        createEvent: async (_input: any) => {
          runEvents.push(_input);
          return _input;
        }
      } as any,
      {
        runStreamed: () =>
          createAsyncGenerator([
            {
              ts: new Date().toISOString(),
              type: "turn.completed",
              raw: {
                output: {
                  requirements: [
                    {
                      shortName: "Login",
                      currentState: "No auth",
                      desiredState: "Users can log in",
                      explanation: "Add auth"
                    }
                  ]
                }
              }
            }
          ])
      } as any,
      {
        emitSessionEvent: () => {}
      } as any
    );

    await runner.handleStageGeneration("run-1", "session-1", Stage.REQUIREMENTS);

    expect(requirements).toHaveLength(1);
    expect(requirements[0].reqId).toBe("req-0001");
    expect(runEvents).toHaveLength(1);
    expect(runUpdates.some((update) => update.status === RunStatus.SUCCEEDED)).toBe(true);
  });

  it("marks task failures with error", async () => {
    let lastTaskUpdate: any = null;
    let lastRunUpdate: any = null;

    const runner = new StageRunner(
      {
        getSession: async () => ({
          id: "session-1",
          name: null,
          projectPath: "/tmp/project",
          createdAt: new Date(),
          updatedAt: new Date(),
          codexThreadId: "thread-1",
          currentStage: null
        })
      } as any,
      { getIntent: async () => null } as any,
      { list: async () => [] } as any,
      { list: async () => [] } as any,
      { upsert: async () => ({}) } as any,
      {
        list: async () => [
          {
            sessionId: "session-1",
            taskId: "task-0001",
            shortName: "Do thing",
            description: "Desc",
            status: TaskStatus.PENDING,
            attempts: 0,
            order: 0,
            updatedAt: new Date()
          }
        ],
        update: async (_sessionId: string, _taskId: string, data: any) => {
          lastTaskUpdate = data;
          return data;
        }
      } as any,
      {
        updateRun: async (_runId: string, data: any) => {
          lastRunUpdate = data;
          return data;
        }
      } as any,
      {
        createEvent: async () => ({})
      } as any,
      {
        runStreamed: () =>
          createAsyncGenerator([
            {
              ts: new Date().toISOString(),
              type: "turn.completed",
              raw: {
                output: { status: "FAILED", resultSummary: "Broken", error: "Test failure" }
              }
            }
          ])
      } as any,
      { emitSessionEvent: () => {} } as any
    );

    await runner.handleTaskExecution("run-1", "session-1", "task-0001");

    expect(lastTaskUpdate.status).toBe(TaskStatus.FAILED);
    expect(lastTaskUpdate.lastError).toBe("Test failure");
    expect(lastRunUpdate.status).toBe(RunStatus.FAILED);
  });
});
