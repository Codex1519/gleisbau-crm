import { Link } from 'react-router-dom'
import { Breadcrumb } from '../components/Breadcrumb'
import { Sektion } from '../components/Sektion'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { IconSonne, IconMond } from '../components/Icons'

const THEMES = [
  {
    value: 'hell',
    label: 'Hell',
    text: 'Helles Farbschema, unabhängig vom System',
    icon: <IconSonne />,
  },
  {
    value: 'dunkel',
    label: 'Dunkel',
    text: 'Dunkles Farbschema, angenehm bei wenig Licht',
    icon: <IconMond />,
  },
  {
    value: 'system',
    label: 'System',
    text: 'Folgt automatisch der Einstellung deines Geräts',
    icon: (
      <span style={{ display: 'inline-flex', gap: 2 }}>
        <IconSonne />
        <IconMond />
      </span>
    ),
  },
]

export function Einstellungen() {
  const { theme, setTheme } = useTheme()
  const { benutzer } = useAuth()

  return (
    <div className="content">
      <Breadcrumb items={[{ label: 'Einstellungen' }]} />

      <div className="page-header">
        <div className="titel-block">
          <h1>Einstellungen</h1>
          <div className="subtitel">
            Darstellung und Konto-Einstellungen
          </div>
        </div>
      </div>

      <Sektion titel="Darstellung">
        <div
          role="radiogroup"
          aria-label="Farbschema"
          className="theme-wahl"
        >
          {THEMES.map((t) => (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={theme === t.value}
              className={`theme-option${
                theme === t.value ? ' aktiv' : ''
              }`}
              onClick={() => setTheme(t.value)}
            >
              <span className="theme-option-icon">{t.icon}</span>
              <span className="theme-option-label">{t.label}</span>
              <span className="theme-option-text">{t.text}</span>
            </button>
          ))}
        </div>
      </Sektion>

      <Sektion titel="Konto">
        <div className="value-grid">
          <div className="value-item">
            <div className="value-label">Benutzername</div>
            <div className="value">{benutzer?.benutzername || '—'}</div>
          </div>
          <div className="value-item">
            <div className="value-label">Rolle</div>
            <div className="value">{benutzer?.rolle || '—'}</div>
          </div>
          <div className="value-item">
            <div className="value-label">Passwort</div>
            <div className="value">
              <Link to="/passwort">Passwort ändern →</Link>
            </div>
          </div>
        </div>
      </Sektion>

      <Sektion titel="Über">
        <div className="value-grid">
          <div className="value-item">
            <div className="value-label">Anwendung</div>
            <div className="value">Gleisbau-CRM · Prototyp</div>
          </div>
          <div className="value-item">
            <div className="value-label">Version</div>
            <div className="value">v0.7</div>
          </div>
        </div>
      </Sektion>
    </div>
  )
}
