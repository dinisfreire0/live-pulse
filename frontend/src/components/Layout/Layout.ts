import { paths } from '../../App/App.ts';

export const NAV_LINKS = [
  { to: paths.publicList, label: 'Votar' },
  { to: paths.hostDashboard, label: 'Anfitrião' },
];

export const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'layout__link layout__link--active' : 'layout__link';
