import { Codex } from "@openai/codex-sdk";
import { CodexClient, CodexEvent } from "../../application/ports";

const getThreadId = (thread: any) => thread.threadId ?? thread.id ?? null;

export class CodexSdkClient implements CodexClient {
  private readonly codex: Codex;

  constructor() {
    this.codex = new Codex();
  }

  async startThread(input: { workingDirectory: string; skipGitRepoCheck: boolean }) {
    const thread = await Promise.resolve(this.codex.startThread(input));
    return { threadId: getThreadId(thread) };
  }

  async resumeThread(threadId: string) {
    await Promise.resolve(this.codex.resumeThread(threadId));
  }

  async *runStreamed(input: {
    threadId?: string | null;
    prompt: string;
    outputSchema?: Record<string, unknown>;
    workingDirectory: string;
    fullAuto?: boolean;
  }): AsyncGenerator<CodexEvent, void, void> {
    const thread = input.threadId
      ? this.codex.resumeThread(input.threadId, {
          workingDirectory: input.workingDirectory,
          skipGitRepoCheck: true,
          sandboxMode: "workspace-write",
          approvalPolicy: "never"
        })
      : this.codex.startThread({
          workingDirectory: input.workingDirectory,
          skipGitRepoCheck: true,
          sandboxMode: "workspace-write",
          approvalPolicy: "never",
        });
    const result = await thread.runStreamed(input.prompt, {
      outputSchema: input.outputSchema
    });

    for await (const event of result.events) {
      yield {
        ts: new Date().toISOString(),
        type: event.type ?? "event",
        itemType: (event as any).item?.type,
        message: (event as any).message,
        raw: event as unknown as Record<string, unknown>
      };
    }
  }
}
