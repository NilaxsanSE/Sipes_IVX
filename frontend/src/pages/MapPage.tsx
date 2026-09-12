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

  const locationFeatures = useMemo(() => {
    if (state.status !== 'ready') {
      return [];
    }

    return state.geojson.features.filter((feature) => feature.properties.object_type.toLowerCase() === 'location');
  }, [state]);

  const selectedFeature = useMemo(() => {
    if (!selectedObjectId) {
      return null;
    }
    return locationFeatures.find((feature) => feature.properties.object_id === selectedObjectId) ?? null;
  }, [locationFeatures, selectedObjectId]);

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
          <h1>Location Map</h1>
          <p>Operational starting point showing locations with geographic coordinates.</p>
        </div>
        <div className="map-summary">
          <strong>{locationFeatures.length}</strong>
          <span>locations</span>
        </div>
      </section>

      {selectedObjectId && !selectedFeature && (
        <div className="state-message">
          The selected object has no geographic record yet.
        </div>
      )}

      <section className="panel map-panel">
          <MapView
          features={locationFeatures}
          selectedObjectId={selectedObjectId}
          onOpenObject={(objectId) => navigate(`/objects/${objectId}`)}
        />
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <span className="section-label">Locations</span>
            <h2>Status overview</h2>
          </div>
        </div>
        <div className="map-object-list">
          {locationFeatures.map((feature) => (
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
              <StatusBadge status={feature.properties.status} size="sm" variant="compact" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
