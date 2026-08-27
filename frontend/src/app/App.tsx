import { useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { getHealth, getObjectTree, listObjects, listObjectTypes } from '../api/objects';
import { ErrorState } from '../components/common/ErrorState';
import { LoadingState } from '../components/common/LoadingState';
import { AppLayout } from '../components/layout/AppLayout';
import { ObjectPage } from '../pages/ObjectPage';
import { OverviewPage } from '../pages/OverviewPage';
import type { ApiObject, ObjectTreeNode, ObjectType } from '../types/objects';
import { createObjectTypeMap } from '../utils/objectTypes';

type AppDataState =
  | { status: 'loading' }
  | {
      status: 'ready';
      healthDatabaseStatus: string;
      objectTypes: ObjectType[];
      objects: ApiObject[];
      tree: ObjectTreeNode[];
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
    const match = location.pathname.match(/^\/objects\/([^/]+)$/);
    return match?.[1];
  }, [location.pathname]);

  const loadAppData = useCallback(async () => {
    setState({ status: 'loading' });

    try {
      const [health, objectTypes, objects, tree] = await Promise.all([
        getHealth(),
        listObjectTypes(),
        listObjects(),
        getObjectTree(),
      ]);

      setState({
        status: 'ready',
        healthDatabaseStatus: health.database.status,
        objectTypes,
        objects,
        tree,
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

  return (
    <AppLayout
      currentObject={currentObject}
      healthStatus={state.healthDatabaseStatus}
      tree={state.tree}
      objectTypesById={objectTypesById}
      selectedObjectId={selectedObjectId}
      isTreeLoading={false}
      treeError={null}
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
          path="/objects/:objectId"
          element={
            <ObjectPage
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
