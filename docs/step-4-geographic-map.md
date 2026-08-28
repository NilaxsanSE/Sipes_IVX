# Step 4: Geographic Data and Map View

Step 4 adds PostGIS-backed spatial records for existing IVX objects.

## Database

The `object_spatial` table stores one WGS84 point geometry per object:

```text
id
object_id
geometry geometry(Point, 4326)
altitude
source
created_at
updated_at
```

Coordinates are not stored in `objects.properties`.

## API

Spatial endpoints:

```text
GET /api/spatial/object/{object_id}
GET /api/spatial/geojson
GET /api/spatial/geojson?bbox=minLng,minLat,maxLng,maxLat
```

The GeoJSON endpoint returns existing IVX object IDs as `properties.object_id`.

## Demo Data

Seed demo spatial points:

```powershell
docker compose exec backend python -m app.db.seed
```

Seeded geographic objects:

```text
Germany
Sachsen
Dresden
Site 01
```

## Frontend

The map is available at:

```text
http://localhost:5173/map
```

Objects with spatial data show a `View on Map` action from their object detail page.
