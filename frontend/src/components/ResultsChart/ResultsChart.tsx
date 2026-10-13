import type { PollResults } from '../../api/types.ts';
import { formatVotes } from '../../lib/format.ts';
import { formatPercentage, getLeadingOptionIds } from './ResultsChart.ts';
import './ResultsChart.scss';

interface ResultsChartProps {
  results: PollResults;
}

export default function ResultsChart({ results }: ResultsChartProps) {
  const leaders = getLeadingOptionIds(results);

  return (
    <div className="results-chart">
      <ul className="results-chart__list">
        {results.options.map((option) => (
          <li
            key={option.id}
            className={`results-chart__row${leaders.has(option.id) ? ' results-chart__row--leading' : ''}`}
          >
            <div className="results-chart__labels">
              <span className="results-chart__text">{option.text}</span>
              <span className="results-chart__value">
                {formatPercentage(option.percentage)}
                <span className="results-chart__votes"> · {formatVotes(option.votes)}</span>
              </span>
            </div>
            <div
              className="results-chart__track"
              role="progressbar"
              aria-label={option.text}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={option.percentage}
            >
              <div className="results-chart__bar" style={{ width: `${option.percentage}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <p className="results-chart__total">
        Total: <strong>{formatVotes(results.total_votes)}</strong>
      </p>
    </div>
  );
}
