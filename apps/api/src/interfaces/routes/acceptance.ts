import { FastifyInstance } from "fastify";
import { z } from "zod";
import { AppServices } from "./types";
import { validateBody } from "./validation";

export const registerAcceptanceRoutes = (app: FastifyInstance, services: AppServices) => {
  app.get("/api/sessions/:id/acceptance-criteria", async (request, reply) => {
    const items = await services.artifactService.listAcceptance((request.params as any).id);
    reply.send(items);
  });

  app.post("/api/sessions/:id/acceptance-criteria", async (request, reply) => {
    const body = await validateBody(
      request,
      reply,
      z.object({
        acId: z.string(),
        requirementReqId: z.string(),
        given: z.string(),
        when: z.string(),
        then: z.string(),
        rendered: z.string(),
        order: z.number().int()
      })
    );
    if (!body) return;

    const item = await services.artifactService.createAcceptance((request.params as any).id, body);
    reply.send(item);
  });

  app.patch("/api/sessions/:id/acceptance-criteria/:acId", async (request, reply) => {
    const body = await validateBody(
      request,
      reply,
      z
        .object({
          requirementReqId: z.string().optional(),
          given: z.string().optional(),
          when: z.string().optional(),
          then: z.string().optional(),
          rendered: z.string().optional(),
          order: z.number().int().optional()
        })
        .refine((data) => Object.keys(data).length > 0, { message: "No updates" })
    );
    if (!body) return;

    const item = await services.artifactService.updateAcceptance(
      (request.params as any).id,
      (request.params as any).acId,
      body
    );
    reply.send(item);
  });

  app.delete("/api/sessions/:id/acceptance-criteria/:acId", async (request, reply) => {
    await services.artifactService.deleteAcceptance((request.params as any).id, (request.params as any).acId);
    reply.send({ ok: true });
  });
};
