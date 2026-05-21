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
import { Stundenzettel } from '../components/Stundenzettel'
import {
  bereiteFormDatenAuf,
  entityZuForm,
} from '../components/FormField'
import {
  IconArrowLeft,
  IconTrash,
  IconPlus,
  IconPencil,
  IconSave,
  IconX,
} from '../components/Icons'

export function PersonalDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const modul = findModul('personal')

  const [person, setPerson] = useState(null)
  const [qualifikationen, setQualifikationen] = useState([])
  const [notfallkontakte, setNotfallkontakte] = useState([])
  const [zeiten, setZeiten] = useState([])
  const [projekte, setProjekte] = useState([])
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
      api.get('personal', id),
      api.list('qualifikationen'),
      api.list('notfallkontakte'),
      api.list('zeiterfassungen'),
      api.list('projekte'),
    ])
      .then(([p, q, n, z, proj]) => {
        const pid = Number(id)
        setPerson(p)
        setQualifikationen(q.filter((x) => x.personal_id === pid))
        setNotfallkontakte(n.filter((x) => x.personal_id === pid))
        setZeiten(z.filter((x) => x.personal_id === pid))
        setProjekte(proj)
      })
      .catch((e) => setFehler(e.message))
      .finally(() => setLade(false))
  }, [id])

  function startEdit() {
    if (!person) return
    setForm(entityZuForm(modul, person))
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
      const aktualisiert = await api.update('personal', id, payload)
      setPerson(aktualisiert ?? person)
      setEditMode(false)
      toast.erfolg('Mitarbeiter aktualisiert')
    } catch (err) {
      setFehler(err.message)
    } finally {
      setSpeichere(false)
    }
  }

  async function loeschenBestaetigt() {
    setLoesche(true)
    try {
      await api.remove('personal', id)
      toast.erfolg('Mitarbeiter gelöscht')
      navigate('/personal')
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

  const titel = person ? modul.displayName(person) : `#${id}`

  return (
    <div className="content">
      <Breadcrumb
        items={[
          { label: 'Module', to: '/' },
          { label: 'Personal', to: '/personal' },
          { label: titel },
        ]}
      />

      <div className="page-header">
        <div className="titel-block">
          <h1>{titel}</h1>
          {person && (
            <div className="subtitel">
              {person.position || 'Mitarbeiter'} · ID #{person.id}
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
              <Link to="/personal" className="btn btn-secondary">
                <IconArrowLeft />
                Zurück zur Liste
              </Link>
              {person && (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={startEdit}
                  >
                    <IconPencil />
                    Bearbeiten
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => setConfirmOffen(true)}
                  >
                    <IconTrash />
                    Löschen
                  </button>
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
          <LadeBlock text="Lade Personalakte…" />
        </Sektion>
      ) : person ? (
        <>
          <form onSubmit={speichern}>
            <EntityFelder
              modul={modul}
              entity={person}
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
                titel="Qualifikationen"
                count={qualifikationen.length}
                aktionen={
                  <Link to="/qualifikationen/neu" className="btn btn-secondary">
                    <IconPlus />
                    Neu
                  </Link>
                }
              >
                <RelatedList
                  modulKey="qualifikationen"
                  eintraege={qualifikationen}
                  renderSubtext={(q) =>
                    q.gueltig_bis
                      ? `gültig bis ${q.gueltig_bis}`
                      : 'unbegrenzt'
                  }
                  leerText="Keine Qualifikationen erfasst"
                />
              </Sektion>

              <Sektion
                titel="Notfallkontakte"
                count={notfallkontakte.length}
                aktionen={
                  <Link to="/notfallkontakte/neu" className="btn btn-secondary">
                    <IconPlus />
                    Neu
                  </Link>
                }
              >
                <RelatedList
                  modulKey="notfallkontakte"
                  eintraege={notfallkontakte}
                  renderSubtext={(n) =>
                    [n.beziehung, n.telefon].filter(Boolean).join(' · ')
                  }
                  leerText="Kein Notfallkontakt hinterlegt"
                />
              </Sektion>

              <Sektion
                titel="Zeiterfassungen"
                count={zeiten.length}
                aktionen={
                  <Link
                    to={`/zeiterfassungen/neu?personal_id=${person.id}`}
                    className="btn btn-secondary"
                  >
                    <IconPlus />
                    Neu
                  </Link>
                }
                tight
              >
                <Stundenzettel
                  zeiten={zeiten}
                  variant="personal"
                  projekteMap={projektMap}
                  leerTitel="Keine Zeiten erfasst"
                  leerText='Über „+ Neu" oben kannst du eine erste Arbeitszeit erfassen.'
                />
              </Sektion>
            </>
          )}
        </>
      ) : null}

      <ConfirmDialog
        offen={confirmOffen}
        titel="Mitarbeiter löschen?"
        nachricht={`Möchtest du „${titel}" wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.`}
        bestaetigenText={loesche ? 'Lösche…' : 'Endgültig löschen'}
        gefaehrlich
        onConfirm={loeschenBestaetigt}
        onCancel={() => !loesche && setConfirmOffen(false)}
      />
    </div>
  )
}
