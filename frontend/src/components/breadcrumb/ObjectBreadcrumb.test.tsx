import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { dresden, fan, germany, sachsen } from '../../test/fixtures';
import { ObjectBreadcrumb } from './ObjectBreadcrumb';

describe('ObjectBreadcrumb', () => {
  it('generates a clickable breadcrumb from ancestors and selected object', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(<ObjectBreadcrumb items={[germany, sachsen, dresden, fan]} onNavigate={onNavigate} />);

    expect(screen.getByRole('button', { name: 'Germany' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fan 01' })).toHaveAttribute('aria-current', 'page');

    await user.click(screen.getByRole('button', { name: 'Sachsen' }));

    expect(onNavigate).toHaveBeenCalledWith('object-sachsen');
  });
});
