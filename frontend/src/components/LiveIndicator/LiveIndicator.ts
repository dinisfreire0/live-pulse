import type { LiveStatus } from '../../lib/useEventSource.ts';

export const LIVE_LABELS: Record<LiveStatus, string> = {
  idle: 'Sem atualizações automáticas',
  connecting: 'A ligar…',
  live: 'Em direto',
};

export const liveIndicatorClass = (status: LiveStatus) =>
  `live-indicator live-indicator--${status}`;
