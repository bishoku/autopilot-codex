import { FastifyInstance } from "fastify";
import { z } from "zod";
import { AppServices } from "./types";
import { validateBody } from "./validation";
import { TaskStatus } from "@coding-agent/shared";

export const registerTaskRoutes = (app: FastifyInstance, services: AppServices) => {
  app.get("/api/sessions/:id/tasks", async (request, reply) => {
    const items = await services.artifactService.listTasks((request.params as any).id);
    reply.send(items);
  });

  app.post("/api/sessions/:id/tasks", async (request, reply) => {
    const body = await validateBody(
      request,
      reply,
      z.object({
        taskId: z.string(),
        shortName: z.string(),
        description: z.string(),
        relatedRequirementIds: z.array(z.string()).optional(),
        status: z.nativeEnum(TaskStatus).optional(),
        attempts: z.number().int().optional(),
        lastError: z.string().nullable().optional(),
        resultSummary: z.string().nullable().optional(),
        order: z.number().int()
      })
    );
    if (!body) return;

    const item = await services.artifactService.createTask((request.params as any).id, body);
    reply.send(item);
  });

  app.patch("/api/sessions/:id/tasks/:taskId", async (request, reply) => {
    const body = await validateBody(
      request,
      reply,
      z
        .object({
          shortName: z.string().optional(),
          description: z.string().optional(),
          relatedRequirementIds: z.array(z.string()).optional(),
          status: z.nativeEnum(TaskStatus).optional(),
          attempts: z.number().int().optional(),
          lastError: z.string().nullable().optional(),
          resultSummary: z.string().nullable().optional(),
          order: z.number().int().optional()
        })
        .refine((data) => Object.keys(data).length > 0, { message: "No updates" })
    );
    if (!body) return;

    const item = await services.artifactService.updateTask(
      (request.params as any).id,
      (request.params as any).taskId,
      body
    );
    reply.send(item);
  });

  app.delete("/api/sessions/:id/tasks/:taskId", async (request, reply) => {
    await services.artifactService.deleteTask((request.params as any).id, (request.params as any).taskId);
    reply.send({ ok: true });
  });
};
