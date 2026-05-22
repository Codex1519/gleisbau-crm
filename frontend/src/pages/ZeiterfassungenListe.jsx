import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { findModul } from '../modules'
import { useToast } from '../contexts/ToastContext'
import { Breadcrumb } from '../components/Breadcrumb'
import { Alert } from '../components/Alert'
import { EmptyState } from '../components/EmptyState'
import { LadeBlock } from '../components/Spinner'
import { Sektion } from '../components/Sektion'
import { Stundenzettel } from '../components/Stundenzettel'
import { MitarbeiterZusammenfassung } from '../components/MitarbeiterZusammenfassung'
import { WochenUebersicht } from '../components/WochenUebersicht'
import { ZeiterfassungEditModal } from '../components/ZeiterfassungEditModal'
import { CsvImportModal } from '../components/CsvImportModal'
import { IconPlus, IconRefresh, IconUpload } from '../components/Icons'
import {
  berechneGesamtMinuten,
  eintragDatum,
  ersterDesMonats,
  formatStunden,
  formatDatum,
  formatZeit,
  heuteISO,
  montagDerWoche,
  toISODate,
  exportiereCsv,
} from '../lib/zeiterfassung'

const VIEW_TABELLE = 'tabelle'
const VIEW_WOCHE = 'woche'

function standardVon() {
  return toISODate(montagDerWoche(new Date()))
}

export function ZeiterfassungenListe() {
  const personalModul = findModul('personal')
  const projekteModul = findModul('projekte')
  const toast = useToast()

  const [zeiten, setZeiten] = useState([])
  const [personal, setPersonal] = useState([])
  const [projekte, setProjekte] = useState([])
  const [lade, setLade] = useState(true)
  const [fehler, setFehler] = useState(null)

  const [view, setView] = useState(VIEW_TABELLE)
  const [filterPersonal, setFilterPersonal] = useState('')
  const [filterProjekt, setFilterProjekt] = useState('')
  // Standard: aktuelle Woche (Montag bis heute)
  const [von, setVon] = useState(standardVon)
  const [bis, setBis] = useState(heuteISO)

  const [editEintrag, setEditEintrag] = useState(null)
  const [importOffen, setImportOffen] = useState(false)

  useEffect(() => {
    laden()
  }, [])

  async function laden() {
    setLade(true)
    setFehler(null)
    try {
      const [z, p, pr] = await Promise.all([
        api.list('zeiterfassungen'),
        api.list('personal'),
        api.list('projekte'),
      ])
      setZeiten(z)
      setPersonal(p)
      setProjekte(pr)
    } catch (e) {
      setFehler(e.message)
    } finally {
      setLade(false)
    }
  }

  const personalMap = useMemo(
    () => new Map(personal.map((p) => [p.id, p])),
    [personal]
  )
  const projekteMap = useMemo(
    () => new Map(projekte.map((p) => [p.id, p])),
    [projekte]
  )

  const personalIds = useMemo(
    () => new Set(personal.map((p) => p.id)),
    [personal]
  )
  const projektIds = useMemo(
    () => new Set(projekte.map((p) => p.id)),
    [projekte]
  )

  // Schnellauswahl-Buttons
  function setzeDieseWoche() {
    setVon(toISODate(montagDerWoche(new Date())))
    setBis(heuteISO())
  }
  function setzeDieserMonat() {
    setVon(toISODate(ersterDesMonats(new Date())))
    setBis(heuteISO())
  }
  function setzeAlles() {
    setVon('')
    setBis('')
  }

  // Alle Filter clientseitig kombinieren
  const gefiltert = useMemo(() => {
    return zeiten.filter((z) => {
      if (filterPersonal && z.personal_id !== Number(filterPersonal))
        return false
      if (filterProjekt && z.projekt_id !== Number(filterProjekt))
        return false
      const d = eintragDatum(z)
      if (von && (!d || d < von)) return false
      if (bis && (!d || d > bis)) return false
      return true
    })
  }, [zeiten, filterPersonal, filterProjekt, von, bis])

  const gesamtMinuten = useMemo(
    () => berechneGesamtMinuten(gefiltert),
    [gefiltert]
  )

  // Wochenanker: bevorzugt das Von-Datum, sonst heute
  const wochenAnker = von || heuteISO()

  function exportCsv() {
    const header = [
      'Datum',
      'Mitarbeiter',
      'Projekt',
      'Start',
      'Ende',
      'Pause (Min)',
      'Gesamtstunden',
    ]
    const rows = [...gefiltert]
      .sort((a, b) =>
        String(a.start_zeit || '').localeCompare(String(b.start_zeit || ''))
      )
      .map((z) => {
        const p = personalMap.get(z.personal_id)
        const pr = projekteMap.get(z.projekt_id)
        const min = berechneGesamtMinutenEinzeln(z)
        return [
          formatDatum(z.start_zeit),
          p ? personalModul.displayName(p) : `#${z.personal_id}`,
          pr ? projekteModul.displayName(pr) : `#${z.projekt_id}`,
          formatZeit(z.start_zeit),
          formatZeit(z.end_zeit),
          Number(z.pause_minuten || 0),
          min,
        ]
      })
    exportiereCsv(`zeiterfassungen_${heuteISO()}.csv`, [header, ...rows])
  }

  function handleGespeichert(aktualisiert) {
    setZeiten((alle) =>
      alle.map((z) => (z.id === aktualisiert.id ? { ...z, ...aktualisiert } : z))
    )
    setEditEintrag(null)
    toast.erfolg('Zeiterfassung aktualisiert')
  }

  return (
    <div className="content">
      <Breadcrumb
        items={[{ label: 'Module', to: '/' }, { label: 'Zeiterfassungen' }]}
      />

      <div className="page-header">
        <div className="titel-block">
          <h1>
            Zeiterfassungen <span className="badge">{zeiten.length}</span>
          </h1>
          <div className="subtitel">
            Stundenzettel aller Mitarbeiter und Projekte
          </div>
        </div>
      </div>

      <div className="aktions-toolbar">
        <div className="at-gruppe">
          <ViewToggle view={view} onChange={setView} />
        </div>
        <div className="at-gruppe at-sekundaer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setImportOffen(true)}
            title="Zeiterfassungen aus CSV importieren"
          >
            <IconUpload />
            Import CSV
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={exportCsv}
            disabled={gefiltert.length === 0}
            title="Gefilterte Ansicht als CSV exportieren"
          >
            <IconDownload />
            Export CSV
          </button>
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
        </div>
        <div className="at-gruppe at-primaer">
          <Link to="/zeiterfassungen/neu" className="btn btn-primary">
            <IconPlus />
            Neue Zeiterfassung
          </Link>
        </div>
      </div>

      {fehler && <Alert titel="Fehler beim Laden">{fehler}</Alert>}

      {zeiten.length > 0 && (
        <Sektion titel="Filter">
          <div className="ze-filter">
            <label className="feld">
              <span className="feld-label">Von</span>
              <input
                type="date"
                value={von}
                max={bis || undefined}
                onChange={(e) => setVon(e.target.value)}
              />
            </label>
            <label className="feld">
              <span className="feld-label">Bis</span>
              <input
                type="date"
                value={bis}
                min={von || undefined}
                onChange={(e) => setBis(e.target.value)}
              />
            </label>
            <label className="feld">
              <span className="feld-label">Mitarbeiter</span>
              <select
                value={filterPersonal}
                onChange={(e) => setFilterPersonal(e.target.value)}
                disabled={personal.length === 0}
              >
                <option value="">Alle Mitarbeiter</option>
                {personal.map((p) => (
                  <option key={p.id} value={p.id}>
                    {personalModul.displayName(p)}
                  </option>
                ))}
              </select>
            </label>
            <label className="feld">
              <span className="feld-label">Projekt</span>
              <select
                value={filterProjekt}
                onChange={(e) => setFilterProjekt(e.target.value)}
                disabled={projekte.length === 0}
              >
                <option value="">Alle Projekte</option>
                {projekte.map((p) => (
                  <option key={p.id} value={p.id}>
                    {projekteModul.displayName(p)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="ze-filter-leiste">
            <div className="ze-schnellwahl">
              <button
                type="button"
                className="btn btn-ghost btn-chip"
                onClick={setzeDieseWoche}
              >
                Diese Woche
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-chip"
                onClick={setzeDieserMonat}
              >
                Dieser Monat
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-chip"
                onClick={setzeAlles}
              >
                Alles
              </button>
            </div>
            <span className="filter-hinweis">
              {gefiltert.length} von {zeiten.length} Einträgen ·{' '}
              {formatStunden(gesamtMinuten)} h gesamt
            </span>
          </div>

          <style>{`
            .ze-filter {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 14px;
            }
            @media (max-width: 860px) {
              .ze-filter { grid-template-columns: 1fr 1fr; }
            }
            @media (max-width: 480px) {
              .ze-filter { grid-template-columns: 1fr; }
            }
            .ze-filter-leiste {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              margin-top: 14px;
              padding-top: 14px;
              border-top: 1px solid var(--border);
              flex-wrap: wrap;
            }
            .ze-schnellwahl { display: flex; gap: 6px; flex-wrap: wrap; }
            .btn-chip {
              padding: 5px 12px;
              border: 1px solid var(--border-strong);
              font-size: 12.5px;
            }
            .filter-hinweis { font-size: 12.5px; color: var(--text-muted); }
          `}</style>
        </Sektion>
      )}

      {lade ? (
        <Sektion tight>
          <LadeBlock text="Lade Zeiterfassungen…" />
        </Sektion>
      ) : zeiten.length === 0 ? (
        <Sektion tight>
          <EmptyState
            titel="Noch keine Zeiterfassungen"
            text="Erfasse die erste Arbeitszeit eines Mitarbeiters auf einem Projekt."
            aktionen={
              <Link to="/zeiterfassungen/neu" className="btn btn-primary">
                <IconPlus />
                Neue Zeiterfassung
              </Link>
            }
          />
        </Sektion>
      ) : view === VIEW_WOCHE ? (
        <Sektion titel="Wochenübersicht" tight>
          <div style={{ padding: 18 }}>
            <WochenUebersicht
              zeiten={gefiltert}
              personalMap={personalMap}
              wochenAnker={wochenAnker}
            />
          </div>
        </Sektion>
      ) : gefiltert.length === 0 ? (
        <Sektion tight>
          <EmptyState
            titel="Keine Treffer"
            text="Mit den gewählten Filtern sind keine Einträge sichtbar."
          />
        </Sektion>
      ) : (
        <>
          <Sektion
            titel="Stundenzettel"
            count={gefiltert.length}
            tight
          >
            <Stundenzettel
              zeiten={gefiltert}
              variant="voll"
              personalMap={personalMap}
              projekteMap={projekteMap}
              markiereUeberstunden
              onEdit={(z) => setEditEintrag(z)}
            />
          </Sektion>

          <Sektion titel="Zusammenfassung pro Mitarbeiter" tight>
            <MitarbeiterZusammenfassung
              zeiten={gefiltert}
              personalMap={personalMap}
            />
          </Sektion>
        </>
      )}

      <ZeiterfassungEditModal
        eintrag={editEintrag}
        personal={personal}
        projekte={projekte}
        onClose={() => setEditEintrag(null)}
        onGespeichert={handleGespeichert}
      />

      <CsvImportModal
        offen={importOffen}
        onClose={() => setImportOffen(false)}
        personalIds={personalIds}
        projektIds={projektIds}
        onFertig={laden}
      />
    </div>
  )
}

// Gesamtstunden eines einzelnen Eintrags als Zahl-String fürs CSV
function berechneGesamtMinutenEinzeln(z) {
  const min = berechneGesamtMinuten([z])
  return formatStunden(min)
}

function ViewToggle({ view, onChange }) {
  return (
    <div className="view-toggle" role="group" aria-label="Ansicht wechseln">
      <button
        type="button"
        className={`view-toggle-btn${view === VIEW_TABELLE ? ' aktiv' : ''}`}
        onClick={() => onChange(VIEW_TABELLE)}
        aria-pressed={view === VIEW_TABELLE}
      >
        Tabelle
      </button>
      <button
        type="button"
        className={`view-toggle-btn${view === VIEW_WOCHE ? ' aktiv' : ''}`}
        onClick={() => onChange(VIEW_WOCHE)}
        aria-pressed={view === VIEW_WOCHE}
      >
        Wochenübersicht
      </button>
    </div>
  )
}

function IconDownload(props) {
  return (
    <svg
      className="icon"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5M4 15h12"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
