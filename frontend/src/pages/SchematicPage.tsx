import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getObject,
  getObjectAncestors,
  getObjectSchematicView,
  listObjects,
  updateViewElementLayout,
} from '../api/objects';
import { ObjectBreadcrumb } from '../components/breadcrumb/ObjectBreadcrumb';
import { DrawIoFrame } from '../components/schematic/DrawIoFrame';
import { SchematicView } from '../components/schematic/SchematicView';
import { ErrorState } from '../components/common/ErrorState';
import { LoadingState } from '../components/common/LoadingState';
import type { ApiObject, ObjectType, ObjectView, ViewElement } from '../types/objects';

type SchematicPageProps = {
  objectTypesById: Map<string, ObjectType>;
  onCurrentObjectChange: (object: ApiObject | null) => void;
};

type SchematicPageState =
  | { status: 'loading' }
  | {
      status: 'ready';
      object: ApiObject;
      ancestors: ApiObject[];
      objects: ApiObject[];
      view: ObjectView;
    }
  | { status: 'error'; message: string };

export function SchematicPage({ objectTypesById, onCurrentObjectChange }: SchematicPageProps) {
  const { objectId } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<SchematicPageState>({ status: 'loading' });

  const loadSchematic = useCallback(async () => {
    if (!objectId) {
      setState({ status: 'error', message: 'Object ID is missing from the URL.' });
      return;
    }

    setState({ status: 'loading' });
    onCurrentObjectChange(null);

    try {
      const [object, ancestors, objects, view] = await Promise.all([
        getObject(objectId),
        getObjectAncestors(objectId),
        listObjects(),
        getObjectSchematicView(objectId),
      ]);
      setState({ status: 'ready', object, ancestors, objects, view });
      onCurrentObjectChange(object);
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unable to load schematic view.',
      });
      onCurrentObjectChange(null);
    }
  }, [objectId, onCurrentObjectChange]);

  useEffect(() => {
    void loadSchematic();
  }, [loadSchematic]);

  useEffect(() => {
    return () => onCurrentObjectChange(null);
  }, [onCurrentObjectChange]);

  const objectsById = useMemo(() => {
    if (state.status !== 'ready') {
      return new Map<string, ApiObject>();
    }
    return new Map(state.objects.map((object) => [object.id, object]));
  }, [state]);

  async function handleUpdateLayout(elementId: string, layout: ViewElement['layout']) {
    await updateViewElementLayout(elementId, layout);
    await loadSchematic();
  }

  if (state.status === 'loading') {
    return <LoadingState label="Loading schematic view" />;
  }

  if (state.status === 'error') {
    return <ErrorState message={state.message} />;
  }

  return (
    <div className="page-stack">
      <ObjectBreadcrumb
        items={[...state.ancestors, state.object]}
        onNavigate={(targetId) => navigate(`/objects/${targetId}`)}
      />

      <section className="page-heading schematic-heading">
        <div>
          <span className="section-label">Schema</span>
          <h1>{state.view.name}</h1>
          <p>{state.object.name} schematic using existing IVX object identities.</p>
        </div>
      </section>

      <section className="panel schematic-panel">
        <SchematicView
          view={state.view}
          objectsById={objectsById}
          objectTypesById={objectTypesById}
          onOpenObject={(targetId) => navigate(`/objects/${targetId}`)}
          onUpdateLayout={handleUpdateLayout}
        />
      </section>

      <section className="panel">
        <DrawIoFrame />
      </section>
    </div>
  );
}
