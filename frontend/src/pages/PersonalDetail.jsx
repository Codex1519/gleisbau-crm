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
import { ZeiterfassungEditModal } from '../components/ZeiterfassungEditModal'
import {
  bereiteFormDatenAuf,
  entityZuForm,
} from '../components/FormField'
import {
  berechneGesamtMinuten,
  formatStunden,
  formatDatum,
  formatZeit,
  heuteISO,
  exportiereCsv,
} from '../lib/zeiterfassung'
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

  // Inline-Edit einer einzelnen Zeiterfassung (Modal)
  const [editZeit, setEditZeit] = useState(null)
  const [alleProjekte, setAlleProjekte] = useState([])

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
        setAlleProjekte(proj)
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

  const zeitenGesamtMinuten = useMemo(
    () => berechneGesamtMinuten(zeiten),
    [zeiten]
  )

  function handleZeitGespeichert(aktualisiert) {
    setZeiten((alle) =>
      alle.map((z) =>
        z.id === aktualisiert.id ? { ...z, ...aktualisiert } : z
      )
    )
    setEditZeit(null)
    toast.erfolg('Zeiterfassung aktualisiert')
  }

  function exportZeitenCsv() {
    const header = [
      'Datum',
      'Mitarbeiter',
      'Projekt',
      'Start',
      'Ende',
      'Pause (Min)',
      'Gesamtstunden',
    ]
    const name = person ? modul.displayName(person) : `#${id}`
    const rows = [...zeiten]
      .sort((a, b) =>
        String(a.start_zeit || '').localeCompare(String(b.start_zeit || ''))
      )
      .map((z) => {
        const pr = projektMap.get(z.projekt_id)
        return [
          formatDatum(z.start_zeit),
          name,
          pr ? findModul('projekte').displayName(pr) : `#${z.projekt_id}`,
          formatZeit(z.start_zeit),
          formatZeit(z.end_zeit),
          Number(z.pause_minuten || 0),
          formatStunden(berechneGesamtMinuten([z])),
        ]
      })
    const dateiname = `zeiterfassungen_${name
      .replace(/\s+/g, '_')
      .toLowerCase()}_${heuteISO()}.csv`
    exportiereCsv(dateiname, [header, ...rows])
  }

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
                  <>
                    {zeiten.length > 0 && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={exportZeitenCsv}
                        title="Zeiten dieses Mitarbeiters als CSV"
                      >
                        Export CSV
                      </button>
                    )}
                    <Link
                      to={`/zeiterfassungen/neu?personal_id=${person.id}`}
                      className="btn btn-secondary"
                    >
                      <IconPlus />
                      Neu
                    </Link>
                  </>
                }
                tight
              >
                {zeiten.length > 0 && (
                  <div className="ze-summary">
                    <div className="ze-summary-label">Gesamtstunden</div>
                    <div className="ze-summary-wert">
                      {formatStunden(zeitenGesamtMinuten)} h
                    </div>
                    <div className="ze-summary-sub">
                      aus {zeiten.length} Eintrag
                      {zeiten.length === 1 ? '' : 'en'}
                    </div>
                  </div>
                )}
                <Stundenzettel
                  zeiten={zeiten}
                  variant="personal"
                  projekteMap={projektMap}
                  markiereUeberstunden
                  onEdit={(z) => setEditZeit(z)}
                  leerTitel="Keine Zeiten erfasst"
                  leerText='Über „+ Neu" oben kannst du eine erste Arbeitszeit erfassen.'
                />
                <style>{`
                  .ze-summary {
                    display: flex;
                    align-items: baseline;
                    gap: 10px;
                    padding: 14px 18px;
                    border-bottom: 1px solid var(--border);
                    background: var(--accent-soft);
                  }
                  .ze-summary-label {
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    font-weight: 600;
                    color: var(--accent-text);
                  }
                  .ze-summary-wert {
                    font-size: 22px;
                    font-weight: 600;
                    color: var(--accent);
                    font-variant-numeric: tabular-nums;
                    letter-spacing: -0.02em;
                  }
                  .ze-summary-sub {
                    font-size: 12.5px;
                    color: var(--accent-text);
                  }
                `}</style>
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

      <ZeiterfassungEditModal
        eintrag={editZeit}
        personal={person ? [person] : []}
        projekte={alleProjekte}
        onClose={() => setEditZeit(null)}
        onGespeichert={handleZeitGespeichert}
      />
    </div>
  )
}
