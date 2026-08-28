import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { demoTree, dresden, objectTypesById } from '../../test/fixtures';
import { AppLayout } from './AppLayout';

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{`${location.pathname}${location.search}`}</span>;
}

describe('AppLayout', () => {
  it('keeps map open and selects spatial tree objects while on the map route', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/map']}>
        <AppLayout
          currentObject={null}
          healthStatus="connected"
          tree={demoTree}
          objectTypesById={objectTypesById}
          selectedObjectId={undefined}
          isTreeLoading={false}
          treeError={null}
          spatialObjectIds={new Set([dresden.id])}
        >
          <LocationProbe />
        </AppLayout>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Dresden' }));

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(`/map?objectId=${dresden.id}`);
    });
  });

  it('opens object details for tree objects without spatial data while on the map route', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/map']}>
        <AppLayout
          currentObject={null}
          healthStatus="connected"
          tree={demoTree}
          objectTypesById={objectTypesById}
          selectedObjectId={undefined}
          isTreeLoading={false}
          treeError={null}
          spatialObjectIds={new Set([dresden.id])}
        >
          <LocationProbe />
        </AppLayout>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Fan 01' }));

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/objects/object-fan-01');
    });
  });
});
