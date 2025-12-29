# Coding Agent

A production-ready, web-based Coding Agent that orchestrates a multi-stage product development flow with Codex, persists every artifact in Postgres, and streams live debug events to the UI.

## Monorepo Layout
- `apps/api` — Fastify + TypeScript API, Socket.IO
- `apps/web` — React + Vite + Tailwind frontend
- `packages/shared` — shared enums + zod schemas
- `infra` — docker-compose for Postgres

## Local Setup
1) Install dependencies
```
pnpm install
```

2) Start Postgres
```
docker compose -f infra/docker-compose.yml up -d
```

3) Configure env files
- `apps/api/.env.example` → `apps/api/.env`
- `apps/web/.env.example` → `apps/web/.env`

4) Run migrations
```
pnpm db:migrate
```

## Run
```
pnpm dev
```

## Architecture (Text Diagram)
```
UI (React + Tailwind)
  -> REST API (Fastify)
     -> Application Services (use-cases)
        -> Repositories (Prisma)
        -> Codex Adapter (SDK/CLI)
  -> WebSocket (Socket.IO)
     <- Codex Run Events (persisted + streamed)
```

## API Overview
- `POST /api/sessions` — create session
- `GET /api/sessions` — list sessions
- `POST /api/sessions/:id/intent` — set intent
- `POST /api/sessions/:id/stages/*/generate` — generate stage synchronously
- CRUD endpoints for requirements, acceptance criteria, impact analysis, tasks
- `POST /api/sessions/:id/execution/start` — execute tasks synchronously
- `POST /api/sessions/:id/tasks/:taskId/execute` — run one task
- `POST /api/sessions/:id/tasks/:taskId/retry` — retry with extra prompt
- `GET /api/sessions/:id/runs` — list runs
- `GET /api/runs/:runId/events` — run event history

## Notes
- All Codex events are persisted in Postgres and streamed via Socket.IO in realtime.
- Stage outputs are stored and can be reopened in any session.
