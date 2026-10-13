import { Link } from 'react-router-dom';
import { paths } from '../../App/App.ts';
import type { PublicPollSummary } from '../../api/types.ts';
import Countdown from '../Countdown/Countdown.tsx';
import StatusBadge from '../StatusBadge/StatusBadge.tsx';
import { pollCardClass, pollCardCta } from './PollCard.ts';
import './PollCard.scss';

interface PollCardProps {
  poll: PublicPollSummary;
}

export default function PollCard({ poll }: PollCardProps) {
  return (
    <Link to={paths.publicPoll(poll.id)} className={pollCardClass(poll.status)}>
      <div className="poll-card__meta">
        <StatusBadge status={poll.status} />
        {poll.status === 'open' && poll.closes_at && <Countdown closesAt={poll.closes_at} />}
      </div>
      <h3 className="poll-card__question">{poll.question}</h3>
      <span className="poll-card__cta">{pollCardCta(poll.status)}</span>
    </Link>
  );
}
