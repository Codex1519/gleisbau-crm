import { useEffect, useMemo, useState } from 'react'
import {
  Link,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import { api } from '../api'
import { findModul } from '../modules'
import { useToast } from '../contexts/ToastContext'
import { Breadcrumb } from '../components/Breadcrumb'
import { Alert } from '../components/Alert'
import { Sektion } from '../components/Sektion'
import { LadeBlock, Spinner } from '../components/Spinner'
import { IconArrowLeft, IconPlus } from '../components/Icons'
import {
  berechneNettoMinuten,
  formatStunden,
} from '../lib/zeiterfassung'

export function ZeiterfassungNeu() {
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const personalModul = findModul('personal')
  const projekteModul = findModul('projekte')

  // URL-Parameter: bestimmt, ob Mitarbeiter/Projekt vorausgewählt und gesperrt sind.
  const lockedPersonal = searchParams.get('personal_id') || ''
  const lockedProjekt = searchParams.get('projekt_id') || ''

  const [personal, setPersonal] = useState([])
  const [projekte, setProjekte] = useState([])
  const [lade, setLade] = useState(true)
  const [fehler, setFehler] = useState(null)
  const [speichere, setSpeichere] = useState(false)

  const [form, setForm] = useState({
    personal_id: lockedPersonal,
    projekt_id: lockedProjekt,
    start_zeit: '',
    end_zeit: '',
    pause_minuten: '0',
  })

  useEffect(() => {
    Promise.all([api.list('personal'), api.list('projekte')])
      .then(([p, pr]) => {
        setPersonal(p)
        setProjekte(pr)
      })
      .catch((e) => setFehler(e.message))
      .finally(() => setLade(false))
  }, [])

  // Live-Berechnung der Arbeitszeit
  const minuten = useMemo(
    () =>
      berechneNettoMinuten({
        start_zeit: form.start_zeit,
        end_zeit: form.end_zeit,
        pause_minuten: form.pause_minuten,
      }),
    [form.start_zeit, form.end_zeit, form.pause_minuten]
  )

  const keinPersonal = personal.length === 0
  const keineProjekte = projekte.length === 0

  async function absenden(e) {
    e.preventDefault()
    setFehler(null)
    setSpeichere(true)
    try {
      const payload = {
        personal_id: Number(form.personal_id),
        projekt_id: Number(form.projekt_id),
        start_zeit: form.start_zeit,
        end_zeit: form.end_zeit,
        pause_minuten:
          form.pause_minuten === '' ? 0 : Number(form.pause_minuten),
      }
      await api.create('zeiterfassungen', payload)
      toast.erfolg('Zeiterfassung erfolgreich angelegt')

      // Smart-Redirect: vom verriegelten Kontext zurück dorthin, sonst Übersicht
      if (lockedPersonal) navigate(`/personal/${lockedPersonal}`)
      else if (lockedProjekt) navigate(`/projekte/${lockedProjekt}`)
      else navigate('/zeiterfassungen')
    } catch (err) {
      setFehler(err.message)
      setSpeichere(false)
    }
  }

  // Vorausgewählter Mitarbeiter zur Anzeige im Subtitel
  const lockedPersonName = useMemo(() => {
    if (!lockedPersonal) return null
    const p = personal.find((x) => x.id === Number(lockedPersonal))
    return p ? personalModul.displayName(p) : null
  }, [lockedPersonal, personal, personalModul])

  const lockedProjektName = useMemo(() => {
    if (!lockedProjekt) return null
    const p = projekte.find((x) => x.id === Number(lockedProjekt))
    return p ? projekteModul.displayName(p) : null
  }, [lockedProjekt, projekte, projekteModul])

  // Subtitel zeigt den vorausgewählten Kontext
  const subtitel = useMemo(() => {
    const parts = []
    if (lockedPersonName) parts.push(`Mitarbeiter: ${lockedPersonName}`)
    if (lockedProjektName) parts.push(`Projekt: ${lockedProjektName}`)
    if (parts.length === 0)
      return 'Arbeitszeit für einen Mitarbeiter auf einem Projekt erfassen'
    return parts.join(' · ')
  }, [lockedPersonName, lockedProjektName])

  // Breadcrumb hängt am verriegelten Kontext
  const breadcrumb = useMemo(() => {
    if (lockedPersonal && lockedPersonName) {
      return [
        { label: 'Module', to: '/' },
        { label: 'Personal', to: '/personal' },
        { label: lockedPersonName, to: `/personal/${lockedPersonal}` },
        { label: 'Neue Zeiterfassung' },
      ]
    }
    if (lockedProjekt && lockedProjektName) {
      return [
        { label: 'Module', to: '/' },
        { label: 'Projekte', to: '/projekte' },
        { label: lockedProjektName, to: `/projekte/${lockedProjekt}` },
        { label: 'Neue Zeiterfassung' },
      ]
    }
    return [
      { label: 'Module', to: '/' },
      { label: 'Zeiterfassungen', to: '/zeiterfassungen' },
      { label: 'Neu anlegen' },
    ]
  }, [lockedPersonal, lockedProjekt, lockedPersonName, lockedProjektName])

  const zurueckLink = lockedPersonal
    ? `/personal/${lockedPersonal}`
    : lockedProjekt
    ? `/projekte/${lockedProjekt}`
    : '/zeiterfassungen'

  return (
    <div className="content">
      <Breadcrumb items={breadcrumb} />

      <div className="page-header">
        <div className="titel-block">
          <h1>Neue Zeiterfassung</h1>
          <div className="subtitel">{subtitel}</div>
        </div>
        <div className="aktionen">
          <Link to={zurueckLink} className="btn btn-ghost">
            <IconArrowLeft />
            Zurück
          </Link>
        </div>
      </div>

      {fehler && (
        <Alert titel="Speichern fehlgeschlagen">{fehler}</Alert>
      )}

      {!lade && (keinPersonal || keineProjekte) && (
        <Alert typ="info" titel="Hinweis">
          Bevor du eine Zeiterfassung anlegst, benötigst du mindestens{' '}
          {keinPersonal && <Link to="/personal/neu">einen Mitarbeiter</Link>}
          {keinPersonal && keineProjekte && ' und '}
          {keineProjekte && <Link to="/projekte/neu">ein Projekt</Link>}
          {'.'}
        </Alert>
      )}

      <Sektion titel="Angaben">
        {lade ? (
          <LadeBlock text="Lade Optionen…" />
        ) : (
          <form onSubmit={absenden}>
            <div className="felder">
              {/* Mitarbeiter */}
              <label className="feld">
                <span className="feld-label">
                  Mitarbeiter
                  <span className="feld-required" aria-hidden="true">
                    *
                  </span>
                </span>
                <select
                  required
                  value={form.personal_id}
                  disabled={!!lockedPersonal || keinPersonal || speichere}
                  onChange={(e) =>
                    setForm({ ...form, personal_id: e.target.value })
                  }
                >
                  <option value="" disabled>
                    {keinPersonal
                      ? 'Keine Mitarbeiter vorhanden'
                      : 'Bitte auswählen…'}
                  </option>
                  {personal.map((p) => (
                    <option key={p.id} value={p.id}>
                      {personalModul.displayName(p)}
                    </option>
                  ))}
                </select>
              </label>

              {/* Projekt */}
              <label className="feld">
                <span className="feld-label">
                  Projekt
                  <span className="feld-required" aria-hidden="true">
                    *
                  </span>
                </span>
                <select
                  required
                  value={form.projekt_id}
                  disabled={!!lockedProjekt || keineProjekte || speichere}
                  onChange={(e) =>
                    setForm({ ...form, projekt_id: e.target.value })
                  }
                >
                  <option value="" disabled>
                    {keineProjekte
                      ? 'Keine Projekte vorhanden'
                      : 'Bitte auswählen…'}
                  </option>
                  {projekte.map((p) => (
                    <option key={p.id} value={p.id}>
                      {projekteModul.displayName(p)}
                    </option>
                  ))}
                </select>
              </label>

              {/* Start */}
              <label className="feld">
                <span className="feld-label">
                  Start
                  <span className="feld-required" aria-hidden="true">
                    *
                  </span>
                </span>
                <input
                  type="datetime-local"
                  required
                  value={form.start_zeit}
                  disabled={speichere}
                  onChange={(e) =>
                    setForm({ ...form, start_zeit: e.target.value })
                  }
                />
              </label>

              {/* Ende */}
              <label className="feld">
                <span className="feld-label">
                  Ende
                  <span className="feld-required" aria-hidden="true">
                    *
                  </span>
                </span>
                <input
                  type="datetime-local"
                  required
                  value={form.end_zeit}
                  disabled={speichere}
                  onChange={(e) =>
                    setForm({ ...form, end_zeit: e.target.value })
                  }
                />
              </label>

              {/* Pause */}
              <label className="feld">
                <span className="feld-label">Pause (Min.)</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.pause_minuten}
                  disabled={speichere}
                  onChange={(e) =>
                    setForm({ ...form, pause_minuten: e.target.value })
                  }
                />
              </label>
            </div>

            {/* Live-Berechnete Arbeitszeit */}
            <div className="zeitsumme">
              <div>
                <div className="zeitsumme-label">Berechnete Arbeitszeit</div>
                <div className="zeitsumme-wert">
                  {minuten != null ? `${formatStunden(minuten)} h` : '— h'}
                </div>
              </div>
              <div className="zeitsumme-detail">
                {minuten != null
                  ? `${Math.round(minuten)} Minuten netto`
                  : 'Start und Ende eingeben'}
              </div>
            </div>

            <div className="form-actions">
              <Link to={zurueckLink} className="btn btn-ghost">
                Abbrechen
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={speichere || keinPersonal || keineProjekte}
              >
                {speichere ? <Spinner /> : <IconPlus />}
                {speichere ? 'Speichert…' : 'Zeiterfassung anlegen'}
              </button>
            </div>

            <style>{`
              .zeitsumme {
                padding: 14px 16px;
                background: var(--accent-soft);
                border: 1px solid var(--accent-soft-border);
                border-radius: var(--r-md);
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                margin-bottom: 16px;
                flex-wrap: wrap;
              }
              .zeitsumme-label {
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: var(--accent-text);
                font-weight: 600;
              }
              .zeitsumme-wert {
                font-size: 24px;
                font-weight: 600;
                color: var(--accent);
                margin-top: 2px;
                font-variant-numeric: tabular-nums;
                letter-spacing: -0.02em;
              }
              .zeitsumme-detail {
                font-size: 12.5px;
                color: var(--accent-text);
                font-weight: 500;
              }
            `}</style>
          </form>
        )}
      </Sektion>
    </div>
  )
}
