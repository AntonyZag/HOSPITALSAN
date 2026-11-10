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
uv sync --locked
uv run uvicorn backend.main:app --reload   # http://localhost:8000
```

- `[project.scripts] backend = "backend:main"` is a stub that only prints `Hello from backend!`. It does not start the API — use the `uvicorn` command above.
- `config.py` loads `backend/.env` (not the repo root) and overlays real environment variables on top.
- Missing DB settings raise `ValueError`; `GET /api/test` returns `503` when SQL Server is unreachable. Connections use a 5-second timeout and an ODBC driver (`ODBC Driver 17 for SQL Server` in `.env.example`).
- CORS origins come from the comma-separated `CORS_ORIGINS` env var; methods are GET, POST, PUT and PATCH. Include `http://localhost:4200`.
- From backend/, `uv run python verificar_entorno.py --db` checks dependencies, native imports, SQL connectivity and procedures without printing credentials.
- `uv run python ../database/preparar_bd.py --datos` prepares HospitalSanGabriel and the 12-product catalog in database/datos_iniciales.sql. Uses existing business procedures; repeating does not reset stock or duplicate movements.
- Work only in HospitalSanGabriel. Do not create additional QA databases or verification clones. The previous QA databases and database/verificar_demo.py have been removed at the user's request.
- No pytest, lint or typecheck configs exist. Keep pyodbc pinned to 5.4.0 in pyproject.toml and uv.lock, and keep Windows Smart App Control enabled.

## Frontend

```bash
cd frontend
npm ci
npm start                 # ng serve, http://localhost:4200
npm test                  # Vitest + jsdom via `ng test`
npm test -- --include src/app/app.spec.ts   # single spec
npm run build
```

- The API base URL is hardcoded in `src/environments/environment.ts` as `http://localhost:8000/api`; there is no production environment file. Backend must run on port 8000.
- `src/app/app.spec.ts` checks app creation and login redirection; connectivity tests use HttpClientTesting. The login is a frontend-only demo, not backend authentication.
- Component files use Angular 22 defaults without the `.component` suffix (e.g. `app.ts`, `components/connection-test.ts`); small components keep inline templates.
- Formatting is Prettier: 100 columns, single quotes, Angular HTML parser (`frontend/.prettierrc`). There is no ESLint or lint script.

## Repo notes

- No CI workflows, pre-commit hooks, or `opencode.json` exist; verification is manual.
- See README, docs/ENTREGA.md and docs/REQUISITOS.md for setup and limitations. database/script_completo_bd.sql covers RF01–RF06; stored_procedures/ contains the earlier RF01–RF03 scripts.
- `.gitattributes` normalizes line endings to LF.
- `backend/.env`, `backend/.venv/`, `frontend/node_modules/`, `frontend/.angular/cache/`, and `frontend/dist/` are gitignored.
