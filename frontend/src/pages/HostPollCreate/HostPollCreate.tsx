import { Link } from 'react-router-dom';
import { paths } from '../../App/App.ts';
import PollForm from '../../components/PollForm/PollForm.tsx';
import { useCreatePoll } from './HostPollCreate.ts';
import './HostPollCreate.scss';

export default function HostPollCreate() {
  const createPoll = useCreatePoll();

  return (
    <section className="host-poll-create">
      <Link to={paths.hostDashboard} className="back-link">
        ← Painel do anfitrião
      </Link>
      <header className="page-header">
        <h1>Nova votação</h1>
      </header>
      <PollForm onSubmit={createPoll} />
    </section>
  );
}
