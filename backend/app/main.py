from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health, object_types, objects, spatial
from app.core.config import settings


def create_app() -> FastAPI:
    app = FastAPI(title=settings.project_name, version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router, prefix="/api")
    app.include_router(object_types.router, prefix="/api")
    app.include_router(objects.router, prefix="/api")
    app.include_router(spatial.router, prefix="/api")

    return app


app = create_app()
