# Step 2: Core Object Model and Dynamic Hierarchy

This step adds the core object model used by SIPES IVX.

## Tables

- `object_types`
- `object_type_versions`
- `objects`

The hierarchy is stored only through `objects.parent_id`. Root objects use `parent_id = NULL`.

## Migrations

From the project root:

```powershell
cd backend
$env:DATABASE_URL='postgresql+asyncpg://sipes:sipes_password@localhost:5432/sipes_ivx'
.\.venv\Scripts\python.exe -m alembic upgrade head
```

Or from Docker:

```powershell
docker compose exec backend alembic upgrade head
```

## Seed Demo Data

```powershell
docker compose exec backend python -m app.db.seed
```

Demo tenant:

```text
11111111-1111-1111-1111-111111111111
```

Seeded hierarchy:

```text
Germany
  Sachsen
    Dresden
      Site 01
        Storage Plant
          Container 01
            Fan 01
```

## Endpoints

```text
POST   /api/object-types
GET    /api/object-types
GET    /api/object-types/{object_type_id}
PATCH  /api/object-types/{object_type_id}

POST   /api/objects
GET    /api/objects
GET    /api/objects/tree
GET    /api/objects/{object_id}
PATCH  /api/objects/{object_id}
DELETE /api/objects/{object_id}
GET    /api/objects/{object_id}/children
GET    /api/objects/{object_id}/parent
GET    /api/objects/{object_id}/ancestors
GET    /api/objects/{object_id}/descendants
POST   /api/objects/{object_id}/move
```

## Tests

```powershell
cd backend
$env:DATABASE_URL='postgresql+asyncpg://sipes:sipes_password@localhost:5432/sipes_ivx'
.\.venv\Scripts\python.exe -m pytest -q
```
