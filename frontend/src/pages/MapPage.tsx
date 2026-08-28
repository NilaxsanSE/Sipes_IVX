import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getSpatialGeoJson } from '../api/objects';
import { ErrorState } from '../components/common/ErrorState';
import { LoadingState } from '../components/common/LoadingState';
import { MapView } from '../components/map/MapView';
import { StatusBadge } from '../components/status/StatusBadge';
import type { SpatialFeatureCollection } from '../types/objects';

type MapPageState =
  | { status: 'loading' }
  | { status: 'ready'; geojson: SpatialFeatureCollection }
  | { status: 'error'; message: string };

export function MapPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedObjectId = searchParams.get('objectId');
  const [state, setState] = useState<MapPageState>({ status: 'loading' });

  const loadGeoJson = useCallback(async (bbox?: string) => {
    try {
      const geojson = await getSpatialGeoJson(bbox);
      setState({ status: 'ready', geojson });
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unable to load spatial objects.',
      });
    }
  }, []);

  useEffect(() => {
    void loadGeoJson();
  }, [loadGeoJson]);

  const selectedFeature = useMemo(() => {
    if (state.status !== 'ready' || !selectedObjectId) {
      return null;
    }
    return state.geojson.features.find((feature) => feature.properties.object_id === selectedObjectId) ?? null;
  }, [selectedObjectId, state]);

  if (state.status === 'loading') {
    return <LoadingState label="Loading geographic objects" />;
  }

  if (state.status === 'error') {
    return <ErrorState message={state.message} />;
  }

  return (
    <div className="page-stack">
      <section className="page-heading map-heading">
        <div>
          <span className="section-label">Geographic View</span>
          <h1>IVX Map</h1>
          <p>Spatial view of IVX objects with PostGIS point geometry.</p>
        </div>
        <div className="map-summary">
          <strong>{state.geojson.features.length}</strong>
          <span>geographic objects</span>
        </div>
      </section>

      {selectedObjectId && !selectedFeature && (
        <div className="state-message">
          The selected object has no geographic record yet.
        </div>
      )}

      <section className="panel map-panel">
        <MapView
          features={state.geojson.features}
          selectedObjectId={selectedObjectId}
          onOpenObject={(objectId) => navigate(`/objects/${objectId}`)}
        />
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <span className="section-label">Map Objects</span>
            <h2>Objects with spatial data</h2>
          </div>
        </div>
        <div className="map-object-list">
          {state.geojson.features.map((feature) => (
            <button
              aria-label={`Open ${feature.properties.name}`}
              className="object-list__item"
              key={feature.properties.object_id}
              type="button"
              onClick={() => navigate(`/objects/${feature.properties.object_id}`)}
            >
              <div>
                <strong>{feature.properties.name}</strong>
                <span>
                  {feature.properties.object_type} · {feature.properties.key}
                </span>
              </div>
              <StatusBadge status={feature.properties.status} size="sm" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
