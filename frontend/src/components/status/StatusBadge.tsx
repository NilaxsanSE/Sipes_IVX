import type { ObjectStatus } from '../../types/objects';

type StatusBadgeProps = {
  status: ObjectStatus | string;
  size?: 'sm' | 'md';
  variant?: 'full' | 'compact';
};

export function StatusBadge({ status, size = 'md', variant = 'full' }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();

  return (
    <span
      aria-label={`Status ${status}`}
      className={`status-badge status-badge--${normalizedStatus} status-badge--${size} status-badge--${variant}`}
      title={String(status)}
    >
      <span className="status-badge__dot" aria-hidden="true" />
      <span className="status-badge__label">{status}</span>
    </span>
  );
}
