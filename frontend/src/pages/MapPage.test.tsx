import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { demoGeoJson } from '../test/fixtures';
import { MapPage } from './MapPage';

const getSpatialGeoJson = vi.fn();

vi.mock('../api/objects', () => ({
  getSpatialGeoJson: (bbox?: string) => getSpatialGeoJson(bbox),
}));

vi.mock('../components/map/MapView', () => ({
  MapView: ({
    features,
    selectedObjectId,
    onOpenObject,
  }: {
    features: typeof demoGeoJson.features;
    selectedObjectId?: string | null;
    onOpenObject: (objectId: string) => void;
  }) => (
    <div>
      <div data-testid="map-view">selected:{selectedObjectId ?? 'none'}</div>
      {features.map((feature) => (
        <button
          key={feature.properties.object_id}
          type="button"
          onClick={() => onOpenObject(feature.properties.object_id)}
        >
          Marker {feature.properties.name}
        </button>
      ))}
    </div>
  ),
}));

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

describe('MapPage', () => {
  beforeEach(() => {
    getSpatialGeoJson.mockResolvedValue(demoGeoJson);
  });

  it('loads GeoJSON and navigates by object_id when a marker is selected', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/map?objectId=object-dresden']}>
        <Routes>
          <Route path="/map" element={<MapPage />} />
          <Route path="/objects/:objectId" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByTestId('map-view')).toHaveTextContent('selected:object-dresden');
    expect(getSpatialGeoJson).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Marker Unit 2' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Marker Dresden' }));

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/objects/object-dresden'));
  });

  it('shows a safe message when the selected object has no spatial data', async () => {
    render(
      <MemoryRouter initialEntries={['/map?objectId=object-without-spatial']}>
        <MapPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('The selected object has no geographic record yet.')).toBeInTheDocument();
  });
});
