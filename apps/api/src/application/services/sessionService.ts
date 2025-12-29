import { SessionRepository, IntentRepository, CodexClient } from "../ports";
import { Stage } from "@coding-agent/shared";

export class SessionService {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly intents: IntentRepository,
    private readonly codex: CodexClient
  ) {}

  async createSession(input: { projectPath: string; name?: string | null }) {
    return this.sessions.createSession({
      name: input.name ?? null,
      projectPath: input.projectPath,
      codexThreadId: null
    });
  }

  listSessions() {
    return this.sessions.listSessions();
  }

  getSession(id: string) {
    return this.sessions.getSession(id);
  }

  updateSession(id: string, data: { name?: string | null; projectPath?: string }) {
    return this.sessions.updateSession(id, data);
  }

  async setIntent(sessionId: string, intentText: string) {
    await this.intents.upsertIntent(sessionId, intentText);
    await this.sessions.updateSession(sessionId, { currentStage: Stage.INTENT });
  }
}
