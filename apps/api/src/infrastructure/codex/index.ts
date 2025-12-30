import { CodexClient, CodexEvent } from "../../application/ports";
import { CodexCliClient } from "./codexCliClient";
import { CodexSdkClient } from "./codexSdkClient";

export class CodexClientFacade implements CodexClient {
  private readonly sdkClient = new CodexSdkClient();
  private readonly cliClient = new CodexCliClient();

  async startThread(input: { workingDirectory: string; skipGitRepoCheck: boolean }) {
    return this.sdkClient.startThread(input);
  }

  async resumeThread(threadId: string) {
    return this.sdkClient.resumeThread(threadId);
  }

  runStreamed(input: {
    threadId?: string | null;
    prompt: string;
    outputSchema?: Record<string, unknown>;
    workingDirectory: string;
    fullAuto?: boolean;
  }): AsyncGenerator<CodexEvent, void, void> {
   /* if (input.fullAuto) {
      return this.cliClient.runStreamed(input);
    }*/
    return this.sdkClient.runStreamed(input);
  }
}
