import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import {
  getHealth,
  getObjectTree,
  getSpatialGeoJson,
  listObjects,
  listObjectTypes,
  listViews,
} from '../api/objects';
import { ErrorState } from '../components/common/ErrorState';
import { LoadingState } from '../components/common/LoadingState';
import { AppLayout } from '../components/layout/AppLayout';
import { ObjectPage } from '../pages/ObjectPage';
import { OverviewPage } from '../pages/OverviewPage';
import { SchematicPage } from '../pages/SchematicPage';
import type {
  ApiObject,
  ObjectTreeNode,
  ObjectType,
  SpatialFeatureCollection,
  ViewSummary,
} from '../types/objects';
import { createObjectTypeMap } from '../utils/objectTypes';

const MapPage = lazy(() => import('../pages/MapPage').then((module) => ({ default: module.MapPage })));

type AppDataState =
  | { status: 'loading' }
  | {
      status: 'ready';
      healthDatabaseStatus: string;
      objectTypes: ObjectType[];
      objects: ApiObject[];
      tree: ObjectTreeNode[];
      spatialGeoJson: SpatialFeatureCollection;
      views: ViewSummary[];
    }
  | { status: 'error'; message: string };

export function App() {
  return (
    <BrowserRouter>
      <SipesApp />
    </BrowserRouter>
  );
}

function SipesApp() {
  const location = useLocation();
  const [state, setState] = useState<AppDataState>({ status: 'loading' });
  const [currentObject, setCurrentObject] = useState<ApiObject | null>(null);

  const selectedObjectId = useMemo(() => {
    const match = location.pathname.match(/^\/objects\/([^/]+)(?:\/schema)?$/);
    if (match?.[1]) {
      return match[1];
    }

    if (location.pathname === '/map') {
      return new URLSearchParams(location.search).get('objectId') ?? undefined;
    }

    return undefined;
  }, [location.pathname, location.search]);

  const loadAppData = useCallback(async () => {
    setState({ status: 'loading' });

    try {
      const [health, objectTypes, objects, tree, spatialGeoJson, views] = await Promise.all([
        getHealth(),
        listObjectTypes(),
        listObjects(),
        getObjectTree(),
        getSpatialGeoJson(),
        listViews(),
      ]);

      setState({
        status: 'ready',
        healthDatabaseStatus: health.database.status,
        objectTypes,
        objects,
        tree,
        spatialGeoJson,
        views,
      });
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unable to load SIPES IVX data.',
      });
    }
  }, []);

  useEffect(() => {
    void loadAppData();
  }, [loadAppData]);

  if (state.status === 'loading') {
    return (
      <div className="boot-screen">
        <LoadingState label="Starting SIPES IVX" />
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="boot-screen">
        <ErrorState message={state.message} />
      </div>
    );
  }

  const objectTypesById = createObjectTypeMap(state.objectTypes);
  const spatialObjectIds = new Set(
    state.spatialGeoJson.features.map((feature) => feature.properties.object_id),
  );
  const schematicObjectIds = new Set(
    state.views.filter((view) => view.type === 'SCHEMATIC').map((view) => view.object_id),
  );
  const selectedObject = selectedObjectId
    ? state.objects.find((object) => object.id === selectedObjectId) ?? null
    : null;

  return (
    <AppLayout
      currentObject={selectedObject ?? currentObject}
      healthStatus={state.healthDatabaseStatus}
      tree={state.tree}
      objectTypesById={objectTypesById}
      selectedObjectId={selectedObjectId}
      isTreeLoading={false}
      treeError={null}
      hasCurrentObjectSpatial={selectedObject ? spatialObjectIds.has(selectedObject.id) : false}
      hasCurrentObjectSchematic={selectedObject ? schematicObjectIds.has(selectedObject.id) : false}
      spatialObjectIds={spatialObjectIds}
      schematicObjectIds={schematicObjectIds}
    >
      <Routes>
        <Route
          path="/"
          element={
            <OverviewPage
              objects={state.objects}
              roots={state.tree}
              objectTypesById={objectTypesById}
            />
          }
        />
        <Route
          path="/map"
          element={
            <Suspense fallback={<LoadingState label="Loading map" />}>
              <MapPage />
            </Suspense>
          }
        />
        <Route
          path="/objects/:objectId"
          element={
            <ObjectPage
              objectTypesById={objectTypesById}
              onCurrentObjectChange={setCurrentObject}
              hasSpatial={selectedObjectId ? spatialObjectIds.has(selectedObjectId) : false}
              hasSchematic={selectedObjectId ? schematicObjectIds.has(selectedObjectId) : false}
            />
          }
        />
        <Route
          path="/objects/:objectId/schema"
          element={
            <SchematicPage
              objectTypesById={objectTypesById}
              onCurrentObjectChange={setCurrentObject}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}
