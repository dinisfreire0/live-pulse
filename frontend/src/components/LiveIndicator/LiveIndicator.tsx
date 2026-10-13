import type { LiveStatus } from '../../lib/useEventSource.ts';
import { LIVE_LABELS, liveIndicatorClass } from './LiveIndicator.ts';
import './LiveIndicator.scss';

interface LiveIndicatorProps {
  status: LiveStatus;
}

export default function LiveIndicator({ status }: LiveIndicatorProps) {
  return (
    <span className={liveIndicatorClass(status)} role="status">
      <span className="live-indicator__dot" aria-hidden="true" />
      {LIVE_LABELS[status]}
    </span>
  );
}
