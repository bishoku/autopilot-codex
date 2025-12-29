import { FastifyInstance } from "fastify";
import { AppServices } from "./types";
import { registerSessionRoutes } from "./sessions";
import { registerStageRoutes } from "./stages";
import { registerRequirementRoutes } from "./requirements";
import { registerAcceptanceRoutes } from "./acceptance";
import { registerImpactRoutes } from "./impact";
import { registerTaskRoutes } from "./tasks";
import { registerExecutionRoutes } from "./execution";
import { registerRunRoutes } from "./runs";

export const registerRoutes = (app: FastifyInstance, services: AppServices) => {
  registerSessionRoutes(app, services);
  registerStageRoutes(app, services);
  registerRequirementRoutes(app, services);
  registerAcceptanceRoutes(app, services);
  registerImpactRoutes(app, services);
  registerTaskRoutes(app, services);
  registerExecutionRoutes(app, services);
  registerRunRoutes(app, services);
};
