# Database

SIPES IVX uses PostgreSQL with PostGIS.

The Docker Compose database service uses the `postgis/postgis` image, and initialization SQL lives in `database/init/`.

Application migrations are managed by Alembic in `backend/migrations/`.
