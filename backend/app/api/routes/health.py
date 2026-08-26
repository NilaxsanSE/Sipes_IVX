from fastapi import APIRouter

from app.core.config import settings
from app.db.session import check_database_connection

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check() -> dict[str, object]:
    database_connected = await check_database_connection()

    return {
        "status": "ok" if database_connected else "degraded",
        "service": settings.project_name,
        "environment": settings.environment,
        "database": {
            "status": "connected" if database_connected else "unavailable",
        },
    }
