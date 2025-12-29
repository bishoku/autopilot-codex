import { z } from "zod";
import { ImpactLevel, RunStatus, Stage, TaskStatus } from "./enums";

export const sessionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
  projectPath: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  codexThreadId: z.string().nullable(),
  currentStage: z.nativeEnum(Stage).nullable()
});

export const intentSchema = z.object({
  sessionId: z.string().uuid(),
  text: z.string()
});

export const requirementSchema = z.object({
  sessionId: z.string().uuid(),
  reqId: z.string(),
  shortName: z.string(),
  currentState: z.string(),
  desiredState: z.string(),
  explanation: z.string(),
  order: z.number().int()
});

export const acceptanceCriterionSchema = z.object({
  sessionId: z.string().uuid(),
  acId: z.string(),
  requirementReqId: z.string(),
  given: z.string(),
  when: z.string(),
  then: z.string(),
  rendered: z.string(),
  order: z.number().int()
});

export const impactAnalysisSchema = z.object({
  sessionId: z.string().uuid(),
  impactId: z.string(),
  impactLevel: z.nativeEnum(ImpactLevel),
  affectedModules: z.array(z.string()),
  explanation: z.string(),
  risks: z.array(z.string()).optional(),
  assumptions: z.array(z.string()).optional()
});

export const taskSchema = z.object({
  sessionId: z.string().uuid(),
  taskId: z.string(),
  shortName: z.string(),
  description: z.string(),
  relatedRequirementIds: z.array(z.string()).optional(),
  status: z.nativeEnum(TaskStatus),
  attempts: z.number().int(),
  lastError: z.string().nullable().optional(),
  resultSummary: z.string().nullable().optional(),
  order: z.number().int()
});

export const runSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  stage: z.nativeEnum(Stage),
  status: z.nativeEnum(RunStatus),
  startedAt: z.string().nullable(),
  endedAt: z.string().nullable(),
  error: z.string().nullable(),
  taskId: z.string().nullable()
});

export const runEventSchema = z.object({
  id: z.string().uuid(),
  runId: z.string().uuid(),
  ts: z.string(),
  type: z.string(),
  payload: z.record(z.unknown())
});

export type SessionDto = z.infer<typeof sessionSchema>;
export type IntentDto = z.infer<typeof intentSchema>;
export type RequirementDto = z.infer<typeof requirementSchema>;
export type AcceptanceCriterionDto = z.infer<typeof acceptanceCriterionSchema>;
export type ImpactAnalysisDto = z.infer<typeof impactAnalysisSchema>;
export type TaskDto = z.infer<typeof taskSchema>;
export type RunDto = z.infer<typeof runSchema>;
export type RunEventDto = z.infer<typeof runEventSchema>;
