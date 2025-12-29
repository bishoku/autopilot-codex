import { FastifyInstance } from "fastify";
import { z } from "zod";
import { AppServices } from "./types";
import { validateBody } from "./validation";

export const registerExecutionRoutes = (app: FastifyInstance, services: AppServices) => {
  app.post("/api/sessions/:id/execution/start", async (request, reply) => {
    const body = await validateBody(
      request,
      reply,
      z.object({
        mode: z.enum(["SEQUENTIAL", "PARALLEL"]).optional(),
        selectedTaskIds: z.array(z.string()).optional()
      })
    );
    if (!body) return;

    const result = await services.taskExecutionService.startExecution(
      (request.params as any).id,
      body.selectedTaskIds
    );
    reply.send(result);
  });

  app.post("/api/sessions/:id/tasks/:taskId/execute", async (request, reply) => {
    const run = await services.taskExecutionService.executeTask(
      (request.params as any).id,
      (request.params as any).taskId
    );
    reply.send({ runId: run.id });
  });

  app.post("/api/sessions/:id/tasks/:taskId/retry", async (request, reply) => {
    const body = await validateBody(request, reply, z.object({ extraPrompt: z.string() }));
    if (!body) return;

    const run = await services.taskExecutionService.retryTask(
      (request.params as any).id,
      (request.params as any).taskId,
      body.extraPrompt
    );
    reply.send({ runId: run.id });
  });
};
