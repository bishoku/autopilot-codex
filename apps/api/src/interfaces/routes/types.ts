import {
  ArtifactService,
  RunService,
  SessionService,
  StageGenerationService,
  TaskExecutionService
} from "../../application/services";
import { RunEventRepository } from "../../application/ports";

export type AppServices = {
  sessionService: SessionService;
  stageService: StageGenerationService;
  artifactService: ArtifactService;
  taskExecutionService: TaskExecutionService;
  runService: RunService;
  runEventRepository: RunEventRepository;
};
