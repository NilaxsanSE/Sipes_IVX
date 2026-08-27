import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ApiObject, ObjectTreeNode, ObjectType } from '../types/objects';
import { getObjectTypeName } from '../utils/objectTypes';
import { EmptyState } from '../components/common/EmptyState';
import { StatusBadge } from '../components/status/StatusBadge';

type OverviewPageProps = {
  objects: ApiObject[];
  roots: ObjectTreeNode[];
  objectTypesById: Map<string, ObjectType>;
};

export function OverviewPage({ objects, roots, objectTypesById }: OverviewPageProps) {
  const navigate = useNavigate();
  const normalCount = objects.filter((object) => object.status === 'NORMAL').length;
  const warningCount = objects.filter((object) => object.status === 'WARNING').length;
  const errorCount = objects.filter((object) => object.status === 'ERROR').length;

  return (
    <div className="page-stack">
      <section className="page-heading">
        <span className="section-label">System Overview</span>
        <h1>SIPES IVX</h1>
        <p>
          Dynamic object hierarchy for industrial assets, locations, systems and contained
          equipment.
        </p>
      </section>

      <section className="metric-grid" aria-label="Object statistics">
        <Metric label="Total objects" value={objects.length} />
        <Metric label="Normal" value={normalCount} tone="normal" />
        <Metric label="Warning" value={warningCount} tone="warning" />
        <Metric label="Error" value={errorCount} tone="error" />
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <span className="section-label">Root Objects</span>
            <h2>Top-level hierarchy</h2>
          </div>
        </div>

        {roots.length === 0 ? (
          <EmptyState message="No root objects found." />
        ) : (
          <div className="object-list">
            {roots.map((root) => (
              <button
                aria-label={root.name}
                className="object-list__item"
                key={root.id}
                type="button"
                onClick={() => navigate(`/objects/${root.id}`)}
              >
                <div>
                  <strong>{root.name}</strong>
                  <span>
                    {getObjectTypeName(root.object_type_id, objectTypesById)} · {root.key}
                  </span>
                </div>
                <StatusBadge status={root.status} size="sm" />
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

type MetricProps = {
  label: string;
  value: number;
  tone?: 'neutral' | 'normal' | 'warning' | 'error';
};

function Metric({ label, value, tone = 'neutral' }: MetricProps) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
