import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { findModul } from '../modules'
import { useToast } from '../contexts/ToastContext'
import { Breadcrumb } from '../components/Breadcrumb'
import { Alert } from '../components/Alert'
import { EmptyState } from '../components/EmptyState'
import { LadeBlock } from '../components/Spinner'
import { Sektion } from '../components/Sektion'
import { StatusBadge } from '../components/StatusBadge'
import { KanbanBoard } from '../components/KanbanBoard'
import { IconPlus, IconSearch, IconRefresh } from '../components/Icons'

const VIEW_LISTE = 'liste'
const VIEW_KANBAN = 'kanban'

export function ProjekteListe() {
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const modul = findModul('projekte')
  const statusFeld = modul.felder.find((f) => f.name === 'status')

  const initialeView =
    searchParams.get('view') === VIEW_KANBAN ? VIEW_KANBAN : VIEW_LISTE
  const [view, setView] = useState(initialeView)

  const [projekte, setProjekte] = useState([])
  const [kunden, setKunden] = useState([])
  const [lade, setLade] = useState(true)
  const [fehler, setFehler] = useState(null)
  const [suche, setSuche] = useState('')

  useEffect(() => {
    laden()
  }, [])

  async function laden() {
    setLade(true)
    setFehler(null)
    try {
      const [p, k] = await Promise.all([
        api.list('projekte'),
        api.list('kunden'),
      ])
      setProjekte(p)
      setKunden(k)
    } catch (e) {
      setFehler(e.message)
    } finally {
      setLade(false)
    }
  }

  function wechselView(neu) {
    setView(neu)
    setSearchParams(
      neu === VIEW_KANBAN ? { view: VIEW_KANBAN } : {},
      { replace: true }
    )
  }

  const kundenMap = useMemo(
    () => new Map(kunden.map((k) => [k.id, k])),
    [kunden]
  )

  // Volltext-Suche nur in der Listenansicht
  const gefiltert = useMemo(() => {
    const q = suche.trim().toLowerCase()
    if (!q) return projekte
    return projekte.filter((p) => {
      const fields = [
        p.name,
        p.auftragsnummer,
        p.status,
        p.beschreibung,
        kundenMap.get(p.kunden_id)?.name,
      ]
      return fields.some(
        (v) => v && String(v).toLowerCase().includes(q)
      )
    })
  }, [projekte, suche, kundenMap])

  // Optimistisches Status-Update via Drag & Drop
  async function handleStatusChange(projekt, neuerStatus) {
    const alterStatus = projekt.status
    // optimistisch in der UI ändern
    setProjekte((alle) =>
      alle.map((p) =>
        p.id === projekt.id ? { ...p, status: neuerStatus } : p
      )
    )
    try {
      await api.update('projekte', projekt.id, { status: neuerStatus })
      toast.erfolg(`„${projekt.name}" → ${neuerStatus}`)
    } catch (e) {
      // Rollback bei Fehler
      setProjekte((alle) =>
        alle.map((p) =>
          p.id === projekt.id ? { ...p, status: alterStatus } : p
        )
      )
      toast.fehler(`Status konnte nicht geändert werden: ${e.message}`)
    }
  }

  return (
    <div className="content">
      <Breadcrumb
        items={[{ label: 'Module', to: '/' }, { label: 'Projekte' }]}
      />

      <div className="page-header">
        <div className="titel-block">
          <h1>
            Projekte <span className="badge">{projekte.length}</span>
          </h1>
          <div className="subtitel">
            Aufträge, Budget und Status — alles auf einen Blick
          </div>
        </div>
        <div className="aktionen">
          <ViewToggle view={view} onChange={wechselView} />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={laden}
            disabled={lade}
            title="Liste neu laden"
          >
            <IconRefresh />
            Aktualisieren
          </button>
          <Link to="/projekte/neu" className="btn btn-primary">
            <IconPlus />
            Neues Projekt anlegen
          </Link>
        </div>
      </div>

      {fehler && <Alert titel="Fehler beim Laden">{fehler}</Alert>}

      {/* Suchfeld nur in der Listenansicht */}
      {view === VIEW_LISTE && projekte.length > 0 && (
        <div className="toolbar">
          <div className="search">
            <IconSearch className="icon search-icon" />
            <input
              type="text"
              placeholder="Projekte durchsuchen…"
              value={suche}
              onChange={(e) => setSuche(e.target.value)}
            />
          </div>
          {suche && (
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
              {gefiltert.length} von {projekte.length} Einträgen
            </span>
          )}
        </div>
      )}

      {lade ? (
        <Sektion>
          <LadeBlock text="Lade Projekte…" />
        </Sektion>
      ) : projekte.length === 0 ? (
        <Sektion tight>
          <EmptyState
            titel="Noch keine Projekte"
            text="Lege das erste Projekt an, um zu starten."
            aktionen={
              <Link to="/projekte/neu" className="btn btn-primary">
                <IconPlus />
                Neues Projekt anlegen
              </Link>
            }
          />
        </Sektion>
      ) : view === VIEW_KANBAN ? (
        <KanbanBoard
          projekte={projekte}
          kundenMap={kundenMap}
          onStatusChange={handleStatusChange}
        />
      ) : gefiltert.length === 0 ? (
        <Sektion tight>
          <EmptyState
            titel="Keine Treffer"
            text={`Die Suche nach „${suche}" liefert keine Ergebnisse.`}
          />
        </Sektion>
      ) : (
        <Sektion tight>
          <div className="tabelle-wrap">
            <table>
              <thead>
                <tr>
                  <th className="col-id">ID</th>
                  <th>Name</th>
                  <th>Kunde</th>
                  <th>Status</th>
                  <th>Start</th>
                </tr>
              </thead>
              <tbody>
                {gefiltert.map((p) => {
                  const kunde = kundenMap.get(p.kunden_id)
                  return (
                    <tr
                      key={p.id}
                      className="zeile-klickbar"
                      onClick={() => navigate(`/projekte/${p.id}`)}
                    >
                      <td className="col-id">#{p.id}</td>
                      <td className="primary-cell">
                        {p.name || '—'}
                      </td>
                      <td className="muted-cell">
                        {kunde?.name || `#${p.kunden_id || '—'}`}
                      </td>
                      <td>
                        <StatusBadge
                          optionen={statusFeld.optionen}
                          value={p.status}
                        />
                      </td>
                      <td className="muted-cell">
                        {p.start_datum || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Sektion>
      )}
    </div>
  )
}

function ViewToggle({ view, onChange }) {
  return (
    <div
      className="view-toggle"
      role="group"
      aria-label="Ansicht wechseln"
    >
      <button
        type="button"
        className={`view-toggle-btn${view === VIEW_LISTE ? ' aktiv' : ''}`}
        onClick={() => onChange(VIEW_LISTE)}
        aria-pressed={view === VIEW_LISTE}
        title="Listenansicht"
      >
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" aria-hidden="true">
          <path d="M4 6h12M4 10h12M4 14h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        Liste
      </button>
      <button
        type="button"
        className={`view-toggle-btn${view === VIEW_KANBAN ? ' aktiv' : ''}`}
        onClick={() => onChange(VIEW_KANBAN)}
        aria-pressed={view === VIEW_KANBAN}
        title="Kanban-Board"
      >
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" aria-hidden="true">
          <path d="M4 4h4v12H4zM8.5 4h4v8h-4zM13 4h4v6h-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
        Kanban
      </button>
    </div>
  )
}
