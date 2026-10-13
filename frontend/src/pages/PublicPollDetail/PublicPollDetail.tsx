import { Link, useParams } from 'react-router-dom';
import { paths, parsePollId } from '../../App/App.ts';
import Countdown from '../../components/Countdown/Countdown.tsx';
import Feedback from '../../components/Feedback/Feedback.tsx';
import LiveIndicator from '../../components/LiveIndicator/LiveIndicator.tsx';
import ResultsChart from '../../components/ResultsChart/ResultsChart.tsx';
import StatusBadge from '../../components/StatusBadge/StatusBadge.tsx';
import NotFound from '../NotFound/NotFound.tsx';
import { usePublicPollDetail } from './PublicPollDetail.ts';
import './PublicPollDetail.scss';

function PollDetail({ pollId }: { pollId: number }) {
  const state = usePublicPollDetail(pollId);
  const { poll, view, error } = state;

  if (error?.status === 404) return <NotFound />;

  return (
    <section className="public-poll">
      <Link to={paths.publicList} className="back-link">
        ← Todas as votações
      </Link>

      {error && (
        <Feedback kind="error" onRetry={state.reload}>
          {error.message}
        </Feedback>
      )}

      {poll && (
        <article className="public-poll__card">
          <header className="public-poll__header">
            <div className="public-poll__meta">
              <StatusBadge status={poll.status} />
              {poll.status === 'open' && poll.closes_at && <Countdown closesAt={poll.closes_at} />}
              {poll.status === 'open' && <LiveIndicator status={state.liveStatus} />}
            </div>
            <button
              type="button"
              className="btn btn--small"
              onClick={state.reload}
              disabled={state.loading}
            >
              ↻ Atualizar
            </button>
          </header>

          <h1 className="public-poll__question">{poll.question}</h1>

          {view === 'vote' && (
            <form className="public-poll__form" onSubmit={state.submitVote}>
              <fieldset className="public-poll__options">
                <legend className="public-poll__legend">Escolhe uma opção</legend>
                {poll.options.map((option) => (
                  <label
                    key={option.id}
                    className={`public-poll__option${
                      state.selectedOptionId === option.id ? ' public-poll__option--selected' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="option"
                      value={option.id}
                      checked={state.selectedOptionId === option.id}
                      onChange={() => state.setSelectedOptionId(option.id)}
                    />
                    <span>{option.text}</span>
                  </label>
                ))}
              </fieldset>
              {state.voteError && <Feedback kind="error">{state.voteError}</Feedback>}
              <button
                type="submit"
                className="btn btn--primary public-poll__submit"
                disabled={state.submitting || state.selectedOptionId === null}
              >
                {state.submitting ? 'A enviar…' : 'Votar'}
              </button>
            </form>
          )}

          {view === 'voted' && (
            <div className="public-poll__status">
              <Feedback kind="success">
                {state.voteMessage ?? 'Já votaste nesta votação. Obrigado!'}
              </Feedback>
              {!poll.results && (
                <p className="muted">
                  Os resultados aparecem aqui assim que o anfitrião fechar a votação.
                </p>
              )}
            </div>
          )}

          {view === 'closed' && (
            <p className="muted public-poll__closed-note">
              Esta votação está fechada.{poll.has_voted && ' Obrigado por teres participado!'}
            </p>
          )}

          {poll.results && (
            <section className="public-poll__results" aria-live="polite">
              <h2 className="public-poll__results-title">
                {poll.status === 'closed' ? 'Resultados finais' : 'Resultados em direto'}
              </h2>
              <ResultsChart results={poll.results} />
            </section>
          )}
        </article>
      )}
    </section>
  );
}

export default function PublicPollDetail() {
  const pollId = parsePollId(useParams().pollId);
  if (pollId === null) return <NotFound />;
  // Keyed so that navigating to another poll starts from a clean state.
  return <PollDetail key={pollId} pollId={pollId} />;
}
