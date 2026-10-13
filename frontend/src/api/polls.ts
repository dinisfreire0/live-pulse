import { http, streamUrl } from './client.ts';
import type {
  HostPoll,
  HostPollSummary,
  NewPoll,
  PollUpdate,
  PublicPollSummary,
  PublicPollWithVote,
  VoteReceipt,
} from './types.ts';

export const publicPollsApi = {
  list: () => http.get<PublicPollSummary[]>('/polls/'),
  get: (id: number, voterToken: string) =>
    http.get<PublicPollWithVote>(`/polls/${id}/`, { 'X-Voter-Token': voterToken }),
  vote: (id: number, optionId: number, voterToken: string) =>
    http.post<VoteReceipt>(`/polls/${id}/votes/`, { option_id: optionId, voter_token: voterToken }),
  streamUrl: (id: number) => streamUrl(`/polls/${id}/stream/`),
};

export const hostPollsApi = {
  list: () => http.get<HostPollSummary[]>('/host/polls/'),
  get: (id: number) => http.get<HostPoll>(`/host/polls/${id}/`),
  create: (poll: NewPoll) => http.post<HostPoll>('/host/polls/', poll),
  update: (id: number, changes: PollUpdate) => http.patch<HostPoll>(`/host/polls/${id}/`, changes),
  streamUrl: (id: number) => streamUrl(`/host/polls/${id}/stream/`),
};
