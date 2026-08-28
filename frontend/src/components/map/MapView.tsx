import * as maplibregl from 'maplibre-gl';
import type { LngLatBoundsLike, Map, StyleSpecification } from 'maplibre-gl';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { SpatialFeature } from '../../types/objects';
import { EmptyState } from '../common/EmptyState';
import { StatusBadge } from '../status/StatusBadge';
import { getStatusColor } from './statusColors';
import { MapControls } from './MapControls';

const BASEMAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: 'OpenStreetMap',
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
    },
  ],
};

type MapViewProps = {
  features: SpatialFeature[];
  selectedObjectId?: string | null;
  onOpenObject: (objectId: string) => void;
};

export function MapView({
  features,
  selectedObjectId,
  onOpenObject,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const hasFitInitialFeaturesRef = useRef(false);
  const focusedObjectIdRef = useRef<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  const selectedFeature = useMemo(
    () => features.find((feature) => feature.properties.object_id === selectedObjectId),
    [features, selectedObjectId],
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    try {
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: BASEMAP_STYLE,
        center: [10.4515, 51.1657],
        zoom: 5,
        dragPan: true,
        scrollZoom: true,
        interactive: true,
        touchZoomRotate: true,
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
      mapRef.current = map;
    } catch {
      setMapError('Unable to initialize the map.');
    }

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = features.map((feature) => {
      const markerElement = document.createElement('button');
      markerElement.className = `map-marker ${
        feature.properties.object_id === selectedObjectId ? 'map-marker--selected' : ''
      }`;
      markerElement.type = 'button';
      markerElement.style.background = getStatusColor(feature.properties.status);
      markerElement.setAttribute('aria-label', `Open ${feature.properties.name}`);
      markerElement.title = `${feature.properties.name} · ${feature.properties.object_type} · ${feature.properties.status}`;
      markerElement.addEventListener('click', () => onOpenObject(feature.properties.object_id));

      return new maplibregl.Marker({ element: markerElement })
        .setLngLat(feature.geometry.coordinates)
        .addTo(map);
    });
    if (!hasFitInitialFeaturesRef.current && features.length > 0 && !selectedFeature) {
      fitFeatures(map, features, selectedFeature);
      hasFitInitialFeaturesRef.current = true;
    }
  }, [features, onOpenObject, selectedFeature, selectedObjectId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedFeature || focusedObjectIdRef.current === selectedObjectId) {
      return;
    }

    fitFeatures(map, features, selectedFeature);
    focusedObjectIdRef.current = selectedFeature.properties.object_id;
  }, [features, selectedFeature, selectedObjectId]);

  function resetView() {
    const map = mapRef.current;
    if (map) {
      fitFeatures(map, features, selectedFeature);
    }
  }

  return (
    <div className="map-view">
      <div className="map-canvas" ref={containerRef} role="region" aria-label="Geographic map" />
      <MapControls onResetView={resetView} />
      {mapError && <div className="map-overlay"><EmptyState message={mapError} /></div>}
      {features.length === 0 && !mapError && (
        <div className="map-overlay">
          <EmptyState message="No geographic objects are available for this view." />
        </div>
      )}
      {selectedFeature && (
        <div className="map-selection-panel">
          <span className="section-label">{selectedFeature.properties.object_type}</span>
          <strong>{selectedFeature.properties.name}</strong>
          <span>{selectedFeature.properties.key}</span>
          <StatusBadge status={selectedFeature.properties.status} size="sm" />
          <button
            className="secondary-button"
            type="button"
            onClick={() => onOpenObject(selectedFeature.properties.object_id)}
          >
            Open Object
          </button>
        </div>
      )}
    </div>
  );
}

function fitFeatures(map: Map, features: SpatialFeature[], selectedFeature?: SpatialFeature) {
  const targetFeatures = selectedFeature ? [selectedFeature] : features;

  if (targetFeatures.length === 1) {
    map.flyTo({
      center: targetFeatures[0].geometry.coordinates,
      zoom: selectedFeature ? 11 : 5,
      essential: true,
    });
    return;
  }

  const bounds = targetFeatures.reduce<maplibregl.LngLatBounds | null>((currentBounds, feature) => {
    const [lng, lat] = feature.geometry.coordinates;
    if (!currentBounds) {
      return new maplibregl.LngLatBounds([lng, lat], [lng, lat]);
    }
    return currentBounds.extend([lng, lat]);
  }, null);

  if (bounds) {
    map.fitBounds(bounds as LngLatBoundsLike, { padding: 80, maxZoom: 11 });
  }
}
