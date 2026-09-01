# Step 5: Schematic View and Draw.io Integration

Step 5 adds schematic views as another representation of the existing IVX object model.

## Database

The `views` table stores object-level views:

```text
id
object_id
type
name
configuration
created_at
updated_at
```

The `view_elements` table stores visual elements inside a view:

```text
id
view_id
object_id
element_key
layout
created_at
updated_at
```

`view_elements.object_id` references the existing `objects.id`. No duplicate schematic objects are created.

Schematic layout is stored in `view_elements.layout` and is separate from PostGIS. Moving a schematic element does not update `object_spatial.geometry`.

## API

View endpoints:

```text
GET /api/views
GET /api/views?object_id={object_id}
GET /api/views/object/{object_id}
GET /api/views/object/{object_id}/schematic
GET /api/views/{view_id}
PATCH /api/views/elements/{element_id}/layout
```

## Draw.io

Docker Compose includes a self-hosted Draw.io container behind the optional `drawio` profile:

```text
docker compose --profile drawio up -d drawio
http://localhost:8081/?offline=1&https=0
```

The SIPES IVX frontend embeds this local Draw.io service on the Schema page with safe loading/error handling.

## Demo Data

Seed demo data with:

```powershell
docker compose exec backend python -m app.db.seed
```

The demo schematic belongs to:

```text
Storage Plant
```

It contains elements bound to:

```text
Container 01
Fan 01
```

## Manual Check

1. Open `http://localhost:5173`.
2. Navigate through the tree to `Storage Plant`.
3. Click `Schema`.
4. Confirm Container 01 and Fan 01 appear.
5. Click Fan 01 and confirm `/objects/{fan_id}` opens.
6. Confirm the tree selection, breadcrumb and object details all use the same object.
7. Drag a schematic element and confirm map coordinates in `object_spatial` do not change.
