import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { findModul } from '../modules'
import { useToast } from '../contexts/ToastContext'
import { Breadcrumb } from '../components/Breadcrumb'
import { Alert } from '../components/Alert'
import { Sektion } from '../components/Sektion'
import { LadeBlock, Spinner } from '../components/Spinner'
import { ConfirmDialog } from '../components/Modal'
import { EntityFelder } from '../components/EntityFelder'
import { RelatedList } from '../components/RelatedList'
import {
  bereiteFormDatenAuf,
  entityZuForm,
} from '../components/FormField'
import {
  IconArrowLeft,
  IconPlus,
  IconPencil,
  IconSave,
  IconX,
} from '../components/Icons'
import { LoeschenButton } from '../components/LoeschenButton'

export function KundeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const modul = findModul('kunden')

  const [kunde, setKunde] = useState(null)
  const [ansprechpartner, setAnsprechpartner] = useState([])
  const [projekte, setProjekte] = useState([])
  const [dokumente, setDokumente] = useState([])
  const [lade, setLade] = useState(true)
  const [fehler, setFehler] = useState(null)
  const [confirmOffen, setConfirmOffen] = useState(false)
  const [loesche, setLoesche] = useState(false)

  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({})
  const [speichere, setSpeichere] = useState(false)

  useEffect(() => {
    setLade(true)
    setFehler(null)
    setEditMode(false)
    Promise.all([
      api.get('kunden', id),
      api.list('ansprechpartner'),
      api.list('projekte'),
      api.list('dokumente'),
    ])
      .then(([k, aps, proj, dok]) => {
        const kundeId = Number(id)
        setKunde(k)
        setAnsprechpartner(aps.filter((a) => a.kunden_id === kundeId))
        const kp = proj.filter((p) => p.kunden_id === kundeId)
        setProjekte(kp)
        const kpIds = new Set(kp.map((p) => p.id))
        setDokumente(dok.filter((d) => kpIds.has(d.projekt_id)))
      })
      .catch((e) => setFehler(e.message))
      .finally(() => setLade(false))
  }, [id])

  function startEdit() {
    if (!kunde) return
    setForm(entityZuForm(modul, kunde))
    setFehler(null)
    setEditMode(true)
  }
  function cancelEdit() {
    setEditMode(false)
    setFehler(null)
  }
  async function speichern(e) {
    e.preventDefault()
    setFehler(null)
    setSpeichere(true)
    try {
      const payload = bereiteFormDatenAuf(modul, form)
      const aktualisiert = await api.update('kunden', id, payload)
      setKunde(aktualisiert ?? kunde)
      setEditMode(false)
      toast.erfolg('Kunde aktualisiert')
    } catch (err) {
      setFehler(err.message)
    } finally {
      setSpeichere(false)
    }
  }

  async function loeschenBestaetigt() {
    setLoesche(true)
    try {
      await api.remove('kunden', id)
      toast.erfolg('Kunde gelöscht')
      navigate('/kunden')
    } catch (e) {
      setFehler(e.message)
      setLoesche(false)
      setConfirmOffen(false)
    }
  }

  const projektMap = useMemo(
    () => new Map(projekte.map((p) => [p.id, p])),
    [projekte]
  )

  const titel = kunde ? modul.displayName(kunde) : `#${id}`

  return (
    <div className="content">
      <Breadcrumb
        items={[
          { label: 'Module', to: '/' },
          { label: 'Kunden', to: '/kunden' },
          { label: titel },
        ]}
      />

      <div className="page-header">
        <div className="titel-block">
          <h1>{titel}</h1>
          {kunde && (
            <div className="subtitel">
              Kunde · ID #{kunde.id}
              {editMode && ' · Bearbeiten'}
            </div>
          )}
        </div>
        <div className="aktionen">
          {editMode ? (
            <>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={cancelEdit}
                disabled={speichere}
              >
                <IconX />
                Abbrechen
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={speichern}
                disabled={speichere}
              >
                {speichere ? <Spinner /> : <IconSave />}
                {speichere ? 'Speichert…' : 'Speichern'}
              </button>
            </>
          ) : (
            <>
              <Link to="/kunden" className="btn btn-secondary">
                <IconArrowLeft />
                Zurück zur Liste
              </Link>
              {kunde && (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={startEdit}
                  >
                    <IconPencil />
                    Bearbeiten
                  </button>
                  <LoeschenButton onClick={() => setConfirmOffen(true)} />
                </>
              )}
            </>
          )}
        </div>
      </div>

      {fehler && (
        <Alert titel={editMode ? 'Speichern fehlgeschlagen' : 'Fehler'}>
          {fehler}
        </Alert>
      )}

      {lade ? (
        <Sektion>
          <LadeBlock text="Lade Kunden-Akte…" />
        </Sektion>
      ) : kunde ? (
        <>
          <form onSubmit={speichern}>
            <EntityFelder
              modul={modul}
              entity={kunde}
              fkLabels={{}}
              fkData={{}}
              editMode={editMode}
              form={form}
              setForm={setForm}
              speichere={speichere}
            />
            {editMode && (
              <button type="submit" style={{ display: 'none' }} aria-hidden="true" />
            )}
          </form>

          {!editMode && (
            <>
              <Sektion
                titel="Ansprechpartner"
                count={ansprechpartner.length}
                aktionen={
                  <Link to="/ansprechpartner/neu" className="btn btn-secondary">
                    <IconPlus />
                    Neu
                  </Link>
                }
              >
                <RelatedList
                  modulKey="ansprechpartner"
                  eintraege={ansprechpartner}
                  renderSubtext={(a) =>
                    [a.position, a.telefon, a.email]
                      .filter(Boolean)
                      .join(' · ')
                  }
                  leerText="Keine Ansprechpartner"
                />
              </Sektion>

              <Sektion
                titel="Projekte"
                count={projekte.length}
                aktionen={
                  <Link to="/projekte/neu" className="btn btn-secondary">
                    <IconPlus />
                    Neu
                  </Link>
                }
              >
                <RelatedList
                  modulKey="projekte"
                  eintraege={projekte}
                  renderSubtext={(p) =>
                    [
                      p.status,
                      p.auftragsnummer && `Auftrag ${p.auftragsnummer}`,
                    ]
                      .filter(Boolean)
                      .join(' · ')
                  }
                  leerText="Keine Projekte"
                />
              </Sektion>

              <Sektion
                titel="Dokumente (über Projekte)"
                count={dokumente.length}
              >
                <RelatedList
                  modulKey="dokumente"
                  eintraege={dokumente}
                  renderSubtext={(d) => {
                    const proj = projektMap.get(d.projekt_id)
                    const teile = [
                      d.typ,
                      proj && `Projekt: ${proj.name}`,
                      d.status,
                    ]
                    return teile.filter(Boolean).join(' · ')
                  }}
                  leerText="Keine Dokumente"
                />
              </Sektion>
            </>
          )}
        </>
      ) : null}

      <ConfirmDialog
        offen={confirmOffen}
        titel="Kunde löschen?"
        nachricht={`Möchtest du „${titel}" wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.`}
        bestaetigenText={loesche ? 'Lösche…' : 'Endgültig löschen'}
        gefaehrlich
        onConfirm={loeschenBestaetigt}
        onCancel={() => !loesche && setConfirmOffen(false)}
      />
    </div>
  )
}
