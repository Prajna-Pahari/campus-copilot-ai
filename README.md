# Campus Copilot AI

An AI-powered academic workspace for college students. Not a chatbot —
students paste academic content, choose a tool, and get a streamed,
structured result they can copy or download.

## What it does

Three tools, one workflow: paste content → pick a tool → get a streamed
AI result.

- **Smart Notes Summarizer** — summary, key concepts, exam points, revision checklist
- **Concept Explainer** — beginner + college-level explanations, a real-world analogy, common mistakes, a quick recap
- **Quiz Generator** — MCQs, short-answer questions, long-answer questions, an answer key

## Architecture

```
campus-copilot-ai/
├── backend/     Express API — the only thing talking to the LLM provider
└── frontend/    Static HTML/CSS/vanilla JS — no build step, no framework
```

**Backend** (`backend/src/`)
- `prompts/` — one prompt template per tool, plus a registry mapping tool name → template
- `services/llmService.js` — the *only* file that knows how to talk to the OpenAI-compatible API
- `routes/generateRoute.js` — single `POST /api/generate` endpoint, dispatches by `tool`
- `middleware/` — request validation, security headers
- `utils/` — SSE wire-format writer, logger
- `config/env.js` — environment variable loading + validation, fails fast on misconfiguration

**Frontend** (`frontend/js/`)
- `sse.js` — the *only* file that knows the streaming wire format
- `generator.js`, `output.js`, `toolSelector.js` — UI logic, transport-agnostic

**Key architectural decisions:**
- Single `POST /api/generate` endpoint (tool passed in the request body) rather than per-tool routes — adding tool #4 later means adding a prompt module, not a new route.
- Stateless requests — no database, no sessions, no conversation history.
- Server-Sent Events (SSE) for streaming — one-directional, no extra protocol needed.
- Minimal dependencies: `express`, `cors`, `dotenv` on the backend; zero dependencies on the frontend.

## Running locally

### Backend

```bash
cd backend
npm install
cp .env.example .env   # then fill in a real OPENAI_API_KEY
npm run dev
```

Backend runs at `http://localhost:5000`. Health check: `GET /api/health`.

### Frontend

```bash
cd frontend
npx serve -l 5500
```

Open `http://localhost:5500`. The frontend expects the backend's CORS
`FRONTEND_ORIGIN` (in `backend/.env`) to match this URL.

### Running the backend in Docker

```bash
cd backend
docker build -t campus-copilot-backend .
docker run -p 5000:5000 --env-file .env campus-copilot-backend
```

See `backend/Dockerfile` for details on the image (single-stage, Alpine-based, non-root).

## API

**`POST /api/generate`**

```json
{ "tool": "summarizer" | "explainer" | "quiz", "content": "..." }
```

Returns a `text/event-stream` response: a series of `data: {"token": "..."}`
events, followed by `data: {"done": true}`, or `data: {"error": "..."}` if
generation fails partway through.

**`GET /api/health`** — liveness check, used by Docker/AWS App Runner.

## Environment variables

See `backend/.env.example` for the full list. `OPENAI_API_KEY` is required;
the server refuses to start without it.

## Status

Core application, Docker packaging, and production hardening (graceful
shutdown, structured logging, security headers, request timeouts) are
complete and verified locally. AWS App Runner deployment is in progress.
Rate limiting is a known, intentionally deferred gap — see the security
notes before exposing a deployed instance publicly.

## License

MIT — see [LICENSE](LICENSE).
