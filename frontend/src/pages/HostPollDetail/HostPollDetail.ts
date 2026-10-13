import { useCallback, useState } from 'react';
import { toApiError } from '../../api/client.ts';
import { hostPollsApi } from '../../api/polls.ts';
import type { HostPoll, PollUpdate } from '../../api/types.ts';
import { useEventSource } from '../../lib/useEventSource.ts';
import { useResource } from '../../lib/useResource.ts';

export function useHostPollDetail(pollId: number) {
  const load = useCallback(() => hostPollsApi.get(pollId), [pollId]);
  const { data: poll, setData: setPoll, error, loading, reload } = useResource(load);

  // Results update by themselves while votes can still arrive.
  const liveStatus = useEventSource<HostPoll>(
    poll?.status === 'open' ? hostPollsApi.streamUrl(pollId) : null,
    setPoll,
  );

  const [timerSeconds, setTimerSeconds] = useState(0);
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const update = async (changes: PollUpdate) => {
    setPending(true);
    setActionError(null);
    try {
      setPoll(await hostPollsApi.update(pollId, changes));
    } catch (err) {
      setActionError(toApiError(err).message);
    } finally {
      setPending(false);
    }
  };

  const withTimer = (changes: PollUpdate): PollUpdate =>
    timerSeconds > 0 ? { ...changes, duration_seconds: timerSeconds } : changes;

  return {
    poll,
    error,
    loading,
    reload,
    liveStatus,
    pending,
    actionError,
    timerSeconds,
    setTimerSeconds,
    openPoll: () => update(withTimer({ status: 'open' })),
    closePoll: () => {
      if (window.confirm('Fechar a votação? Os resultados ficam finais e visíveis para todos.')) {
        void update({ status: 'closed' });
      }
    },
    startTimer: () => update(withTimer({})),
    setLiveResults: (enabled: boolean) => update({ show_live_results: enabled }),
  };
}
