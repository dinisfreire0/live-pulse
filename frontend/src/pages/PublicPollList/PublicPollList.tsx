import Feedback from '../../components/Feedback/Feedback.tsx';
import PollCard from '../../components/PollCard/PollCard.tsx';
import { usePublicPollList } from './PublicPollList.ts';
import './PublicPollList.scss';

export default function PublicPollList() {
  const { openPolls, closedPolls, hasLoaded, error, loading, reload } = usePublicPollList();

  return (
    <section className="public-poll-list">
      <header className="page-header">
        <div>
          <h1>Votações</h1>
          <p className="muted">Escolhe uma votação aberta para participar.</p>
        </div>
        <button type="button" className="btn" onClick={reload} disabled={loading}>
          {loading ? 'A atualizar…' : '↻ Atualizar'}
        </button>
      </header>

      {error && (
        <Feedback kind="error" onRetry={reload}>
          {error.message}
        </Feedback>
      )}

      {hasLoaded && (
        <>
          <h2 className="public-poll-list__heading">Abertas</h2>
          {openPolls.length > 0 ? (
            <ul className="public-poll-list__grid">
              {openPolls.map((poll) => (
                <li key={poll.id}>
                  <PollCard poll={poll} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="public-poll-list__empty">Não há votações abertas neste momento.</p>
          )}

          <h2 className="public-poll-list__heading">Fechadas</h2>
          {closedPolls.length > 0 ? (
            <ul className="public-poll-list__grid">
              {closedPolls.map((poll) => (
                <li key={poll.id}>
                  <PollCard poll={poll} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="public-poll-list__empty">Ainda não há votações fechadas.</p>
          )}
        </>
      )}
    </section>
  );
}
