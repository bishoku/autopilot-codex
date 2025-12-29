import { FastifyInstance } from "fastify";
import { z } from "zod";
import { AppServices } from "./types";
import { validateQuery } from "./validation";

export const registerRunRoutes = (app: FastifyInstance, services: AppServices) => {
  app.get("/api/sessions/:id/runs", async (request, reply) => {
    const runs = await services.runService.listRuns((request.params as any).id);
    reply.send(runs);
  });

  app.get("/api/runs/:runId", async (request, reply) => {
    const run = await services.runService.getRun((request.params as any).runId);
    if (!run) {
      return reply.status(404).send({ error: "Run not found" });
    }
    reply.send(run);
  });

  app.get("/api/runs/:runId/events", async (request, reply) => {
    const query = await validateQuery(
      request,
      reply,
      z.object({
        limit: z.coerce.number().int().min(1).max(500).default(100),
        offset: z.coerce.number().int().min(0).default(0)
      })
    );
    if (!query) return;

    const events = await services.runEventRepository.listEvents((request.params as any).runId, query);
    reply.send(events);
  });
};
