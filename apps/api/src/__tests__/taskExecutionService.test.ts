import { describe, expect, it } from "vitest";
import { TaskExecutionService } from "../application/services";
import { TaskStatus } from "@coding-agent/shared";

class FakeRunService {
  async createTaskRun() {
    return { id: "run-1" } as any;
  }
}

describe("TaskExecutionService", () => {
  it("enqueues task retries with extra prompt", async () => {
    let queuePayload: any = null;
    let taskUpdate: any = null;

    const service = new TaskExecutionService(
      new FakeRunService() as any,
      {
        list: async () => [],
        update: async (_sessionId: string, _taskId: string, data: any) => {
          taskUpdate = data;
          return data;
        }
      } as any,
      {
        enqueueTask: async (_runId: string, _sessionId: string, _taskId: string, extraPrompt?: string) => {
          queuePayload = extraPrompt;
        }
      } as any
    );

    await service.retryTask("session-1", "task-0001", "Please retry with logging");

    expect(taskUpdate.status).toBe(TaskStatus.RUNNING);
    expect(queuePayload).toBe("Please retry with logging");
  });
});
