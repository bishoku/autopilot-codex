import { TaskRepository } from "../ports";
import { RunService } from "./runService";
import { TaskStatus } from "@coding-agent/shared";
import { v4 as uuid } from "uuid";
import { StageRunner } from "./stageRunner";

export class TaskExecutionService {
  constructor(
    private readonly runs: RunService,
    private readonly tasks: TaskRepository,
    private readonly runner: StageRunner
  ) {}

  async startExecution(sessionId: string, selectedTaskIds?: string[]) {
    const tasks = await this.tasks.list(sessionId);
    const filtered = selectedTaskIds?.length
      ? tasks.filter((task) => selectedTaskIds.includes(task.taskId))
      : tasks;

    for (const task of filtered) {
      const run = await this.runs.createTaskRun(sessionId, task.taskId);
      await this.tasks.update(sessionId, task.taskId, { status: TaskStatus.RUNNING });
      await this.runner.handleTaskExecution(run.id, sessionId, task.taskId);
    }

    return { executionId: uuid() };
  }

  async executeTask(sessionId: string, taskId: string) {
    const run = await this.runs.createTaskRun(sessionId, taskId);
    await this.tasks.update(sessionId, taskId, { status: TaskStatus.RUNNING });
    await this.runner.handleTaskExecution(run.id, sessionId, taskId);
    return run;
  }

  async retryTask(sessionId: string, taskId: string, extraPrompt?: string) {
    const run = await this.runs.createTaskRun(sessionId, taskId);
    await this.tasks.update(sessionId, taskId, { status: TaskStatus.RUNNING });
    await this.runner.handleTaskExecution(run.id, sessionId, taskId, extraPrompt);
    return run;
  }
}
