import { Server } from "socket.io";
import { FastifyInstance } from "fastify";

export const initSocketServer = (app: FastifyInstance) => {
  const io = new Server(app.server, {
    cors: {
      origin: true
    }
  });

  io.on("connection", (socket) => {
    socket.on("session:join", ({ sessionId }) => {
      if (sessionId) {
        socket.join(`session:${sessionId}`);
      }
    });

    socket.on("session:leave", ({ sessionId }) => {
      if (sessionId) {
        socket.leave(`session:${sessionId}`);
      }
    });

    socket.on("codex.event", ({ room, payload }) => {
      if (room && payload) {
        io.to(room).emit("codex.event", payload);
      }
    });
  });

  return io;
};
