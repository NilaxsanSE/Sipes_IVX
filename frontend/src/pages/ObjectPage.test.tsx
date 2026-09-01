import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { dresden, fan, germany, objectTypesById, sachsen } from '../test/fixtures';
import { ObjectDetails } from './ObjectPage';

describe('ObjectDetails', () => {
  it('renders object details, dynamic properties, breadcrumb and children', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(
      <ObjectDetails
        object={dresden}
        parent={sachsen}
        ancestors={[germany, sachsen]}
        children={[fan]}
        hasSpatial
        hasSchematic
        objectTypesById={objectTypesById}
        onNavigate={onNavigate}
        onOpenMap={onNavigate}
        onOpenSchematic={onNavigate}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Dresden' })).toBeInTheDocument();
    expect(screen.getAllByText('WARNING')).toHaveLength(2);
    expect(screen.getAllByText('Sachsen')).toHaveLength(2);
    expect(screen.getByText('Fan 01')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View on Map' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Schema' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Fan 01' }));

    expect(onNavigate).toHaveBeenCalledWith('object-fan-01');
  });

  it('renders objects with no children and nested JSON properties', () => {
    render(
      <ObjectDetails
        object={fan}
        parent={dresden}
        ancestors={[germany, sachsen, dresden]}
        children={[]}
        objectTypesById={objectTypesById}
        onNavigate={vi.fn()}
      />,
    );

    expect(screen.getByText('This object does not contain any direct children.')).toBeInTheDocument();
    expect(screen.getByText('bearing')).toBeInTheDocument();
    expect(screen.getByText(/temperature/)).toBeInTheDocument();
  });
});
