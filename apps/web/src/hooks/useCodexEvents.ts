import { useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";

const WS_URL = import.meta.env.VITE_WS_URL ?? "http://localhost:3001";

export type CodexEvent = {
  sessionId: string;
  runId: string;
  stage: string;
  ts: string;
  type: string;
  itemType?: string;
  message?: string;
  raw: Record<string, unknown>;
};

export const useCodexEvents = (sessionId?: string) => {
  const [events, setEvents] = useState<CodexEvent[]>([]);
  const [status, setStatus] = useState("disconnected");

  const socket = useMemo<Socket>(() => io(WS_URL, { transports: ["websocket"] }), []);

  useEffect(() => {
    const onConnect = () => setStatus("connected");
    const onDisconnect = () => setStatus("disconnected");

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    socket.on("codex.event", (payload: CodexEvent) => {
      setEvents((prev) => [payload, ...prev].slice(0, 500));
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("codex.event");
      socket.disconnect();
    };
  }, [socket]);

  useEffect(() => {
    if (!sessionId) return;
    socket.emit("session:join", { sessionId });
    return () => {
      socket.emit("session:leave", { sessionId });
    };
  }, [sessionId, socket]);

  return { events, status };
};
