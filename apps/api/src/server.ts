import fastify from "fastify";
import cors from "@fastify/cors";

export const buildServer = () => {
  const app = fastify({ logger: true });

  app.register(cors, { origin: true });

  app.get("/api/health", async () => ({ ok: true }));

  return app;
};
