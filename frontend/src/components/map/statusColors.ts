import type { ObjectStatus } from '../../types/objects';

export function getStatusColor(status: ObjectStatus | string) {
  switch (status) {
    case 'NORMAL':
      return '#1f8f5f';
    case 'WARNING':
      return '#b7791f';
    case 'ERROR':
      return '#be3b3b';
    default:
      return '#5a6676';
  }
}
