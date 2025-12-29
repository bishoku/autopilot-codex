import { prisma } from "./prisma";
import { CodexClientFacade } from "./codex";
import {
  PrismaAcceptanceRepository,
  PrismaImpactRepository,
  PrismaIntentRepository,
  PrismaRequirementRepository,
  PrismaRunEventRepository,
  PrismaRunRepository,
  PrismaSessionRepository,
  PrismaTaskRepository
} from "./repositories";
import { NoopEventBus } from "./websocket/socketEventBus";
import { EventBus } from "../application/ports";

export const createAppContext = (eventBus?: EventBus) => {
  const sessions = new PrismaSessionRepository(prisma);
  const intents = new PrismaIntentRepository(prisma);
  const requirements = new PrismaRequirementRepository(prisma);
  const acceptance = new PrismaAcceptanceRepository(prisma);
  const impact = new PrismaImpactRepository(prisma);
  const tasks = new PrismaTaskRepository(prisma);
  const runs = new PrismaRunRepository(prisma);
  const events = new PrismaRunEventRepository(prisma);
  const codex = new CodexClientFacade();

  return {
    sessions,
    intents,
    requirements,
    acceptance,
    impact,
    tasks,
    runs,
    events,
    codex,
    eventBus: eventBus ?? new NoopEventBus()
  };
};
