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
import {
  wetterIcon,
  fortschrittFarbe,
  erstellerId,
  hatInhalt,
} from '../lib/bautagesbericht'

export function ProjektDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const modul = findModul('projekte')
  const personalModul = findModul('personal')

  const [projekt, setProjekt] = useState(null)
  const [kunden, setKunden] = useState([])
  const [berichte, setBerichte] = useState([])
  const [dokumente, setDokumente] = useState([])
  const [personal, setPersonal] = useState([])
  const [zeiten, setZeiten] = useState([])
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
      api.get('projekte', id),
      api.list('kunden'),
      api.list('bautagesberichte'),
      api.list('dokumente'),
      api.list('personal'),
      api.list('zeiterfassungen'),
    ])
      .then(([p, k, b, d, pers, z]) => {
        const pid = Number(id)
        setProjekt(p)
        setKunden(k)
        setBerichte(b.filter((x) => x.projekt_id === pid))
        setDokumente(d.filter((x) => x.projekt_id === pid))
        setPersonal(pers)
        setZeiten(z.filter((x) => x.projekt_id === pid))
      })
      .catch((e) => setFehler(e.message))
      .finally(() => setLade(false))
  }, [id])

  function startEdit() {
    if (!projekt) return
    setForm(entityZuForm(modul, projekt))
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
      const aktualisiert = await api.update('projekte', id, payload)
      setProjekt(aktualisiert ?? projekt)
      setEditMode(false)
      toast.erfolg('Projekt aktualisiert')
    } catch (err) {
      setFehler(err.message)
    } finally {
      setSpeichere(false)
    }
  }

  async function loeschenBestaetigt() {
    setLoesche(true)
    try {
      await api.remove('projekte', id)
      toast.erfolg('Projekt gelöscht')
      navigate('/projekte')
    } catch (e) {
      setFehler(e.message)
      setLoesche(false)
      setConfirmOffen(false)
    }
  }

  const personalMap = useMemo(
    () => new Map(personal.map((p) => [p.id, p])),
    [personal]
  )

  // FK-Daten und Labels für die Kunde-Verknüpfung (im Edit-Modus + Anzeige)
  const fkData = useMemo(() => ({ kunden }), [kunden])
  const fkLabels = useMemo(() => {
    const map = new Map(
      kunden.map((k) => [k.id, k.name || `Kunde #${k.id}`])
    )
    return { kunden: map }
  }, [kunden])

  const titel = projekt ? modul.displayName(projekt) : `#${id}`

  // Bautagesberichte – neueste zuerst (für den Zeitstrahl)
  const sortierteBerichte = useMemo(
    () =>
      [...berichte].sort((a, b) =>
        String(b.datum || '').localeCompare(String(a.datum || ''))
      ),
    [berichte]
  )

  // Baufortschritt laut dem neuesten Bericht
  const aktuellerFortschritt = useMemo(() => {
    const neuester = sortierteBerichte[0]
    if (!neuester || neuester.baufortschritt == null) return null
    return Number(neuester.baufortschritt) || 0
  }, [sortierteBerichte])

  // Beteiligte Personen aus Bautagesberichten ableiten (unique, via Ersteller)
  const beteiligtePersonen = useMemo(() => {
    if (berichte.length === 0) return []
    const ids = new Set(berichte.map((b) => erstellerId(b)).filter(Boolean))
    return [...ids].map((pid) => personalMap.get(pid)).filter(Boolean)
  }, [berichte, personalMap])

  return (
    <div className="content">
      <Breadcrumb
        items={[
          { label: 'Module', to: '/' },
          { label: 'Projekte', to: '/projekte' },
          { label: titel },
        ]}
      />

      <div className="page-header">
        <div className="titel-block">
          <h1>{titel}</h1>
          {projekt && (
            <div className="subtitel">
              {projekt.status || 'Projekt'} · ID #{projekt.id}
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
              <Link to="/projekte" className="btn btn-secondary">
                <IconArrowLeft />
                Zurück zur Liste
              </Link>
              {projekt && (
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
          <LadeBlock text="Lade Projektakte…" />
        </Sektion>
      ) : projekt ? (
        <>
          <form onSubmit={speichern}>
            <EntityFelder
              modul={modul}
              entity={projekt}
              fkLabels={fkLabels}
              fkData={fkData}
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
                titel="Bautagesberichte"
                count={berichte.length}
                aktionen={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {aktuellerFortschritt != null && (
                      <span
                        className={`status-badge farbe-${fortschrittFarbe(
                          aktuellerFortschritt
                        )}`}
                        title="Baufortschritt laut neuestem Bericht"
                      >
                        {aktuellerFortschritt}% Fortschritt
                      </span>
                    )}
                    <Link
                      to={`/bautagesberichte/neu?projekt_id=${projekt.id}`}
                      className="btn btn-secondary"
                    >
                      <IconPlus />
                      Neu
                    </Link>
                  </div>
                }
              >
                {berichte.length === 0 ? (
                  <div className="empty-state" style={{ padding: '24px 12px' }}>
                    <div className="empty-state-title">Keine Berichte</div>
                    <div className="empty-state-text">
                      Über „+ Neu" oben kann der erste Bautagesbericht
                      erfasst werden.
                    </div>
                  </div>
                ) : (
                  <ul className="timeline">
                    {sortierteBerichte.map((b) => {
                      const ersteller = personalMap.get(erstellerId(b))
                      const pct = Number(b.baufortschritt) || 0
                      const vorschau =
                        b.arbeiten_durchgefuehrt || b.bemerkungen || ''
                      return (
                        <li className="timeline-item" key={b.id}>
                          <Link
                            to={`/bautagesberichte/${b.id}`}
                            className="timeline-link"
                          >
                            <div className="timeline-kopf">
                              <span className="timeline-datum">
                                {hatInhalt(b.wetter) && (
                                  <span style={{ marginRight: 6 }}>
                                    {wetterIcon(b.wetter)}
                                  </span>
                                )}
                                {b.datum || `#${b.id}`}
                              </span>
                              <span
                                className={`status-badge farbe-${fortschrittFarbe(
                                  pct
                                )}`}
                              >
                                {pct}%
                              </span>
                            </div>
                            {ersteller && (
                              <div
                                style={{
                                  fontSize: 12,
                                  color: 'var(--text-muted)',
                                  marginTop: 2,
                                }}
                              >
                                {personalModul.displayName(ersteller)}
                              </div>
                            )}
                            {vorschau && (
                              <div className="timeline-text">{vorschau}</div>
                            )}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </Sektion>

              <Sektion titel="Dokumente" count={dokumente.length}>
                <RelatedList
                  modulKey="dokumente"
                  eintraege={dokumente}
                  renderSubtext={(d) =>
                    [
                      d.typ,
                      d.status,
                      d.faelligkeitsdatum &&
                        `fällig ${d.faelligkeitsdatum}`,
                    ]
                      .filter(Boolean)
                      .join(' · ')
                  }
                  leerText="Keine Dokumente"
                />
              </Sektion>

              <Sektion
                titel="Beteiligtes Personal"
                count={beteiligtePersonen.length}
              >
                {beteiligtePersonen.length === 0 ? (
                  <div className="empty-state" style={{ padding: '24px 12px' }}>
                    <div className="empty-state-title">
                      Noch nicht zugeordnet
                    </div>
                    <div className="empty-state-text">
                      Personal wird über Bautagesberichte automatisch erfasst.
                    </div>
                  </div>
                ) : (
                  <RelatedList
                    modulKey="personal"
                    eintraege={beteiligtePersonen}
                    renderSubtext={(p) => p.position || ''}
                  />
                )}
              </Sektion>

              <Sektion
                titel="Gebuchte Stunden"
                count={zeiten.length}
                aktionen={
                  <Link
                    to={`/zeiterfassungen/neu?projekt_id=${projekt.id}`}
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
                  variant="projekt"
                  personalMap={personalMap}
                  leerTitel="Keine Stunden gebucht"
                  leerText='Über „+ Neu" oben kann die erste Arbeitszeit auf dieses Projekt erfasst werden.'
                />
              </Sektion>
            </>
          )}
        </>
      ) : null}

      <ConfirmDialog
        offen={confirmOffen}
        titel="Projekt löschen?"
        nachricht={`Möchtest du „${titel}" wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.`}
        bestaetigenText={loesche ? 'Lösche…' : 'Endgültig löschen'}
        gefaehrlich
        onConfirm={loeschenBestaetigt}
        onCancel={() => !loesche && setConfirmOffen(false)}
      />
    </div>
  )
}
