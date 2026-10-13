import type { PollResults } from '../../api/types.ts';

/** Ids of the option(s) with the most votes; empty while nobody has voted. */
export function getLeadingOptionIds(results: PollResults): Set<number> {
  if (results.total_votes === 0) return new Set();
  const maxVotes = Math.max(...results.options.map((option) => option.votes));
  return new Set(
    results.options.filter((option) => option.votes === maxVotes).map((option) => option.id),
  );
}

export const formatPercentage = (value: number) =>
  `${value.toLocaleString('pt-PT', { maximumFractionDigits: 1 })}%`;
