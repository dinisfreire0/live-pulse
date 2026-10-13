import { Link, NavLink, Outlet } from 'react-router-dom';
import { paths } from '../../App/App.ts';
import { NAV_LINKS, navLinkClass } from './Layout.ts';
import './Layout.scss';

export default function Layout() {
  return (
    <div className="layout">
      <header className="layout__header">
        <div className="layout__inner">
          <Link to={paths.publicList} className="layout__brand">
            <span className="layout__pulse" aria-hidden="true" />
            Live Pulse
          </Link>
          <nav className="layout__nav" aria-label="Navegação principal">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={navLinkClass}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="layout__main">
        <Outlet />
      </main>
    </div>
  );
}
