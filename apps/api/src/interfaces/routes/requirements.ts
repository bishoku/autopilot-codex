import { FastifyInstance } from "fastify";
import { z } from "zod";
import { AppServices } from "./types";
import { validateBody } from "./validation";

export const registerRequirementRoutes = (app: FastifyInstance, services: AppServices) => {
  app.get("/api/sessions/:id/requirements", async (request, reply) => {
    const items = await services.artifactService.listRequirements((request.params as any).id);
    reply.send(items);
  });

  app.post("/api/sessions/:id/requirements", async (request, reply) => {
    const body = await validateBody(
      request,
      reply,
      z.object({
        reqId: z.string(),
        shortName: z.string(),
        currentState: z.string(),
        desiredState: z.string(),
        explanation: z.string(),
        order: z.number().int()
      })
    );
    if (!body) return;

    const item = await services.artifactService.createRequirement((request.params as any).id, body);
    reply.send(item);
  });

  app.patch("/api/sessions/:id/requirements/:reqId", async (request, reply) => {
    const body = await validateBody(
      request,
      reply,
      z
        .object({
          shortName: z.string().optional(),
          currentState: z.string().optional(),
          desiredState: z.string().optional(),
          explanation: z.string().optional(),
          order: z.number().int().optional()
        })
        .refine((data) => Object.keys(data).length > 0, { message: "No updates" })
    );
    if (!body) return;

    const item = await services.artifactService.updateRequirement(
      (request.params as any).id,
      (request.params as any).reqId,
      body
    );
    reply.send(item);
  });

  app.delete("/api/sessions/:id/requirements/:reqId", async (request, reply) => {
    await services.artifactService.deleteRequirement((request.params as any).id, (request.params as any).reqId);
    reply.send({ ok: true });
  });
};
