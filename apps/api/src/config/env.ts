import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 3001),
  databaseUrl: process.env.DATABASE_URL ?? "",
  codexBinPath: process.env.CODEX_BIN_PATH ?? "",
  wsServerUrl: process.env.WS_SERVER_URL ?? "http://localhost:3001"
};
