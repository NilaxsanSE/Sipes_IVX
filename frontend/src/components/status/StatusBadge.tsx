import type { ObjectStatus } from '../../types/objects';

type StatusBadgeProps = {
  status: ObjectStatus | string;
  size?: 'sm' | 'md';
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  return (
    <span className={`status-badge status-badge--${status.toLowerCase()} status-badge--${size}`}>
      <span className="status-badge__dot" aria-hidden="true" />
      {status}
    </span>
  );
}
