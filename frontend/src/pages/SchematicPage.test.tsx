import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dresden, fan, germany, objectTypesById, sachsen } from '../test/fixtures';
import type { ObjectView } from '../types/objects';
import { SchematicPage } from './SchematicPage';

const schematicView: ObjectView = {
  id: 'view-storage-plant',
  object_id: dresden.id,
  type: 'SCHEMATIC',
  name: 'Storage Plant Schematic',
  configuration: { canvas: { width: 900, height: 420 } },
  created_at: '2026-08-29T00:00:00.000Z',
  updated_at: '2026-08-29T00:00:00.000Z',
  elements: [
    {
      id: 'element-fan',
      view_id: 'view-storage-plant',
      object_id: fan.id,
      element_key: 'fan-01',
      layout: { x: 500, y: 140, width: 160, height: 110, shape: 'fan' },
      created_at: '2026-08-29T00:00:00.000Z',
      updated_at: '2026-08-29T00:00:00.000Z',
    },
  ],
};

const getObject = vi.fn();
const getObjectAncestors = vi.fn();
const getObjectSchematicView = vi.fn();
const listObjects = vi.fn();
const updateViewElementLayout = vi.fn();

vi.mock('../api/objects', () => ({
  getObject: (objectId: string) => getObject(objectId),
  getObjectAncestors: (objectId: string) => getObjectAncestors(objectId),
  getObjectSchematicView: (objectId: string) => getObjectSchematicView(objectId),
  listObjects: () => listObjects(),
  updateViewElementLayout: (elementId: string, layout: object) => updateViewElementLayout(elementId, layout),
}));

vi.mock('../components/schematic/DrawIoFrame', () => ({
  DrawIoFrame: () => <div>Draw.io self-hosted editor</div>,
}));

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

describe('SchematicPage', () => {
  beforeEach(() => {
    getObject.mockResolvedValue(dresden);
    getObjectAncestors.mockResolvedValue([germany, sachsen]);
    getObjectSchematicView.mockResolvedValue(schematicView);
    listObjects.mockResolvedValue([germany, sachsen, dresden, fan]);
    updateViewElementLayout.mockResolvedValue(schematicView.elements[0]);
  });

  it('loads a schematic view and navigates to the bound IVX object', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={[`/objects/${dresden.id}/schema`]}>
        <Routes>
          <Route
            path="/objects/:objectId/schema"
            element={
              <SchematicPage
                objectTypesById={objectTypesById}
                onCurrentObjectChange={vi.fn()}
              />
            }
          />
          <Route path="/objects/:objectId" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Storage Plant Schematic' })).toBeInTheDocument();
    expect(screen.getByText('Germany')).toBeInTheDocument();
    expect(screen.getByText('Sachsen')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Fan 01/ }));

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(`/objects/${fan.id}`);
    });
  });
});
