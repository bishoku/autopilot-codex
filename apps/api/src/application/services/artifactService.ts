import {
  AcceptanceRepository,
  ImpactRepository,
  RequirementRepository,
  TaskRepository
} from "../ports";
import { TaskStatus } from "@coding-agent/shared";

export class ArtifactService {
  constructor(
    private readonly requirements: RequirementRepository,
    private readonly acceptance: AcceptanceRepository,
    private readonly impact: ImpactRepository,
    private readonly tasks: TaskRepository
  ) {}

  listRequirements(sessionId: string) {
    return this.requirements.list(sessionId);
  }

  createRequirement(sessionId: string, data: any) {
    return this.requirements.create(sessionId, data);
  }

  updateRequirement(sessionId: string, reqId: string, data: any) {
    return this.requirements.update(sessionId, reqId, data);
  }

  deleteRequirement(sessionId: string, reqId: string) {
    return this.requirements.delete(sessionId, reqId);
  }

  listAcceptance(sessionId: string) {
    return this.acceptance.list(sessionId);
  }

  createAcceptance(sessionId: string, data: any) {
    return this.acceptance.create(sessionId, data);
  }

  updateAcceptance(sessionId: string, acId: string, data: any) {
    return this.acceptance.update(sessionId, acId, data);
  }

  deleteAcceptance(sessionId: string, acId: string) {
    return this.acceptance.delete(sessionId, acId);
  }

  getImpact(sessionId: string) {
    return this.impact.get(sessionId);
  }

  upsertImpact(sessionId: string, data: any) {
    return this.impact.upsert(sessionId, data);
  }

  listTasks(sessionId: string) {
    return this.tasks.list(sessionId);
  }

  createTask(sessionId: string, data: any) {
    return this.tasks.create(sessionId, {
      ...data,
      status: data.status ?? TaskStatus.PENDING,
      attempts: data.attempts ?? 0
    });
  }

  updateTask(sessionId: string, taskId: string, data: any) {
    return this.tasks.update(sessionId, taskId, data);
  }

  deleteTask(sessionId: string, taskId: string) {
    return this.tasks.delete(sessionId, taskId);
  }
}
