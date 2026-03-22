# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MathKnights** is a gamified calculus/advanced math learning app inspired by Arknights, built for school innovation competitions. It features AI-powered problem grading, a progression system (levels, elite stages, experience cards), DAG-based stage unlocks, and daily/weekly missions.

## Commands

### Frontend

```bash
npm run dev       # Start dev server at http://localhost:8080
npm run build     # Production build
npm run lint      # ESLint
npm run test      # Vitest (unit tests)
npm run test:watch
npm run preview   # Preview production build
```

### Backend

```bash
cd backend
pip install -r requirements.txt
# Requires DEEPSEEK_API_KEY in backend/.env (see .env.example)
python -m uvicorn app.main:app --reload --port 8000
# Swagger UI: http://localhost:8000/docs
```

Vite proxies `/api/*` → `http://localhost:8000` automatically during dev.

## Architecture

### Stack
- **Frontend**: React 18 + TypeScript + Vite (port 8080), Tailwind CSS, shadcn/ui, Framer Motion, TanStack Query, React Router DOM
- **Backend**: FastAPI + SQLite (async via SQLAlchemy + aiosqlite), Pydantic v2
- **LLM**: DeepSeek API (OpenAI-compatible client) for math grading, OCR, and problem generation
- **Path alias**: `@/*` → `./src/*`

### Frontend State & Data Flow

`GameContext` (`src/context/GameContext.tsx`) is the central state provider — it holds user profile, chapters, missions, competencies, and settings. On mount it fetches from the backend via `src/services/api.ts`, which handles snake_case↔camelCase conversion between the Python backend and TypeScript frontend.

Challenge flow: `Challenge.tsx` → `POST /api/challenge` (LLM grading) → `Result.tsx` with score/feedback.

Pages live in `src/pages/`. Route definitions are in `src/App.tsx`.

### Backend Structure

```
backend/app/
├── main.py           # FastAPI app, lifespan (auto-seeds DB on startup)
├── database.py       # Async SQLite engine
├── models/
│   ├── orm_models.py # 6 SQLAlchemy models: users, chapters, stages, problems, user_progress, user_missions
│   └── schemas.py    # Pydantic request/response schemas
├── routers/
│   ├── chapters.py   # Chapter/stage/problem CRUD, DAG unlock logic
│   ├── challenges.py # Answer submission → LLM grading → update progress
│   ├── missions.py   # Daily/weekly task queries and reward claiming
│   ├── user.py       # Profile, exp card usage, elite promotion
│   └── ocr.py        # Image upload → DeepSeek Vision → structured problem
└── services/
    └── deepseek.py   # grade_answer(), evaluate_rewards(), generate_problem(), parse_image_to_problem()
```

### Key Design Points

- **DAG unlock**: Stages within a chapter unlock based on prior completions; cross-chapter unlocks are a planned feature (P1).
- **LLM fallback**: If `DEEPSEEK_API_KEY` is absent, grading falls back to simple keyword matching.
- **Database seeding**: `main.py` lifespan hook seeds all chapters/stages/problems and creates a default user + missions on first startup.
- **Competency radar**: Users have 6 numeric competency scores (Math Abstract, Logic, Modeling, Imagination, Computation, Data) updated by LLM after grading.
- **Progression formula**: `exp_required = 0.0426×level³ - 1.7797×level² + 66.42×level + 74.065`

### Type Safety Notes

TypeScript `noImplicitAny` is disabled (`tsconfig.json`). Pydantic v2 is used on the backend for runtime validation. The API service layer (`src/services/api.ts`) is the single point of truth for all HTTP calls and data transformation.
