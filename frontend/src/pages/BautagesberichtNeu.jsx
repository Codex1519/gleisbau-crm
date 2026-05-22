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
import {
  BautagesberichtFormFelder,
  bautagesberichtPayload,
} from '../components/BautagesberichtFormFelder'
import { heuteISO } from '../lib/zeiterfassung'

const LEER = {
  projekt_id: '',
  ersteller_id: '',
  datum: '',
  wetter: '',
  temperatur: '',
  arbeiten_durchgefuehrt: '',
  personal_anwesend: '',
  maschinen_eingesetzt: '',
  materiallieferungen: '',
  behinderungen: '',
  besondere_vorkommnisse: '',
  baufortschritt: '0',
  bemerkungen: '',
}

export function BautagesberichtNeu() {
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const projekteModul = findModul('projekte')

  const lockedProjekt = searchParams.get('projekt_id') || ''

  const [personal, setPersonal] = useState([])
  const [projekte, setProjekte] = useState([])
  const [lade, setLade] = useState(true)
  const [fehler, setFehler] = useState(null)
  const [speichere, setSpeichere] = useState(false)

  const [form, setForm] = useState({
    ...LEER,
    projekt_id: lockedProjekt,
    datum: heuteISO(),
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

  function set(feld, wert) {
    setForm((f) => ({ ...f, [feld]: wert }))
  }

  async function absenden(e) {
    e.preventDefault()
    setFehler(null)
    setSpeichere(true)
    try {
      const payload = bautagesberichtPayload(form)
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

  if (lade) {
    return (
      <div className="content">
        <Breadcrumb items={breadcrumb} />
        <Sektion>
          <LadeBlock text="Lade Optionen…" />
        </Sektion>
      </div>
    )
  }

  return (
    <div className="content">
      <Breadcrumb items={breadcrumb} />

      <div className="page-header">
        <div className="titel-block">
          <h1>Neuer Bautagesbericht</h1>
          <div className="subtitel">
            {lockedProjektName
              ? `Projekt: ${lockedProjektName}`
              : 'Tageseinsatz auf einem Projekt dokumentieren'}
          </div>
        </div>
        <div className="aktionen">
          <Link to={zurueckLink} className="btn btn-ghost">
            <IconArrowLeft />
            Zurück
          </Link>
        </div>
      </div>

      {fehler && <Alert titel="Speichern fehlgeschlagen">{fehler}</Alert>}

      {(keinPersonal || keineProjekte) && (
        <Alert typ="info" titel="Hinweis">
          Bevor du einen Bautagesbericht anlegst, benötigst du mindestens{' '}
          {keinPersonal && <Link to="/personal/neu">einen Mitarbeiter</Link>}
          {keinPersonal && keineProjekte && ' und '}
          {keineProjekte && <Link to="/projekte/neu">ein Projekt</Link>}
          {'.'}
        </Alert>
      )}

      <form onSubmit={absenden}>
        <BautagesberichtFormFelder
          form={form}
          set={set}
          personal={personal}
          projekte={projekte}
          speichere={speichere}
          lockProjekt={!!lockedProjekt}
        />

        <div className="form-actions" style={{ border: 'none', paddingTop: 0 }}>
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
    </div>
  )
}
