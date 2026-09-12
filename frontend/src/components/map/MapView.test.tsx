import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { demoGeoJson } from '../../test/fixtures';
import { MapView } from './MapView';

const markerElements: HTMLElement[] = [];
const mapOptions: unknown[] = [];

vi.mock('maplibre-gl', () => {
  class MockMap {
    constructor(options: unknown) {
      mapOptions.push(options);
    }
    addControl = vi.fn();
    on = vi.fn();
    flyTo = vi.fn();
    fitBounds = vi.fn();
    remove = vi.fn();
  }

  class MockMarker {
    element: HTMLElement;
    constructor(options: { element: HTMLElement }) {
      this.element = options.element;
      markerElements.push(options.element);
    }
    setLngLat = vi.fn(() => this);
    addTo = vi.fn(() => this);
    remove = vi.fn();
  }

  class MockNavigationControl {}
  class MockLngLatBounds {
    extend = vi.fn(() => this);
  }

  return {
    default: {
      Map: MockMap,
      Marker: MockMarker,
      NavigationControl: MockNavigationControl,
      LngLatBounds: MockLngLatBounds,
    },
    Map: MockMap,
    Marker: MockMarker,
    NavigationControl: MockNavigationControl,
    LngLatBounds: MockLngLatBounds,
  };
});

describe('MapView', () => {
  it('renders a map region and creates markers from GeoJSON object IDs', async () => {
    markerElements.length = 0;
    mapOptions.length = 0;

    render(
      <MapView
        features={demoGeoJson.features}
        selectedObjectId="object-dresden"
        onOpenObject={vi.fn()}
      />,
    );

    expect(screen.getByRole('region', { name: 'Location map' })).toBeInTheDocument();
    await waitFor(() => expect(markerElements).toHaveLength(2));
    expect(markerElements[0]).toHaveAttribute('aria-label', 'Open Dresden');
    expect(mapOptions[0]).toMatchObject({
      dragPan: true,
      scrollZoom: true,
      interactive: true,
      touchZoomRotate: true,
    });
  });

  it('opens the existing object when a marker is clicked and displays selected status', async () => {
    const user = userEvent.setup();
    const onOpenObject = vi.fn();
    markerElements.length = 0;

    render(
      <MapView
        features={demoGeoJson.features}
        selectedObjectId="object-dresden"
        onOpenObject={onOpenObject}
      />,
    );

    await waitFor(() => expect(markerElements).toHaveLength(2));
    expect(markerElements[0].style.background).toBe('rgb(183, 121, 31)');
    expect(screen.getByText('WARNING')).toBeInTheDocument();

    await user.click(markerElements[0]);

    expect(onOpenObject).toHaveBeenCalledWith('object-dresden');
  });

  it('updates marker selection without recreating markers', async () => {
    markerElements.length = 0;

    const { rerender } = render(
      <MapView
        features={demoGeoJson.features}
        selectedObjectId="object-dresden"
        onOpenObject={vi.fn()}
      />,
    );

    await waitFor(() => expect(markerElements).toHaveLength(2));
    expect(markerElements[0]).toHaveClass('map-marker--selected');

    rerender(
      <MapView
        features={demoGeoJson.features}
        selectedObjectId="object-unit-2"
        onOpenObject={vi.fn()}
      />,
    );

    expect(markerElements).toHaveLength(2);
    expect(markerElements[0]).not.toHaveClass('map-marker--selected');
    expect(markerElements[1]).toHaveClass('map-marker--selected');
  });

  it('handles objects without spatial data by showing an empty map state', () => {
    render(<MapView features={[]} onOpenObject={vi.fn()} />);

    expect(screen.getByText('No locations with geographic coordinates are available for this view.')).toBeInTheDocument();
  });
});
