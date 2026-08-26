# SIPES IVX

Technical foundation for the SIPES IVX monorepo.

## Project Structure

```text
frontend/   React, TypeScript and Vite application
backend/    Python FastAPI application
database/   PostgreSQL/PostGIS initialization and migration notes
docker/     Docker support files
docs/       Project documentation
```

## Prerequisites

- Docker and Docker Compose
- Node.js 20+ for local frontend development
- Python 3.12+ for local backend development

## Environment Setup

Copy the example environment file before running the project:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

## Run With Docker

```bash
docker compose up --build
```

Services:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Health endpoint: http://localhost:8000/api/health
- PostgreSQL/PostGIS: localhost:5432

## Verify Connectivity

1. Open http://localhost:5173.
2. The page should show `SIPES IVX`.
3. The health panel should show API status as `ok`.
4. The database status should show `connected`.

You can also call the backend directly:

```bash
curl http://localhost:8000/api/health
```

Expected response shape:

```json
{
  "status": "ok",
  "service": "SIPES IVX",
  "environment": "development",
  "database": {
    "status": "connected"
  }
}
```

## Local Development

Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

On Windows PowerShell:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Database Migrations

Alembic is configured in `backend/`. Migration files live in `backend/migrations/versions/`.

Run migrations from the `backend/` directory after the database is available:

```bash
alembic upgrade head
```

The initial migration enables the PostGIS extension. The full application data model has intentionally not been added yet.

## Repository

GitHub repository: https://github.com/NilaxsanSE/Sipes_IVX
