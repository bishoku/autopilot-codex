export const Stage = {
  INTENT: "INTENT",
  REQUIREMENTS: "REQUIREMENTS",
  ACCEPTANCE_CRITERIA: "ACCEPTANCE_CRITERIA",
  IMPACT_ANALYSIS: "IMPACT_ANALYSIS",
  TASKS: "TASKS",
  EXECUTION: "EXECUTION",
  SUMMARY: "SUMMARY"
} as const;

export type Stage = (typeof Stage)[keyof typeof Stage];

export const RunStatus = {
  QUEUED: "QUEUED",
  RUNNING: "RUNNING",
  SUCCEEDED: "SUCCEEDED",
  FAILED: "FAILED"
} as const;

export type RunStatus = (typeof RunStatus)[keyof typeof RunStatus];

export const TaskStatus = {
  PENDING: "PENDING",
  RUNNING: "RUNNING",
  SUCCEEDED: "SUCCEEDED",
  FAILED: "FAILED",
  SKIPPED: "SKIPPED"
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const ImpactLevel = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH"
} as const;

export type ImpactLevel = (typeof ImpactLevel)[keyof typeof ImpactLevel];
