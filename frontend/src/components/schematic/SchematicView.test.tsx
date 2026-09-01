import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { dresden, fan, objectTypesById } from '../../test/fixtures';
import type { ObjectView } from '../../types/objects';
import { SchematicView } from './SchematicView';

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

describe('SchematicView', () => {
  it('renders schematic elements with existing object status and opens by object_id', async () => {
    const user = userEvent.setup();
    const onOpenObject = vi.fn();

    render(
      <SchematicView
        view={schematicView}
        objectsById={new Map([[fan.id, fan]])}
        objectTypesById={objectTypesById}
        onOpenObject={onOpenObject}
        onUpdateLayout={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /Fan 01/ })).toBeInTheDocument();
    expect(screen.getByText('UNKNOWN')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Fan 01/ }));

    expect(onOpenObject).toHaveBeenCalledWith(fan.id);
  });

  it('handles an empty schematic without crashing', () => {
    render(
      <SchematicView
        view={{ ...schematicView, elements: [] }}
        objectsById={new Map()}
        objectTypesById={objectTypesById}
        onOpenObject={vi.fn()}
        onUpdateLayout={vi.fn()}
      />,
    );

    expect(screen.getByText('This schematic has no elements yet.')).toBeInTheDocument();
  });

  it('shows a safe missing-object state for invalid view elements', () => {
    render(
      <SchematicView
        view={schematicView}
        objectsById={new Map()}
        objectTypesById={objectTypesById}
        onOpenObject={vi.fn()}
        onUpdateLayout={vi.fn()}
      />,
    );

    expect(screen.getByText('Missing object')).toBeInTheDocument();
    expect(screen.getByText(fan.id)).toBeInTheDocument();
  });
});
