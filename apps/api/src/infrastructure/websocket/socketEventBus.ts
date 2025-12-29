import { Server } from "socket.io";
import { io as socketClient, Socket } from "socket.io-client";
import { EventBus } from "../../application/ports";
import { env } from "../../config/env";

export class SocketServerEventBus implements EventBus {
  constructor(private readonly io: Server) {}

  emitSessionEvent(sessionId: string, payload: {
    sessionId: string;
    runId: string;
    stage: string;
    ts: string;
    type: string;
    itemType?: string;
    message?: string;
    raw: Record<string, unknown>;
  }) {
    this.io.to(`session:${sessionId}`).emit("codex.event", payload);
  }
}

export class SocketClientEventBus implements EventBus {
  private socket: Socket;

  constructor() {
    this.socket = socketClient(env.wsServerUrl, {
      transports: ["websocket"],
      autoConnect: true
    });
  }

  emitSessionEvent(sessionId: string, payload: {
    sessionId: string;
    runId: string;
    stage: string;
    ts: string;
    type: string;
    itemType?: string;
    message?: string;
    raw: Record<string, unknown>;
  }) {
    this.socket.emit("codex.event", { room: `session:${sessionId}`, payload });
  }
}

export class NoopEventBus implements EventBus {
  emitSessionEvent() {
    return;
  }
}
