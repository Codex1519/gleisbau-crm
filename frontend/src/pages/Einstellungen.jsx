import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { Breadcrumb } from '../components/Breadcrumb'
import { Sektion } from '../components/Sektion'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { IconSonne, IconMond } from '../components/Icons'
import { speichereFirmendaten } from '../lib/rechnung'

// Firmendaten = Absender aller Rechnungen (Pflicht für den XRechnung-Export)
const FIRMEN_FELDER = [
  { name: 'name', label: 'Firmenname', pflichtXml: true },
  { name: 'strasse', label: 'Straße', pflichtXml: true },
  { name: 'hausnummer', label: 'Hausnummer' },
  { name: 'plz', label: 'PLZ', pflichtXml: true },
  { name: 'ort', label: 'Ort', pflichtXml: true },
  { name: 'ust_id', label: 'USt-IdNr. (DE…)', pflichtXml: true },
  { name: 'steuernummer', label: 'Steuernummer' },
  { name: 'iban', label: 'IBAN', pflichtXml: true },
  { name: 'bic', label: 'BIC' },
  { name: 'bank', label: 'Bank' },
  { name: 'email', label: 'E-Mail (Rechnungen)', pflichtXml: true },
  { name: 'telefon', label: 'Telefon', pflichtXml: true },
]

function FirmendatenSektion() {
  const toast = useToast()
  const [form, setForm] = useState(null)
  const [speichert, setSpeichert] = useState(false)

  useEffect(() => {
    api
      .list('firmendaten')
      .then((fd) => setForm(fd))
      .catch(() => setForm({}))
  }, [])

  async function speichern(event) {
    event.preventDefault()
    setSpeichert(true)
    try {
      await speichereFirmendaten(form)
      toast.erfolg('Firmendaten gespeichert')
    } catch (e) {
      toast.fehler(e.message)
    } finally {
      setSpeichert(false)
    }
  }

  if (!form) return null

  return (
    <Sektion titel="Firmendaten (Rechnungen)">
      <p className="subtitel" style={{ marginBottom: 14 }}>
        Diese Angaben erscheinen als Absender auf allen Rechnungen. Felder mit
        * sind für den XRechnung-Export (E-Rechnung) erforderlich.
      </p>
      <form onSubmit={speichern}>
        <div className="felder">
          {FIRMEN_FELDER.map((f) => (
            <label key={f.name} className="feld">
              <span className="feld-label">
                {f.label}
                {f.pflichtXml && (
                  <span className="feld-required" aria-hidden="true">
                    *
                  </span>
                )}
              </span>
              <input
                type="text"
                value={form[f.name] ?? ''}
                onChange={(e) =>
                  setForm((alt) => ({ ...alt, [f.name]: e.target.value }))
                }
              />
            </label>
          ))}
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={speichert}>
            {speichert ? 'Wird gespeichert…' : 'Firmendaten speichern'}
          </button>
        </div>
      </form>
    </Sektion>
  )
}

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
  const { benutzer, istAdmin } = useAuth()

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

      {istAdmin && <FirmendatenSektion />}

      <Sektion titel="Über">
        <div className="value-grid">
          <div className="value-item">
            <div className="value-label">Anwendung</div>
            <div className="value">Gleisbau-CRM · Prototyp</div>
          </div>
          <div className="value-item">
            <div className="value-label">Version</div>
            <div className="value">v1.0</div>
          </div>
        </div>
      </Sektion>
    </div>
  )
}
