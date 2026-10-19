import { type FormEvent, useCallback, useState } from 'react';
import { toApiError } from '../../api/client.ts';
import { publicPollsApi } from '../../api/polls.ts';
import type { PublicPoll, PublicPollWithVote } from '../../api/types.ts';
import { useEventSource } from '../../lib/useEventSource.ts';
import { useResource } from '../../lib/useResource.ts';
import { getVoterToken } from '../../lib/voterToken.ts';

export type PollView = 'vote' | 'voted' | 'closed';

export function getPollView(poll: PublicPollWithVote): PollView {
  if (poll.status === 'closed') return 'closed';
  return poll.has_voted ? 'voted' : 'vote';
}

export function usePublicPollDetail(pollId: number) {
  const voterToken = getVoterToken();
  const load = useCallback(() => publicPollsApi.get(pollId, voterToken), [pollId, voterToken]);
  const { data: poll, setData: setPoll, error, loading, reload } = useResource(load);

  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [voteMessage, setVoteMessage] = useState<string | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);

  const applySnapshot = useCallback(
    (snapshot: PublicPoll) =>
      setPoll((current) => (current ? { ...snapshot, has_voted: current.has_voted } : current)),
    [setPoll],
  );
  const liveStatus = useEventSource<PublicPoll>(
    poll?.status === 'open' ? publicPollsApi.streamUrl(pollId) : null,
    applySnapshot,
  );

  const submitVote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedOptionId === null) {
      setVoteError('Escolhe uma opção antes de votar.');
      return;
    }

    setSubmitting(true);
    setVoteError(null);
    try {
      const receipt = await publicPollsApi.vote(pollId, selectedOptionId, voterToken);
      setVoteMessage(receipt.detail);
      setPoll((current) => current && { ...current, has_voted: true });
    } catch (err) {
      const apiError = toApiError(err);
      setVoteError(apiError.message);
      if (apiError.status === 409) await reload();
    } finally {
      setSubmitting(false);
    }
  };

  return {
    poll,
    view: poll ? getPollView(poll) : null,
    error,
    loading,
    reload,
    liveStatus,
    selectedOptionId,
    setSelectedOptionId,
    submitting,
    submitVote,
    voteMessage,
    voteError,
  };
}
