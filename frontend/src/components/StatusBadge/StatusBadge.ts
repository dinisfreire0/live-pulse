import type { PollStatus } from '../../api/types.ts';

export const STATUS_LABELS: Record<PollStatus, string> = {
  draft: 'Rascunho',
  open: 'Aberta',
  closed: 'Fechada',
};

export const statusBadgeClass = (status: PollStatus) => `status-badge status-badge--${status}`;
