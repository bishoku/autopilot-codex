import { spawn } from "node:child_process";
import readline from "node:readline";
import { CodexClient, CodexEvent } from "../../application/ports";

const buildArgs = (prompt: string, outputSchema?: Record<string, unknown>) => {
  const args = ["exec", "--json", "--full-auto", prompt];
  if (outputSchema) {
    args.splice(2, 0, "--output-schema", JSON.stringify(outputSchema));
  }
  return args;
};

export class CodexCliClient implements CodexClient {
  async startThread(_input: { workingDirectory: string; skipGitRepoCheck: boolean }) {
    return { threadId: "cli" };
  }

  async resumeThread(_threadId: string) {
    return;
  }

  async *runStreamed(input: {
    threadId?: string | null;
    prompt: string;
    outputSchema?: Record<string, unknown>;
    workingDirectory: string;
    fullAuto?: boolean;
  }): AsyncGenerator<CodexEvent, void, void> {
    const args = buildArgs(input.prompt, input.outputSchema);
    const child = spawn("codex", args, {
      cwd: input.workingDirectory,
      env: process.env
    });

    const rl = readline.createInterface({ input: child.stdout });

    for await (const line of rl) {
      try {
        const parsed = JSON.parse(line) as Record<string, unknown>;
        yield {
          ts: new Date().toISOString(),
          type: (parsed.type as string) ?? "event",
          itemType: (parsed.item as any)?.type,
          message: (parsed.message as string) ?? undefined,
          raw: parsed
        };
      } catch {
        yield {
          ts: new Date().toISOString(),
          type: "log",
          message: line,
          raw: { line }
        };
      }
    }

    if (child.stderr) {
      const stderrRl = readline.createInterface({ input: child.stderr });
      for await (const line of stderrRl) {
        yield {
          ts: new Date().toISOString(),
          type: "stderr",
          message: line,
          raw: { line }
        };
      }
    }
  }
}
