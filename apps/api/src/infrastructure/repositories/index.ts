import { PrismaClient } from "@prisma/client";
import {
  AcceptanceRepository,
  ImpactRepository,
  IntentRepository,
  RequirementRepository,
  RunEventRepository,
  RunRepository,
  SessionRepository,
  TaskRepository
} from "../../application/ports";

export class PrismaSessionRepository implements SessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  createSession(input: { name?: string | null; projectPath: string; codexThreadId?: string | null }) {
    return this.prisma.session.create({
      data: {
        name: input.name ?? null,
        projectPath: input.projectPath,
        codexThreadId: input.codexThreadId ?? null
      }
    });
  }

  listSessions() {
    return this.prisma.session.findMany({ orderBy: { createdAt: "desc" } });
  }

  getSession(id: string) {
    return this.prisma.session.findUnique({ where: { id } });
  }

  updateSession(id: string, data: { name?: string | null; projectPath?: string; currentStage?: any; codexThreadId?: string | null }) {
    return this.prisma.session.update({
      where: { id },
      data
    });
  }
}

export class PrismaIntentRepository implements IntentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  upsertIntent(sessionId: string, text: string) {
    return this.prisma.intent.upsert({
      where: { sessionId },
      create: { sessionId, text },
      update: { text }
    });
  }

  getIntent(sessionId: string) {
    return this.prisma.intent.findUnique({ where: { sessionId } });
  }
}

export class PrismaRequirementRepository implements RequirementRepository {
  constructor(private readonly prisma: PrismaClient) {}

  list(sessionId: string) {
    return this.prisma.requirement.findMany({ where: { sessionId }, orderBy: { order: "asc" } });
  }

  create(sessionId: string, record: any) {
    return this.prisma.requirement.create({
      data: {
        sessionId,
        reqId: record.reqId,
        shortName: record.shortName,
        currentState: record.currentState,
        desiredState: record.desiredState,
        explanation: record.explanation,
        order: record.order
      }
    });
  }

  update(sessionId: string, reqId: string, data: any) {
    return this.prisma.requirement.update({
      where: { sessionId_reqId: { sessionId, reqId } },
      data
    });
  }

  async delete(sessionId: string, reqId: string) {
    await this.prisma.requirement.delete({ where: { sessionId_reqId: { sessionId, reqId } } });
  }

  async upsertMany(sessionId: string, records: any[]) {
    await this.prisma.$transaction([
      this.prisma.requirement.deleteMany({ where: { sessionId } }),
      this.prisma.requirement.createMany({
        data: records.map((record) => ({
          sessionId,
          reqId: record.reqId,
          shortName: record.shortName,
          currentState: record.currentState,
          desiredState: record.desiredState,
          explanation: record.explanation,
          order: record.order
        }))
      })
    ]);
  }
}

export class PrismaAcceptanceRepository implements AcceptanceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  list(sessionId: string) {
    return this.prisma.acceptanceCriterion.findMany({ where: { sessionId }, orderBy: { order: "asc" } });
  }

  create(sessionId: string, record: any) {
    return this.prisma.acceptanceCriterion.create({
      data: {
        sessionId,
        acId: record.acId,
        requirementReqId: record.requirementReqId,
        given: record.given,
        when: record.when,
        then: record.then,
        rendered: record.rendered,
        order: record.order
      }
    });
  }

  update(sessionId: string, acId: string, data: any) {
    return this.prisma.acceptanceCriterion.update({
      where: { sessionId_acId: { sessionId, acId } },
      data
    });
  }

  async delete(sessionId: string, acId: string) {
    await this.prisma.acceptanceCriterion.delete({ where: { sessionId_acId: { sessionId, acId } } });
  }

  async upsertMany(sessionId: string, records: any[]) {
    await this.prisma.$transaction([
      this.prisma.acceptanceCriterion.deleteMany({ where: { sessionId } }),
      this.prisma.acceptanceCriterion.createMany({
        data: records.map((record) => ({
        sessionId,
        acId: record.acId,
        requirementReqId: record.requirementReqId,
        given: record.given,
        when: record.when,
        then: record.then,
        rendered: record.rendered,
        order: record.order
      }))
    })
  ]);
}
}

export class PrismaImpactRepository implements ImpactRepository {
  constructor(private readonly prisma: PrismaClient) {}

  get(sessionId: string) {
    return this.prisma.impactAnalysis.findUnique({ where: { sessionId } });
  }

  upsert(sessionId: string, record: any) {
    return this.prisma.impactAnalysis.upsert({
      where: { sessionId },
      create: {
        sessionId,
        impactId: record.impactId,
        impactLevel: record.impactLevel,
        affectedModules: record.affectedModules,
        explanation: record.explanation,
        risks: record.risks ?? undefined,
        assumptions: record.assumptions ?? undefined
      },
      update: {
        impactId: record.impactId,
        impactLevel: record.impactLevel,
        affectedModules: record.affectedModules,
        explanation: record.explanation,
        risks: record.risks ?? undefined,
        assumptions: record.assumptions ?? undefined
      }
    });
  }
}

export class PrismaTaskRepository implements TaskRepository {
  constructor(private readonly prisma: PrismaClient) {}

  list(sessionId: string) {
    return this.prisma.task.findMany({ where: { sessionId }, orderBy: { order: "asc" } });
  }

  create(sessionId: string, record: any) {
    return this.prisma.task.create({
      data: {
        sessionId,
        taskId: record.taskId,
        shortName: record.shortName,
        description: record.description,
        relatedRequirementIds: record.relatedRequirementIds ?? undefined,
        status: record.status,
        attempts: record.attempts,
        lastError: record.lastError ?? null,
        resultSummary: record.resultSummary ?? null,
        order: record.order
      }
    });
  }

  update(sessionId: string, taskId: string, data: any) {
    return this.prisma.task.update({
      where: { sessionId_taskId: { sessionId, taskId } },
      data
    });
  }

  async delete(sessionId: string, taskId: string) {
    await this.prisma.task.delete({ where: { sessionId_taskId: { sessionId, taskId } } });
  }

  async upsertMany(sessionId: string, records: any[]) {
    await this.prisma.$transaction([
      this.prisma.task.deleteMany({ where: { sessionId } }),
      this.prisma.task.createMany({
        data: records.map((record) => ({
          sessionId,
          taskId: record.taskId,
          shortName: record.shortName,
          description: record.description,
          relatedRequirementIds: record.relatedRequirementIds ?? undefined,
          status: record.status,
          attempts: record.attempts,
          lastError: record.lastError ?? null,
          resultSummary: record.resultSummary ?? null,
          order: record.order
        }))
      })
    ]);
  }
}

export class PrismaRunRepository implements RunRepository {
  constructor(private readonly prisma: PrismaClient) {}

  createRun(input: { sessionId: string; stage: any; status: any; taskId?: string | null }) {
    return this.prisma.run.create({
      data: {
        sessionId: input.sessionId,
        stage: input.stage,
        status: input.status,
        taskId: input.taskId ?? null
      }
    });
  }

  updateRun(runId: string, data: any) {
    return this.prisma.run.update({ where: { id: runId }, data });
  }

  getRun(runId: string) {
    return this.prisma.run.findUnique({ where: { id: runId } });
  }

  listRuns(sessionId: string) {
    return this.prisma.run.findMany({ where: { sessionId }, orderBy: { startedAt: "desc" } });
  }
}

export class PrismaRunEventRepository implements RunEventRepository {
  constructor(private readonly prisma: PrismaClient) {}

  createEvent(input: { runId: string; ts: Date; type: string; payload: Record<string, unknown> }) {
    return this.prisma.runEvent.create({
      data: {
        runId: input.runId,
        ts: input.ts,
        type: input.type,
        payload: input.payload
      }
    });
  }

  listEvents(runId: string, options: { limit: number; offset: number }) {
    return this.prisma.runEvent.findMany({
      where: { runId },
      orderBy: { ts: "asc" },
      skip: options.offset,
      take: options.limit
    });
  }
}
