import { RunRepository } from "../ports";
import { RunStatus, Stage } from "@coding-agent/shared";

export class RunService {
  constructor(private readonly runs: RunRepository) {}

  createStageRun(sessionId: string, stage: Stage) {
    return this.runs.createRun({ sessionId, stage, status: RunStatus.QUEUED });
  }

  createTaskRun(sessionId: string, taskId: string) {
    return this.runs.createRun({ sessionId, stage: Stage.EXECUTION, status: RunStatus.QUEUED, taskId });
  }

  updateRun(runId: string, data: any) {
    return this.runs.updateRun(runId, data);
  }

  getRun(runId: string) {
    return this.runs.getRun(runId);
  }

  listRuns(sessionId: string) {
    return this.runs.listRuns(sessionId);
  }
}
