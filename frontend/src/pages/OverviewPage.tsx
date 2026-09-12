import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ApiObject, ObjectStatus, ObjectType } from '../types/objects';
import { getObjectTypeName } from '../utils/objectTypes';
import { EmptyState } from '../components/common/EmptyState';
import { StatusBadge } from '../components/status/StatusBadge';

type OverviewPageProps = {
  objects: ApiObject[];
  objectTypesById: Map<string, ObjectType>;
};

export function OverviewPage({ objects, objectTypesById }: OverviewPageProps) {
  const navigate = useNavigate();
  const locations = objects
    .filter((object) => isLocation(object, objectTypesById))
    .sort(compareLocations);
  const errorCount = locations.filter((location) => location.status === 'ERROR').length;
  const warningCount = locations.filter((location) => location.status === 'WARNING').length;
  const normalCount = locations.filter((location) => location.status === 'NORMAL').length;
  const unknownCount = locations.filter((location) => location.status === 'UNKNOWN').length;

  return (
    <div className="page-stack">
      <section className="page-heading">
        <span className="section-label">Text Overview</span>
        <h1>Locations by Status</h1>
        <p>
          All locations sorted by operational status first, then alphabetically inside each
          status group.
        </p>
      </section>

      <section className="metric-grid" aria-label="Location status statistics">
        <Metric label="Locations" value={locations.length} />
        <Metric label="Error" value={errorCount} tone="error" />
        <Metric label="Warning" value={warningCount} tone="warning" />
        <Metric label="Normal" value={normalCount} tone="normal" />
        <Metric label="Unknown" value={unknownCount} tone="unknown" />
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <span className="section-label">Locations</span>
            <h2>Status-sorted overview</h2>
          </div>
        </div>

        {locations.length === 0 ? (
          <EmptyState message="No locations found." />
        ) : (
          <div className="status-group-list">
            {STATUS_GROUPS.map((group) => {
              const groupLocations = locations.filter((location) => location.status === group.status);
              if (groupLocations.length === 0) {
                return null;
              }

              return (
                <section className="status-group" key={group.status}>
                  <div className="status-group__header">
                    <StatusBadge status={group.status} size="sm" />
                    <span>{group.description}</span>
                    <strong>{groupLocations.length}</strong>
                  </div>
                  <div className="object-list">
                    {groupLocations.map((location) => (
                      <button
                        aria-label={location.name}
                        className="object-list__item"
                        key={location.id}
                        type="button"
                        onClick={() => navigate(`/objects/${location.id}`)}
                      >
                        <div>
                          <strong>{location.name}</strong>
                          <span>
                            {getObjectTypeName(location.object_type_id, objectTypesById)} · {location.key}
                          </span>
                        </div>
                        <StatusBadge status={location.status} size="sm" variant="compact" />
                        <ChevronRight size={18} aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

type MetricProps = {
  label: string;
  value: number;
  tone?: 'neutral' | 'normal' | 'warning' | 'error' | 'unknown';
};

function Metric({ label, value, tone = 'neutral' }: MetricProps) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

const STATUS_GROUPS: Array<{ status: ObjectStatus; description: string }> = [
  { status: 'ERROR', description: 'Operational error' },
  { status: 'WARNING', description: 'Needs attention' },
  { status: 'NORMAL', description: 'Healthy' },
  { status: 'UNKNOWN', description: 'Technical status-data error' },
];

const STATUS_PRIORITY = new Map<ObjectStatus, number>(
  STATUS_GROUPS.map((group, index) => [group.status, index]),
);

function isLocation(object: ApiObject, objectTypesById: Map<string, ObjectType>) {
  const objectType = objectTypesById.get(object.object_type_id);
  return objectType?.key === 'location' || objectType?.name.toLowerCase() === 'location';
}

function compareLocations(left: ApiObject, right: ApiObject) {
  const leftPriority = STATUS_PRIORITY.get(left.status) ?? STATUS_GROUPS.length;
  const rightPriority = STATUS_PRIORITY.get(right.status) ?? STATUS_GROUPS.length;

  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }

  return left.name.localeCompare(right.name);
}
