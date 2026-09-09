import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusBadge } from './StatusBadge';
import type { ObjectStatus } from '../../types/objects';

describe('StatusBadge', () => {
  it.each(['NORMAL', 'WARNING', 'ERROR', 'UNKNOWN'] satisfies ObjectStatus[])(
    'renders %s status consistently',
    (status) => {
      render(<StatusBadge status={status} />);

      expect(screen.getByLabelText(`Status ${status}`)).toHaveClass(`status-badge--${status.toLowerCase()}`);
    },
  );

  it('keeps normal status quiet in compact mode', () => {
    render(<StatusBadge status="NORMAL" size="sm" variant="compact" />);

    expect(screen.getByLabelText('Status NORMAL')).toHaveClass('status-badge--compact');
  });

  it('keeps warning text visible in compact mode', () => {
    render(<StatusBadge status="WARNING" size="sm" variant="compact" />);

    expect(screen.getByText('WARNING')).toBeVisible();
    expect(screen.getByLabelText('Status WARNING')).toHaveClass('status-badge--compact');
  });
});
