import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusBadge } from './StatusBadge';
import type { ObjectStatus } from '../../types/objects';

describe('StatusBadge', () => {
  it.each(['NORMAL', 'WARNING', 'ERROR', 'UNKNOWN'] satisfies ObjectStatus[])(
    'renders %s status consistently',
    (status) => {
      render(<StatusBadge status={status} />);

      expect(screen.getByText(status)).toHaveClass(`status-badge--${status.toLowerCase()}`);
    },
  );
});
