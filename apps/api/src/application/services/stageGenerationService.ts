import { RunService } from "./runService";
import { Stage } from "@coding-agent/shared";
import { StageRunner } from "./stageRunner";

export class StageGenerationService {
  constructor(private readonly runs: RunService, private readonly runner: StageRunner) {}

  async requestStageGeneration(sessionId: string, stage: Stage) {
    const run = await this.runs.createStageRun(sessionId, stage);
    await this.runner.handleStageGeneration(run.id, sessionId, stage);
    return run;
  }
}
