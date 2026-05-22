import { NavLink, Outlet } from 'react-router-dom'
import { MODULE } from '../modules'
import { ModulIcon, IconHome } from './Icons'
import { GlobalSearch } from './GlobalSearch'

export function Layout() {
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo" aria-hidden="true">
            GB
          </div>
          <div>
            <div className="brand-name">Gleisbau-CRM</div>
            <div className="brand-sub">Prototyp</div>
          </div>
        </div>

        <nav aria-label="Hauptnavigation">
          <div className="nav-caption">Übersicht</div>
          <ul>
            <li>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `nav-link${isActive ? ' aktiv' : ''}`
                }
              >
                <IconHome className="icon nav-icon" />
                <span>Dashboard</span>
              </NavLink>
            </li>
          </ul>

          <div className="nav-caption">Module</div>
          <ul>
            {MODULE.map((m) => (
              <li key={m.key}>
                <NavLink
                  to={`/${m.key}`}
                  className={({ isActive }) =>
                    `nav-link${isActive ? ' aktiv' : ''}`
                  }
                >
                  <ModulIcon name={m.icon} className="icon nav-icon" />
                  <span>{m.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">v0.1 · API localhost:8000</div>
      </aside>

      <main className="main">
        <header className="topbar">
          <GlobalSearch />
        </header>
        <Outlet />
      </main>
    </div>
  )
}
