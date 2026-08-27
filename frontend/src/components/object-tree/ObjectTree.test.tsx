import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ObjectTree } from './ObjectTree';
import { demoTree, makeTreeChain, objectTypesById } from '../../test/fixtures';

describe('ObjectTree', () => {
  it('renders recursive object hierarchy with arbitrary depth', () => {
    render(<ObjectTree nodes={demoTree} objectTypesById={objectTypesById} onSelect={vi.fn()} />);

    expect(screen.getByText('Germany')).toBeInTheDocument();
    expect(screen.getByText('Sachsen')).toBeInTheDocument();
    expect(screen.getByText('Dresden')).toBeInTheDocument();
    expect(screen.getByText('Fan 01')).toBeInTheDocument();
  });

  it('supports expand and collapse', async () => {
    const user = userEvent.setup();
    render(<ObjectTree nodes={demoTree} objectTypesById={objectTypesById} onSelect={vi.fn()} />);

    await user.click(screen.getByLabelText('Collapse Germany'));

    expect(screen.queryByText('Sachsen')).not.toBeInTheDocument();

    await user.click(screen.getByLabelText('Expand Germany'));

    expect(screen.getByText('Sachsen')).toBeInTheDocument();
  });

  it('notifies when an object is selected', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ObjectTree nodes={demoTree} objectTypesById={objectTypesById} onSelect={onSelect} />);

    await user.click(screen.getByText('Fan 01'));

    expect(onSelect).toHaveBeenCalledWith('object-fan-01');
  });

  it('highlights the selected object', () => {
    render(
      <ObjectTree
        nodes={demoTree}
        objectTypesById={objectTypesById}
        selectedObjectId="object-dresden"
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText('Dresden').closest('.object-tree__row')).toHaveClass('object-tree__row--selected');
  });

  it('shows empty and no-children states', () => {
    const { rerender } = render(<ObjectTree nodes={[]} objectTypesById={objectTypesById} onSelect={vi.fn()} />);

    expect(screen.getByText('No objects available.')).toBeInTheDocument();

    rerender(<ObjectTree nodes={makeTreeChain(1)} objectTypesById={objectTypesById} onSelect={vi.fn()} />);

    expect(screen.getByLabelText('Level 1 has no children')).toBeDisabled();
  });

  it('renders deeply nested trees without fixed level names', () => {
    render(<ObjectTree nodes={makeTreeChain(12)} objectTypesById={objectTypesById} onSelect={vi.fn()} />);

    expect(screen.getByText('Level 1')).toBeInTheDocument();
    expect(screen.getByText('Level 12')).toBeInTheDocument();
  });
});
