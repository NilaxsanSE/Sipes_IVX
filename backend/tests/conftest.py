from collections.abc import AsyncGenerator
from uuid import uuid4

import pytest_asyncio
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import settings
from app.models.object import Object
from app.models.object_type import ObjectType
from app.models.spatial import ObjectSpatial
from app.models.view import View, ViewElement
from app.schemas.object_type import ObjectTypeCreate
from app.services.object_types import create_object_type

test_engine = create_async_engine(settings.database_url, poolclass=NullPool)
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
