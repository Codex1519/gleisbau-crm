import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { findModul } from '../modules'
import { useToast } from '../contexts/ToastContext'
import { Breadcrumb } from '../components/Breadcrumb'
import { Alert } from '../components/Alert'
import { Sektion } from '../components/Sektion'
import { LadeBlock, Spinner } from '../components/Spinner'
import { IconArrowLeft, IconPlus } from '../components/Icons'

export function BautagesberichtNeu() {
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const personalModul = findModul('personal')
  const projekteModul = findModul('projekte')

  const lockedProjekt = searchParams.get('projekt_id') || ''

  const [personal, setPersonal] = useState([])
  const [projekte, setProjekte] = useState([])
  const [lade, setLade] = useState(true)
  const [fehler, setFehler] = useState(null)
  const [speichere, setSpeichere] = useState(false)

  const [form, setForm] = useState({
    projekt_id: lockedProjekt,
    personal_id: '',
    datum: '',
    wetter: '',
    beschreibung: '',
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

  const keinPersonal = personal.length === 0
  const keineProjekte = projekte.length === 0

  async function absenden(e) {
    e.preventDefault()
    setFehler(null)
    setSpeichere(true)
    try {
      // Payload-Bereinigung wie überall: leere optionale Strings raus,
      // Datums-Pflichtfelder bleiben befüllt.
      const payload = {
        projekt_id: Number(form.projekt_id),
        personal_id: Number(form.personal_id),
        datum: form.datum,
      }
      if (form.wetter) payload.wetter = form.wetter
      if (form.beschreibung) payload.beschreibung = form.beschreibung

      await api.create('bautagesberichte', payload)
      toast.erfolg('Bautagesbericht erfolgreich angelegt')

      if (lockedProjekt) navigate(`/projekte/${lockedProjekt}`)
      else navigate('/bautagesberichte')
    } catch (err) {
      setFehler(err.message)
      setSpeichere(false)
    }
  }

  const lockedProjektName = useMemo(() => {
    if (!lockedProjekt) return null
    const p = projekte.find((x) => x.id === Number(lockedProjekt))
    return p ? projekteModul.displayName(p) : null
  }, [lockedProjekt, projekte, projekteModul])

  const breadcrumb = useMemo(() => {
    if (lockedProjekt && lockedProjektName) {
      return [
        { label: 'Module', to: '/' },
        { label: 'Projekte', to: '/projekte' },
        { label: lockedProjektName, to: `/projekte/${lockedProjekt}` },
        { label: 'Neuer Bautagesbericht' },
      ]
    }
    return [
      { label: 'Module', to: '/' },
      { label: 'Bautagesberichte', to: '/bautagesberichte' },
      { label: 'Neu anlegen' },
    ]
  }, [lockedProjekt, lockedProjektName])

  const zurueckLink = lockedProjekt
    ? `/projekte/${lockedProjekt}`
    : '/bautagesberichte'

  return (
    <div className="content">
      <Breadcrumb items={breadcrumb} />

      <div className="page-header">
        <div className="titel-block">
          <h1>Neuer Bautagesbericht</h1>
          <div className="subtitel">
            {lockedProjektName
              ? `Projekt: ${lockedProjektName}`
              : 'Tageseinsatz auf einem Projekt erfassen'}
          </div>
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
          Bevor du einen Bautagesbericht anlegst, benötigst du mindestens{' '}
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
              <label className="feld">
                <span className="feld-label">
                  Projekt
                  <span className="feld-required" aria-hidden="true">*</span>
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

              <label className="feld">
                <span className="feld-label">
                  Ersteller
                  <span className="feld-required" aria-hidden="true">*</span>
                </span>
                <select
                  required
                  value={form.personal_id}
                  disabled={keinPersonal || speichere}
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

              <label className="feld">
                <span className="feld-label">
                  Datum
                  <span className="feld-required" aria-hidden="true">*</span>
                </span>
                <input
                  type="date"
                  required
                  value={form.datum}
                  disabled={speichere}
                  onChange={(e) =>
                    setForm({ ...form, datum: e.target.value })
                  }
                />
              </label>

              <label className="feld">
                <span className="feld-label">Wetter</span>
                <input
                  type="text"
                  placeholder="z. B. sonnig, 18 °C"
                  value={form.wetter}
                  disabled={speichere}
                  onChange={(e) =>
                    setForm({ ...form, wetter: e.target.value })
                  }
                />
              </label>

              <label className="feld feld-wide">
                <span className="feld-label">Kurzbeschreibung</span>
                <textarea
                  value={form.beschreibung}
                  disabled={speichere}
                  placeholder="Was wurde an diesem Tag erledigt?"
                  onChange={(e) =>
                    setForm({ ...form, beschreibung: e.target.value })
                  }
                />
              </label>
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
                {speichere ? 'Speichert…' : 'Bautagesbericht anlegen'}
              </button>
            </div>
          </form>
        )}
      </Sektion>
    </div>
  )
}
