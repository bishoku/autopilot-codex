import { ImpactLevel, RunStatus, Stage, TaskStatus } from "@coding-agent/shared";

export type SessionRecord = {
  id: string;
  name: string | null;
  projectPath: string;
  createdAt: Date;
  updatedAt: Date;
  codexThreadId: string | null;
  currentStage: Stage | null;
};

export type IntentRecord = {
  sessionId: string;
  text: string;
  updatedAt: Date;
};

export type RequirementRecord = {
  sessionId: string;
  reqId: string;
  shortName: string;
  currentState: string;
  desiredState: string;
  explanation: string;
  order: number;
  updatedAt: Date;
};

export type AcceptanceCriterionRecord = {
  sessionId: string;
  acId: string;
  requirementReqId: string;
  given: string;
  when: string;
  then: string;
  rendered: string;
  order: number;
  updatedAt: Date;
};

export type ImpactAnalysisRecord = {
  sessionId: string;
  impactId: string;
  impactLevel: ImpactLevel;
  affectedModules: string[];
  explanation: string;
  risks?: string[];
  assumptions?: string[];
  updatedAt: Date;
};

export type TaskRecord = {
  sessionId: string;
  taskId: string;
  shortName: string;
  description: string;
  relatedRequirementIds?: string[];
  status: TaskStatus;
  attempts: number;
  lastError?: string | null;
  resultSummary?: string | null;
  order: number;
  updatedAt: Date;
};

export type RunRecord = {
  id: string;
  sessionId: string;
  stage: Stage;
  status: RunStatus;
  startedAt: Date | null;
  endedAt: Date | null;
  error: string | null;
  taskId: string | null;
};

export type RunEventRecord = {
  id: string;
  runId: string;
  ts: Date;
  type: string;
  payload: Record<string, unknown>;
};

export type CodexEvent = {
  ts: string;
  type: string;
  itemType?: string;
  message?: string;
  raw: Record<string, unknown>;
};

export interface SessionRepository {
  createSession(input: { name?: string | null; projectPath: string; codexThreadId?: string | null }): Promise<SessionRecord>;
  listSessions(): Promise<SessionRecord[]>;
  getSession(id: string): Promise<SessionRecord | null>;
  updateSession(id: string, data: Partial<Pick<SessionRecord, "name" | "projectPath" | "currentStage" | "codexThreadId">>): Promise<SessionRecord>;
}

export interface IntentRepository {
  upsertIntent(sessionId: string, text: string): Promise<IntentRecord>;
  getIntent(sessionId: string): Promise<IntentRecord | null>;
}

export interface RequirementRepository {
  list(sessionId: string): Promise<RequirementRecord[]>;
  create(sessionId: string, record: Omit<RequirementRecord, "sessionId" | "updatedAt">): Promise<RequirementRecord>;
  update(sessionId: string, reqId: string, data: Partial<RequirementRecord>): Promise<RequirementRecord>;
  delete(sessionId: string, reqId: string): Promise<void>;
  upsertMany(sessionId: string, records: Omit<RequirementRecord, "sessionId" | "updatedAt">[]): Promise<void>;
}

export interface AcceptanceRepository {
  list(sessionId: string): Promise<AcceptanceCriterionRecord[]>;
  create(sessionId: string, record: Omit<AcceptanceCriterionRecord, "sessionId" | "updatedAt">): Promise<AcceptanceCriterionRecord>;
  update(sessionId: string, acId: string, data: Partial<AcceptanceCriterionRecord>): Promise<AcceptanceCriterionRecord>;
  delete(sessionId: string, acId: string): Promise<void>;
  upsertMany(sessionId: string, records: Omit<AcceptanceCriterionRecord, "sessionId" | "updatedAt">[]): Promise<void>;
}

export interface ImpactRepository {
  get(sessionId: string): Promise<ImpactAnalysisRecord | null>;
  upsert(sessionId: string, record: Omit<ImpactAnalysisRecord, "sessionId" | "updatedAt">): Promise<ImpactAnalysisRecord>;
}

export interface TaskRepository {
  list(sessionId: string): Promise<TaskRecord[]>;
  create(sessionId: string, record: Omit<TaskRecord, "sessionId" | "updatedAt">): Promise<TaskRecord>;
  update(sessionId: string, taskId: string, data: Partial<TaskRecord>): Promise<TaskRecord>;
  delete(sessionId: string, taskId: string): Promise<void>;
  upsertMany(sessionId: string, records: Omit<TaskRecord, "sessionId" | "updatedAt">[]): Promise<void>;
}

export interface RunRepository {
  createRun(input: { sessionId: string; stage: Stage; status: RunStatus; taskId?: string | null }): Promise<RunRecord>;
  updateRun(runId: string, data: Partial<RunRecord>): Promise<RunRecord>;
  getRun(runId: string): Promise<RunRecord | null>;
  listRuns(sessionId: string): Promise<RunRecord[]>;
}

export interface RunEventRepository {
  createEvent(input: { runId: string; ts: Date; type: string; payload: Record<string, unknown> }): Promise<RunEventRecord>;
  listEvents(runId: string, options: { limit: number; offset: number }): Promise<RunEventRecord[]>;
}

export interface CodexClient {
  startThread(input: { workingDirectory: string; skipGitRepoCheck: boolean }): Promise<{ threadId: string | null }>;
  resumeThread(threadId: string): Promise<void>;
  runStreamed(input: {
    threadId?: string | null;
    prompt: string;
    outputSchema?: Record<string, unknown>;
    workingDirectory: string;
    fullAuto?: boolean;
  }): AsyncGenerator<CodexEvent, void, void>;
}


export interface EventBus {
  emitSessionEvent(sessionId: string, payload: {
    sessionId: string;
    runId: string;
    stage: Stage;
    ts: string;
    type: string;
    itemType?: string;
    message?: string;
    raw: Record<string, unknown>;
  }): void;
}
