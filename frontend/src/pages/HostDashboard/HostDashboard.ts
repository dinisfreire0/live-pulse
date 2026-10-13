import { useMemo, useState } from 'react';
import { hostPollsApi } from '../../api/polls.ts';
import type { HostPollSummary, PollStatus } from '../../api/types.ts';
import { useResource } from '../../lib/useResource.ts';

export type StatusFilter = 'all' | PollStatus;

export const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'draft', label: 'Rascunho' },
  { value: 'open', label: 'Abertas' },
  { value: 'closed', label: 'Fechadas' },
];

export function countByStatus(polls: HostPollSummary[]): Record<StatusFilter, number> {
  const counts: Record<StatusFilter, number> = { all: polls.length, draft: 0, open: 0, closed: 0 };
  for (const poll of polls) counts[poll.status] += 1;
  return counts;
}

export function useHostDashboard() {
  const { data, error, loading, reload } = useResource(hostPollsApi.list);
  const [filter, setFilter] = useState<StatusFilter>('all');

  const polls = useMemo(() => data ?? [], [data]);
  const counts = useMemo(() => countByStatus(polls), [polls]);
  const visiblePolls = useMemo(
    () => (filter === 'all' ? polls : polls.filter((poll) => poll.status === filter)),
    [polls, filter],
  );

  return {
    polls: visiblePolls,
    counts,
    filter,
    setFilter,
    hasLoaded: data !== null,
    error,
    loading,
    reload,
  };
}
