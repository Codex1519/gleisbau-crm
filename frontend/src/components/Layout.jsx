import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { MODULE } from '../modules'
import {
  ModulIcon,
  IconHome,
  IconEuro,
  IconSonne,
  IconMond,
  IconZahnrad,
} from './Icons'
import { GlobalSearch } from './GlobalSearch'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useSearchData } from '../contexts/SearchContext'

const GESEHEN_KEY = 'gleisbau_berichte_gesehen'

export function Layout() {
  const { benutzer, istAdmin, logout } = useAuth()
  const { toggle, istDunkel } = useTheme()
  const { daten } = useSearchData()
  const navigate = useNavigate()
  const location = useLocation()

  // Benachrichtigung: neue Bautagesberichte seit dem letzten Besuch der
  // Übersicht (pro Browser gemerkt; Daten kommen aus dem 5-Minuten-Cache).
  const [gesehen, setGesehen] = useState(() => {
    const wert = localStorage.getItem(GESEHEN_KEY)
    if (wert) return wert
    // Erstbesuch: alles Bestehende gilt als gesehen
    const jetzt = new Date().toISOString()
    localStorage.setItem(GESEHEN_KEY, jetzt)
    return jetzt
  })

  useEffect(() => {
    if (location.pathname.startsWith('/bautagesberichte')) {
      const jetzt = new Date().toISOString()
      localStorage.setItem(GESEHEN_KEY, jetzt)
      setGesehen(jetzt)
    }
  }, [location.pathname, daten.bautagesberichte])

  const neueBerichte = (daten.bautagesberichte || []).filter(
    (b) => b.created_at && b.created_at > gesehen
  ).length

  function abmelden() {
    logout()
    navigate('/login', { replace: true })
  }

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
                  {m.key === 'bautagesberichte' && neueBerichte > 0 && (
                    <span
                      className="nav-badge"
                      title={`${neueBerichte} neue Berichte seit deinem letzten Besuch`}
                    >
                      {neueBerichte}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="nav-caption">Finanzen</div>
          <ul>
            <li>
              <NavLink
                to="/rechnungen"
                className={({ isActive }) =>
                  `nav-link${isActive ? ' aktiv' : ''}`
                }
              >
                <IconEuro className="icon nav-icon" />
                <span>Rechnungen</span>
              </NavLink>
            </li>
          </ul>

          {istAdmin && (
            <>
              <div className="nav-caption">Verwaltung</div>
              <ul>
                <li>
                  <NavLink
                    to="/benutzer"
                    className={({ isActive }) =>
                      `nav-link${isActive ? ' aktiv' : ''}`
                    }
                  >
                    <ModulIcon name="users" className="icon nav-icon" />
                    <span>Benutzer</span>
                  </NavLink>
                </li>
              </ul>
            </>
          )}

          <div className="nav-caption">System</div>
          <ul>
            <li>
              <NavLink
                to="/einstellungen"
                className={({ isActive }) =>
                  `nav-link${isActive ? ' aktiv' : ''}`
                }
              >
                <IconZahnrad className="icon nav-icon" />
                <span>Einstellungen</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-benutzer">
            <span>
              {benutzer?.benutzername}
              <span className="sidebar-rolle"> · {benutzer?.rolle}</span>
            </span>
            <button
              type="button"
              className="btn btn-ghost sidebar-logout"
              onClick={abmelden}
            >
              Abmelden
            </button>
          </div>
          <div className="sidebar-benutzer">
            <NavLink to="/passwort" className="sidebar-pw-link">
              Passwort ändern
            </NavLink>
          </div>
          <div>v0.7 · Gleisbau-CRM</div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <GlobalSearch />
          <button
            type="button"
            className="theme-toggle"
            onClick={toggle}
            title={istDunkel ? 'Zum hellen Modus wechseln' : 'Zum dunklen Modus wechseln'}
            aria-label={istDunkel ? 'Heller Modus' : 'Dunkler Modus'}
          >
            {istDunkel ? <IconSonne /> : <IconMond />}
          </button>
        </header>
        <Outlet />
      </main>
    </div>
  )
}
