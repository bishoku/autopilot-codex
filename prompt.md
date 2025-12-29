You are a senior full-stack engineer. Build a production-quality, web-based “Coding Agent” application with a React + Tailwind frontend and a TypeScript backend. The system orchestrates a multi-step product-development flow powered by OpenAI Codex in the background. Follow SOLID principles, clean architecture, and make it easy to add new steps/features later. All sessions and step outputs MUST be persisted in PostgreSQL.

# 1) Product Requirements (End-to-End Flow)

## Core Concepts
- A “Session” represents a user’s end-to-end feature request on a specific local project path.
- Each Session has ordered “Stages”:
  1) Intent
  2) Requirement Briefs (editable CRUD)
  3) Acceptance Criteria (editable CRUD, Gherkin Given/When/Then)
  4) Impact Analysis (impact level + affected modules)
  5) Task List (tasks have short name + detailed description)
  6) Execution (run tasks; retry failures with extra prompt)
  7) Summary (timeline of everything; all artifacts + events + results)

## Session Behavior
- User can:
  - Create a new session (requires projectPath)
  - Resume an existing session (continue where left off)
- Every stage generation is triggered by a REST API call.
- A WebSocket “debug panel” in the UI must stream all Codex events in realtime while also persisting them to Postgres.

## Data Requirements
Persist everything:
- sessions
- stage outputs (requirements, acceptance criteria, impact analysis, tasks)
- Codex runs and streaming events (debug panel)
- task execution results, retries, timestamps, status transitions
- ability to reopen any past session and see the full history

# 2) Tech Stack & Architecture

## Monorepo
Create a monorepo (pnpm workspace recommended) with:
- /apps/web  -> React + Vite + Tailwind
- /apps/api  -> TypeScript backend (NestJS recommended for SOLID modules, but you may choose Fastify/Express if you still keep clean architecture)
- /packages/shared -> shared types (zod schemas, DTOs, enums)
- /infra -> docker compose for Postgres, local dev scripts

## Backend
- Node 18+ (required by Codex SDK)
- PostgreSQL
- Prisma ORM
- Zod for runtime validation
- Job queue using PostgreSQL only (NO Redis). Use pg-boss (or equivalent Postgres-backed job queue).
- WebSocket for events (Socket.IO or native ws). Prefer Socket.IO for rooms and reconnects.
- REST API for all operations.

### SOLID / Clean Architecture Guidance
- Separate layers:
  - Domain: entities + value objects + enums
  - Application: use-cases/services (stage generation, task execution, retry)
  - Infrastructure: prisma repositories, codex adapters, pg-boss, websocket transport
  - Interface: controllers/routes + DTO mapping
- Provide dependency inversion via interfaces (e.g., ICodexClient, IRunRepository).

## Frontend
- React + TypeScript + Tailwind
- Router: react-router
- State: TanStack Query for server state + simple local UI state
- UI structure:
  - Left navigation: Sessions list + current session stages
  - Main content: stage editor/view
  - Right collapsible Debug Panel: live Codex events from WebSocket (filter by runId, stage, event type)

### “Yapı Kredi–like” Theme
Implement a theme close to yapikredi.com.tr:
- Primary: #004587 (blue)
- Accent: #D9322D (red)
- Neutral: #A8A9AC (grey), white backgrounds
Use Tailwind config with CSS variables:
- --yk-blue, --yk-red, --yk-gray, --yk-bg, --yk-surface, --yk-border
Create a clean bank-like UI: crisp cards, subtle borders, strong CTA buttons, top header with blue background, red accent on primary CTA.

# 3) Codex Integration Requirements (Critical)

## Use Codex TypeScript SDK for streamed runs where possible
Use @openai/codex-sdk:
- Start or resume a thread per Session:
  - When a session is created: codex.startThread({ workingDirectory: projectPath, skipGitRepoCheck: true })
  - Save threadId in DB.
  - When resuming a session: codex.resumeThread(threadId)
- For intermediate progress: use runStreamed() which returns an async generator of structured events.
- For structured outputs: use outputSchema (JSON Schema) to force valid JSON for each stage result.

Important: Codex SDK wraps the Codex CLI and exchanges JSONL events; it supports run(), runStreamed(), resumeThread(), outputSchema, and setting workingDirectory.

## Fallback to Codex CLI for “full-auto” file editing if needed
If SDK cannot set “full-auto” or sandbox flags, implement an alternate adapter that invokes:
- `codex exec --json --full-auto "<taskPrompt>"`
Parse JSONL events and persist them.

## Codex Runs
Model every stage invocation as:
- Run (id, sessionId, stage, status, startedAt, endedAt, threadId, error)
- RunEvent (id, runId, ts, type, payload JSONB)
Stream each event to the client via WebSocket AND store in DB.

## Event Streaming Contract
Backend emits websocket messages:
- channel/room: session:{sessionId}
- payload:
  {
    sessionId,
    runId,
    stage,
    ts,
    type,        // e.g. "turn.started", "item.completed", "turn.completed", "error"
    itemType?,   // if applicable
    message?,    // friendly summary
    raw          // full JSON payload for debug panel
  }

# 4) Stage Output Schemas (Must match)

## Requirement Brief
Each requirement:
- id: "req-0001" style (generated)
- shortName: string
- currentState: string
- desiredState: string
- explanation: string

## Acceptance Criteria (Gherkin)
Each criterion:
- id: "ac-0001"
- requirementId: link to requirement
- given: string
- when: string
- then: string
Also store as a rendered text block:
"Given ...\nWhen ...\nThen ..."

## Impact Analysis
- id: "ia-0001"
- impactLevel: enum ["LOW","MEDIUM","HIGH"]
- affectedModules: string[] (module names / paths)
- explanation: string
- risks: string[] (optional but helpful)
- assumptions: string[] (optional)

## Task
- id: "task-0001"
- shortName: string
- description: string
- relatedRequirementIds: string[] (optional)
- status: enum ["PENDING","RUNNING","SUCCEEDED","FAILED","SKIPPED"]
- attempts: number
- lastError?: string
- resultSummary?: string

# 5) REST API Design (Must implement)

Base URL: /api

## Sessions
- POST   /sessions
  body: { projectPath: string, name?: string }
  returns: Session
- GET    /sessions
- GET    /sessions/:id
- PATCH  /sessions/:id
- POST   /sessions/:id/intent
  body: { intentText: string }

## Stage generation (async)
Each returns immediately with { runId } and the UI listens via websocket for events and polls run status.
- POST /sessions/:id/stages/requirements/generate
- POST /sessions/:id/stages/acceptance-criteria/generate
- POST /sessions/:id/stages/impact-analysis/generate
- POST /sessions/:id/stages/tasks/generate

## CRUD for artifacts
- Requirements:
  - GET /sessions/:id/requirements
  - POST /sessions/:id/requirements
  - PATCH /sessions/:id/requirements/:reqId
  - DELETE /sessions/:id/requirements/:reqId
- Acceptance Criteria:
  - GET /sessions/:id/acceptance-criteria
  - POST /sessions/:id/acceptance-criteria
  - PATCH /sessions/:id/acceptance-criteria/:acId
  - DELETE /sessions/:id/acceptance-criteria/:acId
- Impact Analysis:
  - GET /sessions/:id/impact-analysis
  - PUT /sessions/:id/impact-analysis   (single doc per session)
- Tasks:
  - GET /sessions/:id/tasks
  - POST /sessions/:id/tasks
  - PATCH /sessions/:id/tasks/:taskId
  - DELETE /sessions/:id/tasks/:taskId

## Execution
- POST /sessions/:id/execution/start
  body: { mode: "SEQUENTIAL" | "PARALLEL"(optional future), selectedTaskIds?: string[] }
  returns: { executionId }
- POST /sessions/:id/tasks/:taskId/execute
  returns: { runId } (task run)
- POST /sessions/:id/tasks/:taskId/retry
  body: { extraPrompt: string }
  returns: { runId }

## Runs & Events (for UI history)
- GET /sessions/:id/runs
- GET /runs/:runId
- GET /runs/:runId/events (paged)

# 6) Background Job Orchestration

When user calls a “generate” endpoint:
- Create Run row (status=QUEUED)
- Enqueue pg-boss job with { runId, sessionId, stage }
- Worker:
  - updates run to RUNNING
  - calls Codex adapter with runStreamed()
  - for each event:
    - persist RunEvent
    - emit websocket event to room session:{sessionId}
  - on completion:
    - parse final structured output JSON
    - upsert stage artifact records
    - run status -> SUCCEEDED
  - on error:
    - run status -> FAILED, store error

Same model for task execution runs.

# 7) Prompting Strategy (Codex must output structured JSON)

For each stage, build a carefully-scoped Codex prompt and an outputSchema JSON Schema.
Use outputSchema with Codex SDK run()/runStreamed().
If using CLI fallback, use `--output-schema` for structured output.

Stage prompts:
- Requirements: read the session intent; produce a list of requirement briefs.
- Acceptance criteria: use current requirements; produce Gherkin criteria per requirement.
- Impact analysis: inspect repo structure at projectPath; list modules impacted + impact level + explanation.
- Tasks: produce a task list mapped to requirements, with shortName + detailed description.
- Execution: for each task, Codex should implement it in the repo, run tests/build if relevant, summarize changes, and report success/failure + next steps.

# 8) UI Requirements (Screens & Components)

## Screens
1) Home / Sessions
   - list sessions, search, create new
2) New Session Wizard
   - name + projectPath
3) Session Workspace (main)
   - stage tabs/stepper: Intent -> Requirements -> Criteria -> Impact -> Tasks -> Execute -> Summary
   - each stage shows editor with CRUD and “Generate with Codex” CTA
4) Execution
   - tasks table (status badges, attempt count, run last result)
   - “Execute all” + per-task execute + retry w/ extra prompt modal
5) Summary
   - session metadata
   - final artifacts
   - runs timeline and outcomes
   - link to event history

## Debug Panel (WebSocket)
- collapsible right drawer
- live stream list
- filters: stage, runId, event.type, itemType
- detail viewer for selected event (pretty JSON)
- show connection status + reconnect

## Reusable UI Components
- Header (blue)
- SideNav
- Stepper
- Card, Button, Badge, Modal, Drawer
- Code/JSON viewer (simple monospaced pre, copy button)

# 9) Persistence Model (Prisma) - Must include

Tables (minimum):
- Session (id, name, projectPath, createdAt, updatedAt, codexThreadId, currentStage)
- Intent (sessionId, text, updatedAt)
- Requirement (sessionId, reqId, shortName, currentState, desiredState, explanation, order, updatedAt)
- AcceptanceCriterion (sessionId, acId, requirementReqId, given, when, then, order, updatedAt)
- ImpactAnalysis (sessionId, impactId, impactLevel, affectedModules JSONB, explanation, risks JSONB, assumptions JSONB, updatedAt)
- Task (sessionId, taskId, shortName, description, status, attempts, lastError, resultSummary, order, updatedAt)
- Run (id, sessionId, stage, status, startedAt, endedAt, error, taskId nullable)
- RunEvent (id, runId, ts, type, payload JSONB)

Use migrations, indexes (sessionId, runId, stage), and cascading deletes.

# 10) Local Dev & Ops

- Provide docker-compose for Postgres.
- Provide .env templates for api and web.
- Provide scripts:
  - pnpm dev (runs web+api)
  - pnpm db:migrate
  - pnpm worker (job worker)
- Add basic logging and error handling.
- Add unit tests for:
  - stage generation service (mock Codex adapter)
  - run event persistence
  - task retry behavior

# 11) Definition of Done

- Full flow works end-to-end:
  - create session + set intent
  - generate requirements -> edit -> next
  - generate acceptance -> edit -> next
  - generate impact -> next
  - generate tasks -> execute tasks -> retry failures
  - summary shows everything
- WebSocket debug panel shows live streamed Codex events and historical events
- Everything persisted in Postgres
- Clean architecture + SOLID + strong typing across shared DTOs
- Documentation in README: setup, run, architecture diagram (text), API overview

Start by scaffolding the monorepo + docker compose + prisma schema + minimal UI shell, then implement backend endpoints + worker + websocket, then implement stage generators, then UI screens.
