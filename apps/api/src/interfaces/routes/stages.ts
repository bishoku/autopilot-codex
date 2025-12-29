import { FastifyInstance } from "fastify";
import { Stage } from "@coding-agent/shared";
import { AppServices } from "./types";

export const registerStageRoutes = (app: FastifyInstance, services: AppServices) => {
  const generate = (stage: Stage) => async (request: any, reply: any) => {
    const sessionId = request.params.id as string;
    const run = await services.stageService.requestStageGeneration(sessionId, stage);
    reply.send({ runId: run.id });
  };

  app.post("/api/sessions/:id/stages/requirements/generate", generate(Stage.REQUIREMENTS));
  app.post("/api/sessions/:id/stages/acceptance-criteria/generate", generate(Stage.ACCEPTANCE_CRITERIA));
  app.post("/api/sessions/:id/stages/impact-analysis/generate", generate(Stage.IMPACT_ANALYSIS));
  app.post("/api/sessions/:id/stages/tasks/generate", generate(Stage.TASKS));
};
