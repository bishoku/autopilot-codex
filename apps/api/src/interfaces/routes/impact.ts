import { FastifyInstance } from "fastify";
import { z } from "zod";
import { AppServices } from "./types";
import { validateBody } from "./validation";

export const registerImpactRoutes = (app: FastifyInstance, services: AppServices) => {
  app.get("/api/sessions/:id/impact-analysis", async (request, reply) => {
    const impact = await services.artifactService.getImpact((request.params as any).id);
    if (!impact) {
      return reply.status(404).send({ error: "Impact analysis not found" });
    }
    reply.send(impact);
  });

  app.put("/api/sessions/:id/impact-analysis", async (request, reply) => {
    const body = await validateBody(
      request,
      reply,
      z.object({
        impactId: z.string(),
        impactLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
        affectedModules: z.array(z.string()),
        explanation: z.string(),
        risks: z.array(z.string()).optional(),
        assumptions: z.array(z.string()).optional()
      })
    );
    if (!body) return;

    const impact = await services.artifactService.upsertImpact((request.params as any).id, body);
    reply.send(impact);
  });
};
