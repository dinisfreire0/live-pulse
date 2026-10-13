import { Link, useParams } from 'react-router-dom';
import { paths, parsePollId } from '../../App/App.ts';
import Countdown from '../../components/Countdown/Countdown.tsx';
import Feedback from '../../components/Feedback/Feedback.tsx';
import LiveIndicator from '../../components/LiveIndicator/LiveIndicator.tsx';
import QrShare from '../../components/QrShare/QrShare.tsx';
import ResultsChart from '../../components/ResultsChart/ResultsChart.tsx';
import StatusBadge from '../../components/StatusBadge/StatusBadge.tsx';
import TimerSelect from '../../components/TimerSelect/TimerSelect.tsx';
import { formatDateTime } from '../../lib/format.ts';
import NotFound from '../NotFound/NotFound.tsx';
import { useHostPollDetail } from './HostPollDetail.ts';
import './HostPollDetail.scss';

function PollControls({ pollId }: { pollId: number }) {
  const state = useHostPollDetail(pollId);
  const { poll, error } = state;

  if (error?.status === 404) return <NotFound />;

  return (
    <section className="host-poll">
      <Link to={paths.hostDashboard} className="back-link">
        ← Painel do anfitrião
      </Link>

      {error && (
        <Feedback kind="error" onRetry={state.reload}>
          {error.message}
        </Feedback>
      )}

      {poll && (
        <>
          <header className="host-poll__header">
            <div className="host-poll__meta">
              <StatusBadge status={poll.status} />
              {poll.status === 'open' && poll.closes_at && <Countdown closesAt={poll.closes_at} />}
              <span className="muted">Criada {formatDateTime(poll.created_at)}</span>
            </div>
            <h1 className="host-poll__question">{poll.question}</h1>
          </header>

          <div className="host-poll__grid">
            <section className="host-poll__panel host-poll__results">
              <div className="host-poll__panel-header">
                <h2>Resultados</h2>
                <div className="host-poll__panel-actions">
                  {poll.status === 'open' && <LiveIndicator status={state.liveStatus} />}
                  <button
                    type="button"
                    className="btn btn--small"
                    onClick={state.reload}
                    disabled={state.loading}
                  >
                    ↻ Atualizar
                  </button>
                </div>
              </div>
              <ResultsChart results={poll.results} />
            </section>

            <aside className="host-poll__side">
              <section className="host-poll__panel">
                <h2>Controlo</h2>

                {poll.status === 'draft' && (
                  <div className="host-poll__controls">
                    <p className="muted">Esta votação ainda não está visível para o público.</p>
                    <TimerSelect value={state.timerSeconds} onChange={state.setTimerSeconds} />
                    <button
                      type="button"
                      className="btn btn--primary"
                      onClick={state.openPoll}
                      disabled={state.pending}
                    >
                      Abrir votação
                    </button>
                  </div>
                )}

                {poll.status === 'open' && (
                  <div className="host-poll__controls">
                    <label className="host-poll__toggle">
                      <input
                        type="checkbox"
                        checked={poll.show_live_results}
                        onChange={(event) => state.setLiveResults(event.target.checked)}
                        disabled={state.pending}
                      />
                      Mostrar resultados em direto ao público
                    </label>

                    <div className="host-poll__timer">
                      <TimerSelect value={state.timerSeconds} onChange={state.setTimerSeconds} />
                      <button
                        type="button"
                        className="btn"
                        onClick={state.startTimer}
                        disabled={state.pending || state.timerSeconds === 0}
                      >
                        {poll.closes_at ? 'Redefinir' : 'Iniciar'}
                      </button>
                    </div>

                    <button
                      type="button"
                      className="btn btn--danger"
                      onClick={state.closePoll}
                      disabled={state.pending}
                    >
                      Fechar votação
                    </button>
                  </div>
                )}

                {poll.status === 'closed' && (
                  <p className="muted">
                    Votação fechada. Os resultados são finais e visíveis para todos.
                  </p>
                )}

                {state.actionError && <Feedback kind="error">{state.actionError}</Feedback>}
              </section>

              {poll.status !== 'draft' && (
                <section className="host-poll__panel">
                  <QrShare pollId={poll.id} />
                </section>
              )}
            </aside>
          </div>
        </>
      )}
    </section>
  );
}

export default function HostPollDetail() {
  const pollId = parsePollId(useParams().pollId);
  if (pollId === null) return <NotFound />;
  return <PollControls key={pollId} pollId={pollId} />;
}
