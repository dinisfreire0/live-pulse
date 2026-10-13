import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from '../components/Layout/Layout.tsx';
import HostDashboard from '../pages/HostDashboard/HostDashboard.tsx';
import HostPollCreate from '../pages/HostPollCreate/HostPollCreate.tsx';
import HostPollDetail from '../pages/HostPollDetail/HostPollDetail.tsx';
import NotFound from '../pages/NotFound/NotFound.tsx';
import PublicPollDetail from '../pages/PublicPollDetail/PublicPollDetail.tsx';
import PublicPollList from '../pages/PublicPollList/PublicPollList.tsx';
import { paths } from './App.ts';
import './App.scss';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to={paths.publicList} replace />} />
          <Route path={paths.publicList} element={<PublicPollList />} />
          <Route path={paths.publicPoll(':pollId')} element={<PublicPollDetail />} />
          <Route path={paths.hostDashboard} element={<HostDashboard />} />
          <Route path={paths.hostNewPoll} element={<HostPollCreate />} />
          <Route path={paths.hostPoll(':pollId')} element={<HostPollDetail />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
