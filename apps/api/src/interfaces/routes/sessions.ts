import { FastifyInstance } from "fastify";
import { z } from "zod";
import { AppServices } from "./types";
import { validateBody } from "./validation";

export const registerSessionRoutes = (app: FastifyInstance, services: AppServices) => {
  app.post("/api/sessions", async (request, reply) => {
    const body = await validateBody(
      request,
      reply,
      z.object({ projectPath: z.string().min(1), name: z.string().optional() })
    );
    if (!body) return;

    const session = await services.sessionService.createSession(body);
    reply.send(session);
  });

  app.get("/api/sessions", async (_request, reply) => {
    const sessions = await services.sessionService.listSessions();
    reply.send(sessions);
  });

  app.get("/api/sessions/:id", async (request, reply) => {
    const session = await services.sessionService.getSession((request.params as any).id);
    if (!session) {
      return reply.status(404).send({ error: "Session not found" });
    }
    reply.send(session);
  });

  app.patch("/api/sessions/:id", async (request, reply) => {
    const body = await validateBody(
      request,
      reply,
      z.object({ name: z.string().optional(), projectPath: z.string().optional() })
    );
    if (!body) return;

    const session = await services.sessionService.updateSession((request.params as any).id, body);
    reply.send(session);
  });

  app.post("/api/sessions/:id/intent", async (request, reply) => {
    const body = await validateBody(request, reply, z.object({ intentText: z.string().min(1) }));
    if (!body) return;

    await services.sessionService.setIntent((request.params as any).id, body.intentText);
    reply.send({ ok: true });
  });
};
