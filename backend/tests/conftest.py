from collections.abc import AsyncGenerator
import os
from uuid import uuid4

import pytest
import pytest_asyncio
from sqlalchemy import delete
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import settings
from app.models.object import Object
from app.models.object_type import ObjectType
from app.models.spatial import ObjectSpatial
from app.models.view import View, ViewElement
from app.schemas.object_type import ObjectTypeCreate
from app.services.object_types import create_object_type

TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL", settings.database_url)


def _is_production_like_database() -> bool:
    environment = settings.environment.lower()
    if environment not in {"production", "staging"}:
        return False

    database_name = make_url(TEST_DATABASE_URL).database or ""
    return "test" not in database_name.lower()


if _is_production_like_database():
    pytest.exit(
        "Refusing to run destructive backend tests against a production/staging database. "
        "Use a TEST_DATABASE_URL or a database name containing 'test'.",
        returncode=4,
    )


test_engine = create_async_engine(TEST_DATABASE_URL, poolclass=NullPool)
TestSessionLocal = async_sessionmaker(test_engine, expire_on_commit=False)


@pytest_asyncio.fixture
async def session() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as db_session:
        await db_session.execute(delete(ObjectSpatial))
        await db_session.execute(delete(ViewElement))
        await db_session.execute(delete(View))
        await db_session.execute(delete(Object))
        await db_session.execute(delete(ObjectType))
        await db_session.commit()
        yield db_session
        await db_session.rollback()
        await db_session.execute(delete(ObjectSpatial))
        await db_session.execute(delete(ViewElement))
        await db_session.execute(delete(View))
        await db_session.execute(delete(Object))
        await db_session.execute(delete(ObjectType))
        await db_session.commit()


@pytest_asyncio.fixture
async def object_type(session: AsyncSession) -> ObjectType:
    return await create_object_type(
        session,
        ObjectTypeCreate(
            key=f"test-type-{uuid4()}",
            name="Test Type",
            schema_definition={"type": "object", "properties": {}},
        ),
    )
