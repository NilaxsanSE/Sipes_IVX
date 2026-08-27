import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getObject,
  getObjectAncestors,
  getObjectChildren,
  getObjectParent,
} from '../api/objects';
import { ObjectBreadcrumb } from '../components/breadcrumb/ObjectBreadcrumb';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { LoadingState } from '../components/common/LoadingState';
import { StatusBadge } from '../components/status/StatusBadge';
import type { ApiObject, ObjectType } from '../types/objects';
import { getObjectTypeName } from '../utils/objectTypes';

type ObjectPageProps = {
  objectTypesById: Map<string, ObjectType>;
  onCurrentObjectChange: (object: ApiObject | null) => void;
};

type ObjectPageState =
  | { status: 'loading' }
  | {
      status: 'ready';
      object: ApiObject;
      parent: ApiObject | null;
      ancestors: ApiObject[];
      children: ApiObject[];
    }
  | { status: 'error'; message: string };

export function ObjectPage({ objectTypesById, onCurrentObjectChange }: ObjectPageProps) {
  const { objectId } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<ObjectPageState>({ status: 'loading' });

  const loadObject = useCallback(async () => {
    if (!objectId) {
      setState({ status: 'error', message: 'Object ID is missing from the URL.' });
      return;
    }

    setState({ status: 'loading' });
    onCurrentObjectChange(null);

    try {
      const [object, parent, ancestors, children] = await Promise.all([
        getObject(objectId),
        getObjectParent(objectId),
        getObjectAncestors(objectId),
        getObjectChildren(objectId),
      ]);

      setState({ status: 'ready', object, parent, ancestors, children });
      onCurrentObjectChange(object);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load object details.';
      setState({ status: 'error', message });
      onCurrentObjectChange(null);
    }
  }, [objectId, onCurrentObjectChange]);

  useEffect(() => {
    void loadObject();
  }, [loadObject]);

  useEffect(() => {
    return () => onCurrentObjectChange(null);
  }, [onCurrentObjectChange]);

  if (state.status === 'loading') {
    return <LoadingState label="Loading object details" />;
  }

  if (state.status === 'error') {
    return <ErrorState message={state.message} />;
  }

  return (
    <ObjectDetails
      object={state.object}
      parent={state.parent}
      ancestors={state.ancestors}
      children={state.children}
      objectTypesById={objectTypesById}
      onNavigate={(targetId) => navigate(`/objects/${targetId}`)}
    />
  );
}

type ObjectDetailsProps = {
  object: ApiObject;
  parent: ApiObject | null;
  ancestors: ApiObject[];
  children: ApiObject[];
  objectTypesById: Map<string, ObjectType>;
  onNavigate: (objectId: string) => void;
};

export function ObjectDetails({
  object,
  parent,
  ancestors,
  children,
  objectTypesById,
  onNavigate,
}: ObjectDetailsProps) {
  const breadcrumbItems = useMemo(() => [...ancestors, object], [ancestors, object]);
  const objectTypeName = getObjectTypeName(object.object_type_id, objectTypesById);

  return (
    <div className="page-stack">
      <ObjectBreadcrumb items={breadcrumbItems} onNavigate={onNavigate} />

      <section className="object-hero">
        <div>
          <span className="section-label">{objectTypeName}</span>
          <h1>{object.name}</h1>
          <p>{object.key}</p>
        </div>
        <StatusBadge status={object.status} />
      </section>

      <section className="detail-grid">
        <InfoPanel title="Object Details">
          <Definition label="Object ID" value={object.id} />
          <Definition label="Object type" value={objectTypeName} />
          <Definition label="Key" value={object.key} />
          <Definition label="Status" value={object.status} />
          <Definition label="Direct children" value={String(children.length)} />
        </InfoPanel>

        <InfoPanel title="Containment">
          <Definition
            label="Parent object"
            value={parent ? parent.name : 'Root object'}
            action={
              parent ? (
                <button className="link-button" type="button" onClick={() => onNavigate(parent.id)}>
                  Open parent
                </button>
              ) : null
            }
          />
          <Definition label="Parent ID" value={object.parent_id ?? 'None'} />
          <Definition label="Tenant ID" value={object.tenant_id} />
        </InfoPanel>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <span className="section-label">Properties</span>
            <h2>Dynamic JSONB data</h2>
          </div>
        </div>
        <PropertiesView properties={object.properties} />
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <span className="section-label">Contained Objects</span>
            <h2>Direct children</h2>
          </div>
          <span className="count-pill">{children.length}</span>
        </div>

        {children.length === 0 ? (
          <EmptyState message="This object does not contain any direct children." />
        ) : (
          <div className="object-list">
            {children.map((child) => (
              <button
                aria-label={child.name}
                className="object-list__item"
                key={child.id}
                type="button"
                onClick={() => onNavigate(child.id)}
              >
                <div>
                  <strong>{child.name}</strong>
                  <span>
                    {getObjectTypeName(child.object_type_id, objectTypesById)} · {child.key}
                  </span>
                </div>
                <StatusBadge status={child.status} size="sm" />
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

type InfoPanelProps = {
  title: string;
  children: ReactNode;
};

function InfoPanel({ title, children }: InfoPanelProps) {
  return (
    <section className="panel">
      <div className="panel__header">
        <h2>{title}</h2>
      </div>
      <dl className="definition-list">{children}</dl>
    </section>
  );
}

type DefinitionProps = {
  label: string;
  value: string;
  action?: ReactNode;
};

function Definition({ label, value, action }: DefinitionProps) {
  return (
    <div className="definition-list__row">
      <dt>{label}</dt>
      <dd title={value}>{value}</dd>
      {action}
    </div>
  );
}

type PropertiesViewProps = {
  properties: Record<string, unknown>;
};

function PropertiesView({ properties }: PropertiesViewProps) {
  const entries = Object.entries(properties);

  if (entries.length === 0) {
    return <EmptyState message="No properties are defined for this object." />;
  }

  return (
    <dl className="property-grid">
      {entries.map(([key, value]) => (
        <div key={key}>
          <dt>{key}</dt>
          <dd>{formatPropertyValue(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function formatPropertyValue(value: unknown) {
  if (value === null) {
    return 'null';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}
