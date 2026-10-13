import { useMemo } from 'react';
import { publicPollsApi } from '../../api/polls.ts';
import type { PublicPollSummary } from '../../api/types.ts';
import { useResource } from '../../lib/useResource.ts';

export function groupByStatus(polls: PublicPollSummary[]) {
  return {
    openPolls: polls.filter((poll) => poll.status === 'open'),
    closedPolls: polls.filter((poll) => poll.status === 'closed'),
  };
}

export function usePublicPollList() {
  const { data, error, loading, reload } = useResource(publicPollsApi.list);
  const groups = useMemo(() => groupByStatus(data ?? []), [data]);
  return { ...groups, hasLoaded: data !== null, error, loading, reload };
}
