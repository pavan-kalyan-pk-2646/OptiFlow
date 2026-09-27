# OptiFlow — Final Project Structure

## Frontend
`frontend/src/` is the single source of truth for the React application.

### Routes
- `/` — Public landing page
- `/login` — Login
- `/register` — Registration
- `/dashboard` — Dashboard
- `/dp-notes` — DP Notes
- `/dp-academy` — DP Academy
- `/dp-problems` — DP Problems
- `/dp-playground` — DP Playground
- `/dp-visualizer` — DP Visualizer
- `/studio` — OptiFlow Studio
- `/pipelines` — My Pipelines
- `/optimization-history` — Optimization History
- `/algorithm-lab` — Algorithm Lab
- `/benchmark-lab` — Benchmark Lab
- `/real-world-applications` — Real-World Applications
- `/documentation` — Documentation
- `/profile` — Profile
- `/settings` — Settings

## OptiFlow Studio flow
Dashboard → Studio Landing → Enter Studio → Fullscreen Introduction → Enter Pipeline → Fullscreen Workspace

Workspace tabs:
Pipeline | Constraints | DP Engine | Visualizer | Simulation | Results | Benchmark

## Backend
FastAPI is organized into API routes, services, repositories, schemas, models and the Dynamic Programming optimization engine.

## DP core
The V1 optimization model chooses exactly one strategy per ordered pipeline stage while satisfying deadline and budget constraints. The DP engine provides state generation, transitions, constraint validation, optimization, reconstruction and benchmarking.

## Intentionally removed from the clean source tree
- Git metadata
- Python virtual environment
- Python cache files
- Frontend dependency directory
- Empty duplicate page tree under `src/pages/app`
- Obsolete root `src/` application
- Empty duplicate auth service
- Backend `.env` containing local configuration

Use `backend/.env.example` and create a local `backend/.env` when running the backend.
