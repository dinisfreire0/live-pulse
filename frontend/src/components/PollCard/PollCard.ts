import type { PollStatus } from '../../api/types.ts';

export const pollCardCta = (status: PollStatus) =>
  status === 'open' ? 'Votar →' : 'Ver resultados →';

export const pollCardClass = (status: PollStatus) => `poll-card poll-card--${status}`;
