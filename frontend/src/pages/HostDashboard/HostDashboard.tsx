import { Link } from 'react-router-dom';
import { paths } from '../../App/App.ts';
import Feedback from '../../components/Feedback/Feedback.tsx';
import StatusBadge from '../../components/StatusBadge/StatusBadge.tsx';
import { formatDateTime, formatVotes } from '../../lib/format.ts';
import { STATUS_FILTERS, useHostDashboard } from './HostDashboard.ts';
import './HostDashboard.scss';

export default function HostDashboard() {
  const { polls, counts, filter, setFilter, hasLoaded, error, loading, reload } =
    useHostDashboard();

  return (
    <section className="host-dashboard">
      <header className="page-header">
        <div>
          <h1>Painel do anfitrião</h1>
          <p className="muted">Cria votações, abre-as ao público e acompanha os resultados.</p>
        </div>
        <div className="page-header__actions">
          <button type="button" className="btn" onClick={reload} disabled={loading}>
            ↻ Atualizar
          </button>
          <Link to={paths.hostNewPoll} className="btn btn--primary">
            + Nova votação
          </Link>
        </div>
      </header>

      <div className="host-dashboard__filters" role="group" aria-label="Filtrar por estado">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={`host-dashboard__filter${filter === value ? ' host-dashboard__filter--active' : ''}`}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {label} <span className="host-dashboard__count">{counts[value]}</span>
          </button>
        ))}
      </div>

      {error && (
        <Feedback kind="error" onRetry={reload}>
          {error.message}
        </Feedback>
      )}

      {hasLoaded &&
        (polls.length > 0 ? (
          <ul className="host-dashboard__list">
            {polls.map((poll) => (
              <li key={poll.id}>
                <Link to={paths.hostPoll(poll.id)} className="host-dashboard__row">
                  <span className="host-dashboard__question">{poll.question}</span>
                  <StatusBadge status={poll.status} />
                  <span className="host-dashboard__votes">{formatVotes(poll.total_votes)}</span>
                  <time className="host-dashboard__date" dateTime={poll.created_at}>
                    {formatDateTime(poll.created_at)}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="host-dashboard__empty">
            <p>Ainda não há votações aqui.</p>
            <Link to={paths.hostNewPoll} className="btn btn--primary">
              Criar a primeira votação
            </Link>
          </div>
        ))}
    </section>
  );
}
