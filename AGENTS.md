# AGENTS.md

Connectivity demo for Hospital San Gabriel: a FastAPI backend that probes SQL Server and an Angular frontend that calls it. There is no root manifest or workspace — `backend/` and `frontend/` are independent projects, so run every command from inside the relevant directory.

## Layout

- `backend/` — Python 3.15 + uv + FastAPI, src layout at `backend/src/backend/`.
  Layers: `apis/` (routers) → `services/` → `repositories/` (pyodbc) with `schemas/` (Pydantic). All routes are under `/api`.
- `frontend/` — Angular 22 (standalone components, signals) + npm, source in `frontend/src/app/`.

## Backend

```bash
cd backend
cp .env.example .env      # fill in DB_USER / DB_PASSWORD
uv sync
uv run uvicorn backend.main:app --reload   # http://localhost:8000
```

- `[project.scripts] backend = "backend:main"` is a stub that only prints `Hello from backend!`. It does not start the API — use the `uvicorn` command above.
- `config.py` loads `backend/.env` (not the repo root) and overlays real environment variables on top.
- Missing DB settings raise `ValueError`; `GET /api/test` returns `503` when SQL Server is unreachable. Connections use a 5-second timeout and an ODBC driver (`ODBC Driver 17 for SQL Server` in `.env.example`).
- CORS origins come from the comma-separated `CORS_ORIGINS` env var, and `main.py` currently allows only `GET`. Add the frontend origin (`http://localhost:4200`) there.
- There are no backend tests, lint, or typecheck configs.

## Frontend

```bash
cd frontend
npm install
npm start                 # ng serve, http://localhost:4200
npm test                  # Vitest + jsdom via `ng test`
npm test -- --include src/app/app.spec.ts   # single spec
npm run build
```

- The API base URL is hardcoded in `src/environments/environment.ts` as `http://localhost:8000/api`; there is no production environment file. Backend must run on port 8000.
- `src/app/app.spec.ts` uses `provideHttpClientTesting` and asserts the exact URL `http://localhost:8000/api/test` — update the test if the API base changes.
- Component files use Angular 22 defaults without the `.component` suffix (e.g. `app.ts`, `components/connection-test.ts`); small components keep inline templates.
- Formatting is Prettier: 100 columns, single quotes, Angular HTML parser (`frontend/.prettierrc`). There is no ESLint or lint script.

## Repo notes

- No CI workflows, pre-commit hooks, or `opencode.json` exist; verification is manual.
- `.gitattributes` normalizes line endings to LF.
- `backend/.env`, `backend/.venv/`, `frontend/node_modules/`, `frontend/.angular/cache/`, and `frontend/dist/` are gitignored.
