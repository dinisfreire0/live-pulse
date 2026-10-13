import type { PollStatus } from '../../api/types.ts';
import { STATUS_LABELS, statusBadgeClass } from './StatusBadge.ts';
import './StatusBadge.scss';

interface StatusBadgeProps {
  status: PollStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={statusBadgeClass(status)}>{STATUS_LABELS[status]}</span>;
}
