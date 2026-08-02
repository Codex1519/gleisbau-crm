import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { findModul } from '../modules'
import { useToast } from '../contexts/ToastContext'
import { Breadcrumb } from '../components/Breadcrumb'
import { Alert } from '../components/Alert'
import { Sektion } from '../components/Sektion'
import { LadeBlock, Spinner } from '../components/Spinner'
import {
  FormField,
  bereiteFormDatenAuf,
  leererForm,
} from '../components/FormField'
import { fkModuleKeys, ladeFkDaten, fkOptionenFuerFeld } from '../lib/fkLoader'
import { IconArrowLeft, IconPlus } from '../components/Icons'

export function FormPage({ modulKey }) {
  const modul = findModul(modulKey)
  const navigate = useNavigate()
  const toast = useToast()

  const [form, setForm] = useState(() => leererForm(modul ?? { felder: [] }))
  const [fkData, setFkData] = useState({})
  const [ladeFk, setLadeFk] = useState(true)
  const [fkFehler, setFkFehler] = useState(null)
  const [speichere, setSpeichere] = useState(false)
  const [fehler, setFehler] = useState(null)

  useEffect(() => {
    if (!modul) return
    setForm(leererForm(modul))
    setFehler(null)

    if (fkModuleKeys(modul).length === 0) {
      setLadeFk(false)
      setFkData({})
      return
    }

    setLadeFk(true)
    ladeFkDaten(modul)
      .then(({ fkData }) => setFkData(fkData))
      .catch((e) => setFkFehler(e.message))
      .finally(() => setLadeFk(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modulKey])

  if (!modul) {
    return (
      <div className="content">
        <Alert titel="Modul nicht gefunden">„{modulKey}" existiert nicht.</Alert>
      </div>
    )
  }

  async function absenden(e) {
    e.preventDefault()
    setFehler(null)
    setSpeichere(true)
    try {
      const payload = bereiteFormDatenAuf(modul, form)
      const neu = await api.create(modul.pfad, payload)
      toast.erfolg(`${modul.einzahl} erfolgreich angelegt`)
      if (neu?.id) {
        navigate(`/${modul.key}/${neu.id}`)
      } else {
        navigate(`/${modul.key}`)
      }
    } catch (err) {
      setFehler(err.message)
    } finally {
      setSpeichere(false)
    }
  }

  // Hinweis wenn ein Pflicht-FK-Modul leer ist
  const fehlendeFkInfo = modul.felder
    .filter((f) => f.type === 'fk' && f.required)
    .filter((f) => (fkData?.[f.fk.module] ?? []).length === 0)

  return (
    <div className="content">
      <Breadcrumb
        items={[
          { label: 'Module', to: '/' },
          { label: modul.label, to: `/${modul.key}` },
          { label: 'Neu anlegen' },
        ]}
      />

      <div className="page-header">
        <div className="titel-block">
          <h1>Neuen {modul.einzahl} anlegen</h1>
          <div className="subtitel">
            Pflichtfelder sind mit{' '}
            <span style={{ color: 'var(--accent)' }}>*</span> markiert.
          </div>
        </div>
        <div className="aktionen">
          <Link to={`/${modul.key}`} className="btn btn-ghost">
            <IconArrowLeft />
            Zurück
          </Link>
        </div>
      </div>

      {fehler && <Alert titel="Speichern fehlgeschlagen">{fehler}</Alert>}
      {fkFehler && <Alert titel="Verknüpfungen konnten nicht geladen werden">{fkFehler}</Alert>}

      {fehlendeFkInfo.length > 0 && !ladeFk && (
        <Alert typ="info" titel="Hinweis">
          Bevor du einen {modul.einzahl} anlegst:{' '}
          {fehlendeFkInfo.map((f, i) => {
            const zielModul = f.fk.module
            return (
              <span key={f.name}>
                {i > 0 && ' und '}
                lege mindestens einen Eintrag unter{' '}
                <Link to={`/${zielModul}`}>{f.label}</Link> an
              </span>
            )
          })}
          .
        </Alert>
      )}

      <Sektion titel="Angaben">
        {ladeFk ? (
          <LadeBlock text="Lade Optionen…" />
        ) : (
          <form onSubmit={absenden}>
            <div className="felder">
              {modul.felder.map((f) => (
                <FormField
                  key={f.name}
                  feld={f}
                  wert={form[f.name]}
                  onChange={(v) => setForm({ ...form, [f.name]: v })}
                  fkOptionen={
                    f.type === 'fk' ? fkOptionenFuerFeld(f, fkData) : null
                  }
                  disabled={speichere}
                />
              ))}
            </div>

            <div className="form-actions">
              <Link to={`/${modul.key}`} className="btn btn-ghost">
                Abbrechen
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={speichere || fehlendeFkInfo.length > 0}
                title={
                  fehlendeFkInfo.length > 0
                    ? `Zuerst ${fehlendeFkInfo.map((f) => f.label).join(' und ')} anlegen`
                    : undefined
                }
              >
                {speichere ? <Spinner /> : <IconPlus />}
                {speichere ? 'Speichert…' : `${modul.einzahl} anlegen`}
              </button>
            </div>
          </form>
        )}
      </Sektion>
    </div>
  )
}
