import { useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL as string | undefined;
const DEFAULT_WS_URL = API_URL ? API_URL.replace(/\/api\/?$/, "") : "http://localhost:3001";
const WS_URL = import.meta.env.VITE_WS_URL ?? DEFAULT_WS_URL;

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

  const socket = useMemo<Socket>(
    () =>
      io(WS_URL, {
        path: "/socket.io"
      }),
    []
  );

  useEffect(() => {
    const onConnect = () => setStatus("connected");
    const onDisconnect = () => setStatus("disconnected");

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    setStatus(socket.connected ? "connected" : "disconnected");

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
