import { useEffect, useState } from 'react'
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
import { ladeFkDaten } from '../lib/fkLoader'
import {
  bereiteFormDatenAuf,
  entityZuForm,
} from '../components/FormField'
import {
  IconArrowLeft,
  IconPencil,
  IconSave,
  IconX,
} from '../components/Icons'
import { LoeschenButton } from '../components/LoeschenButton'

export function DetailPage({ modulKey }) {
  const { id } = useParams()
  const modul = findModul(modulKey)
  const navigate = useNavigate()
  const toast = useToast()

  const [entity, setEntity] = useState(null)
  const [fkLabels, setFkLabels] = useState({})
  const [fkData, setFkData] = useState({})
  const [lade, setLade] = useState(true)
  const [fehler, setFehler] = useState(null)

  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({})
  const [speichere, setSpeichere] = useState(false)

  const [confirmOffen, setConfirmOffen] = useState(false)
  const [loesche, setLoesche] = useState(false)

  useEffect(() => {
    if (!modul) return
    setLade(true)
    setFehler(null)
    setEditMode(false)
    Promise.all([api.get(modul.pfad, id), ladeFkDaten(modul)])
      .then(([e, fk]) => {
        setEntity(e)
        setFkLabels(fk.fkLabels)
        setFkData(fk.fkData)
      })
      .catch((err) => setFehler(err.message))
      .finally(() => setLade(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modulKey, id])

  function startEdit() {
    if (!entity) return
    setForm(entityZuForm(modul, entity))
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
      const aktualisiert = await api.update(modul.pfad, id, payload)
      setEntity(aktualisiert ?? entity)
      setEditMode(false)
      toast.erfolg(`${modul.einzahl} aktualisiert`)
    } catch (err) {
      setFehler(err.message)
    } finally {
      setSpeichere(false)
    }
  }

  async function loeschenBestaetigt() {
    setLoesche(true)
    try {
      await api.remove(modul.pfad, id)
      toast.erfolg(`${modul.einzahl} gelöscht`)
      navigate(`/${modul.key}`)
    } catch (e) {
      setFehler(e.message)
      setLoesche(false)
      setConfirmOffen(false)
    }
  }

  if (!modul) {
    return (
      <div className="content">
        <Alert titel="Modul nicht gefunden">
          „{modulKey}" existiert nicht.
        </Alert>
      </div>
    )
  }

  const titel = entity ? modul.displayName(entity) : `#${id}`

  return (
    <div className="content">
      <Breadcrumb
        items={[
          { label: 'Module', to: '/' },
          { label: modul.label, to: `/${modul.key}` },
          { label: titel },
        ]}
      />

      <div className="page-header">
        <div className="titel-block">
          <h1>{titel}</h1>
          {entity && (
            <div className="subtitel">
              {modul.einzahl} · ID #{entity.id}
              {entity.erstellt_von && ` · Angelegt von ${entity.erstellt_von}`}
              {entity.geaendert_von &&
                ` · Geändert von ${entity.geaendert_von}`}
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
              <Link to={`/${modul.key}`} className="btn btn-secondary">
                <IconArrowLeft />
                Zurück
              </Link>
              {entity && (
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
          <LadeBlock text="Lade Detail…" />
        </Sektion>
      ) : entity ? (
        <form onSubmit={speichern}>
          <EntityFelder
            modul={modul}
            entity={entity}
            fkLabels={fkLabels}
            fkData={fkData}
            editMode={editMode}
            form={form}
            setForm={setForm}
            speichere={speichere}
          />
          {/* Submit über Enter im Edit-Modus */}
          {editMode && (
            <button type="submit" style={{ display: 'none' }} aria-hidden="true" />
          )}
        </form>
      ) : null}

      <ConfirmDialog
        offen={confirmOffen}
        titel={`${modul.einzahl} löschen?`}
        nachricht={`Möchtest du „${titel}" wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.`}
        bestaetigenText={loesche ? 'Lösche…' : 'Endgültig löschen'}
        gefaehrlich
        onConfirm={loeschenBestaetigt}
        onCancel={() => !loesche && setConfirmOffen(false)}
      />
    </div>
  )
}
