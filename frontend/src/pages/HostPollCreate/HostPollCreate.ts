import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { paths } from '../../App/App.ts';
import { hostPollsApi } from '../../api/polls.ts';
import type { NewPoll } from '../../api/types.ts';

/** Creates the poll and takes the host straight to its control page. */
export function useCreatePoll() {
  const navigate = useNavigate();
  return useCallback(
    async (poll: NewPoll) => {
      const created = await hostPollsApi.create(poll);
      navigate(paths.hostPoll(created.id));
    },
    [navigate],
  );
}
