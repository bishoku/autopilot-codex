import { env } from "./config/env";
import { buildServer } from "./server";
import { registerRoutes } from "./interfaces/routes";
import { initSocketServer } from "./interfaces/websocket/socketServer";
import { createAppContext } from "./infrastructure/container";
import { SocketServerEventBus } from "./infrastructure/websocket/socketEventBus";
import {
  ArtifactService,
  RunService,
  SessionService,
  StageGenerationService,
  StageRunner,
  TaskExecutionService
} from "./application/services";

const start = async () => {
  const app = buildServer();
  const io = initSocketServer(app);

  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const ctx = createAppContext(new SocketServerEventBus(io));

  const runService = new RunService(ctx.runs);
  const runner = new StageRunner(
    ctx.sessions,
    ctx.intents,
    ctx.requirements,
    ctx.acceptance,
    ctx.impact,
    ctx.tasks,
    ctx.runs,
    ctx.events,
    ctx.codex,
    ctx.eventBus
  );
  const services = {
    sessionService: new SessionService(ctx.sessions, ctx.intents, ctx.codex),
    stageService: new StageGenerationService(runService, runner),
    artifactService: new ArtifactService(ctx.requirements, ctx.acceptance, ctx.impact, ctx.tasks),
    taskExecutionService: new TaskExecutionService(runService, ctx.tasks, runner),
    runService,
    runEventRepository: ctx.events
  };

  registerRoutes(app, services);

  try {
    await app.listen({ port: env.port, host: "0.0.0.0" });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

void start();
