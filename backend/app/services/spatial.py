from dataclasses import dataclass
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.spatial import GeoJsonFeatureCollection, SpatialObjectRead
from app.services.errors import bad_request, not_found


@dataclass(frozen=True)
class BBox:
    min_lng: float
    min_lat: float
    max_lng: float
    max_lat: float


def parse_bbox(value: str | None) -> BBox | None:
    if value is None:
        return None

    parts = value.split(",")
    if len(parts) != 4:
        raise bad_request("bbox must use minLng,minLat,maxLng,maxLat format.")

    try:
        min_lng, min_lat, max_lng, max_lat = (float(part) for part in parts)
    except ValueError as exc:
        raise bad_request("bbox values must be valid numbers.") from exc

    if min_lng >= max_lng or min_lat >= max_lat:
        raise bad_request("bbox minimum values must be smaller than maximum values.")

    if min_lng < -180 or max_lng > 180 or min_lat < -90 or max_lat > 90:
        raise bad_request("bbox values must be valid WGS84 longitude/latitude coordinates.")

    return BBox(min_lng=min_lng, min_lat=min_lat, max_lng=max_lng, max_lat=max_lat)


async def get_object_spatial(session: AsyncSession, object_id: UUID) -> SpatialObjectRead:
    result = await session.execute(
        text(
            """
            SELECT
                os.id,
                os.object_id,
                ST_X(os.geometry)::float AS longitude,
                ST_Y(os.geometry)::float AS latitude,
                os.altitude,
                os.source,
                os.created_at,
                os.updated_at
            FROM object_spatial os
            WHERE os.object_id = :object_id
            """
        ),
        {"object_id": object_id},
    )
    row = result.mappings().first()
    if row is None:
        raise not_found("Spatial record not found for this object.")

    return SpatialObjectRead(
        id=row["id"],
        object_id=row["object_id"],
        geometry={"type": "Point", "coordinates": (row["longitude"], row["latitude"])},
        altitude=row["altitude"],
        source=row["source"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


async def get_geojson(session: AsyncSession, bbox: str | None = None) -> GeoJsonFeatureCollection:
    bounds = parse_bbox(bbox)
    where_clause = ""
    params: dict[str, float] = {}

    if bounds is not None:
        where_clause = """
            WHERE os.geometry && ST_MakeEnvelope(:min_lng, :min_lat, :max_lng, :max_lat, 4326)
              AND ST_Intersects(
                os.geometry,
                ST_MakeEnvelope(:min_lng, :min_lat, :max_lng, :max_lat, 4326)
              )
        """
        params = {
            "min_lng": bounds.min_lng,
            "min_lat": bounds.min_lat,
            "max_lng": bounds.max_lng,
            "max_lat": bounds.max_lat,
        }

    result = await session.execute(
        text(
            f"""
            SELECT
                o.id AS object_id,
                o.key,
                o.name,
                o.status,
                ot.name AS object_type,
                ST_X(os.geometry)::float AS longitude,
                ST_Y(os.geometry)::float AS latitude,
                os.altitude,
                os.source
            FROM object_spatial os
            JOIN objects o ON o.id = os.object_id
            JOIN object_types ot ON ot.id = o.object_type_id
            {where_clause}
            ORDER BY o.created_at, o.name
            """
        ),
        params,
    )

    features = [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": (row["longitude"], row["latitude"]),
            },
            "properties": {
                "object_id": row["object_id"],
                "name": row["name"],
                "key": row["key"],
                "status": row["status"],
                "object_type": row["object_type"],
                "altitude": row["altitude"],
                "source": row["source"],
            },
        }
        for row in result.mappings()
    ]

    return GeoJsonFeatureCollection(features=features)
