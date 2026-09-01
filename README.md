# SIPES IVX

Technical foundation and core object navigation for the SIPES IVX monorepo.

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
- Map view: http://localhost:5173/map
- PostgreSQL/PostGIS: localhost:5432

Draw.io is optional for schematic editing. Start it only when you need the Schema editor:

```bash
docker compose --profile drawio up -d drawio
```

- Draw.io editor: http://localhost:8081/?offline=1&https=0

## Verify Connectivity

1. Open http://localhost:5173.
2. The page should show the SIPES IVX overview.
3. Open http://localhost:8000/api/health and confirm the database status is `connected`.
4. Open http://localhost:8000/api/objects/tree and confirm the demo hierarchy is returned.
5. Open http://localhost:8000/api/spatial/geojson and confirm the spatial FeatureCollection is returned.
6. Open the Storage Plant object and confirm the Schema action shows Container 01 and Fan 01.

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

Frontend tests:

```bash
cd frontend
npm run test
```

## Database Migrations

Alembic is configured in `backend/`. Migration files live in `backend/migrations/versions/`.

Run migrations from the `backend/` directory after the database is available:

```bash
alembic upgrade head
```

The migrations enable PostGIS and create the core object hierarchy, spatial and schematic view tables.

## Demo Data

Seed the demo hierarchy from the running backend container:

```bash
docker compose exec backend python -m app.db.seed
```

The demo tree is:

```text
Germany -> Sachsen -> Dresden -> Site 01 -> Storage Plant -> Container 01 -> Fan 01
```

Demo spatial points are seeded for Germany, Sachsen, Dresden and Site 01.

Demo schematic data creates a SCHEMATIC view for Storage Plant with Container 01 and Fan 01 elements bound to their existing IVX object IDs.

## API Documentation

FastAPI documentation is available at:

```text
http://localhost:8000/docs
```

## Repository

GitHub repository: https://github.com/NilaxsanSE/Sipes_IVX
