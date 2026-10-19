export type PollStatus = 'draft' | 'open' | 'closed';

export interface PollOption {
  id: number;
  text: string;
}

export interface OptionResult extends PollOption {
  votes: number;
  percentage: number;
}

export interface PollResults {
  total_votes: number;
  options: OptionResult[];
}

interface PollBase {
  id: number;
  question: string;
  status: PollStatus;
  closes_at: string | null;
  created_at: string;
}

export type PublicPollSummary = PollBase;

export interface PublicPoll extends PollBase {
  show_live_results: boolean;
  options: PollOption[];
  results: PollResults | null;
}

export interface PublicPollWithVote extends PublicPoll {
  has_voted: boolean;
}

export interface HostPollSummary extends PollBase {
  show_live_results: boolean;
  total_votes: number;
}

export interface HostPoll extends PollBase {
  show_live_results: boolean;
  options: PollOption[];
  results: PollResults;
}

export interface NewPoll {
  question: string;
  options: string[];
}

export interface PollUpdate {
  status?: PollStatus;
  show_live_results?: boolean;
  duration_seconds?: number;
}

export interface VoteReceipt {
  id: number;
  option_id: number;
  created_at: string;
  detail: string;
}
