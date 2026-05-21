import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { MODULE, findModul } from '../modules'
import { Breadcrumb } from '../components/Breadcrumb'
import { Alert } from '../components/Alert'
import { ModulIcon, IconChevronRight } from '../components/Icons'
import {
  berechneGesamtMinuten,
  formatStunden,
} from '../lib/zeiterfassung'

const STATUS_ABGESCHLOSSEN = 'Abgeschlossen'

// Liefert Montag 00:00 der aktuellen Woche (ISO-Wochenanfang).
function montagDieserWoche() {
  const heute = new Date()
  const tag = heute.getDay() // 0=So, 1=Mo … 6=Sa
  const offset = tag === 0 ? 6 : tag - 1
  const mo = new Date(heute)
  mo.setHours(0, 0, 0, 0)
  mo.setDate(heute.getDate() - offset)
  return mo
}

export function Dashboard() {
  const [daten, setDaten] = useState(null)
  const [lade, setLade] = useState(true)
  const [fehler, setFehler] = useState(null)

  useEffect(() => {
    setLade(true)
    setFehler(null)
    Promise.all([
      api.list('kunden'),
      api.list('personal'),
      api.list('projekte'),
      api.list('zeiterfassungen'),
      api.list('ansprechpartner'),
      api.list('maschinen'),
      api.list('bautagesberichte'),
      api.list('qualifikationen'),
      api.list('notfallkontakte'),
      api.list('dokumente'),
    ])
      .then(
        ([
          kunden,
          personal,
          projekte,
          zeiten,
          ansprechpartner,
          maschinen,
          bautagesberichte,
          qualifikationen,
          notfallkontakte,
          dokumente,
        ]) => {
          setDaten({
            kunden,
            personal,
            projekte,
            zeiten,
            counts: {
              kunden: kunden.length,
              personal: personal.length,
              projekte: projekte.length,
              zeiterfassungen: zeiten.length,
              ansprechpartner: ansprechpartner.length,
              maschinen: maschinen.length,
              bautagesberichte: bautagesberichte.length,
              qualifikationen: qualifikationen.length,
              notfallkontakte: notfallkontakte.length,
              dokumente: dokumente.length,
            },
          })
        }
      )
      .catch((e) => setFehler(e.message))
      .finally(() => setLade(false))
  }, [])

  const aktiveProjekte = useMemo(() => {
    if (!daten) return 0
    return daten.projekte.filter(
      (p) => (p.status || '').trim() !== STATUS_ABGESCHLOSSEN
    ).length
  }, [daten])

  const stundenDieseWoche = useMemo(() => {
    if (!daten) return 0
    const mo = montagDieserWoche().getTime()
    const dieseWoche = daten.zeiten.filter((z) => {
      if (!z.start_zeit) return false
      const t = new Date(z.start_zeit).getTime()
      return Number.isFinite(t) && t >= mo
    })
    return berechneGesamtMinuten(dieseWoche)
  }, [daten])

  const letzteProjekte = useMemo(() => {
    if (!daten) return []
    return [...daten.projekte].sort((a, b) => b.id - a.id).slice(0, 5)
  }, [daten])

  const letzteZeiten = useMemo(() => {
    if (!daten) return []
    return [...daten.zeiten].sort((a, b) => b.id - a.id).slice(0, 5)
  }, [daten])

  const personalMap = useMemo(() => {
    if (!daten) return new Map()
    return new Map(daten.personal.map((p) => [p.id, p]))
  }, [daten])

  const projekteMap = useMemo(() => {
    if (!daten) return new Map()
    return new Map(daten.projekte.map((p) => [p.id, p]))
  }, [daten])

  const kundenMap = useMemo(() => {
    if (!daten) return new Map()
    return new Map(daten.kunden.map((k) => [k.id, k]))
  }, [daten])

  return (
    <div className="content">
      <Breadcrumb items={[{ label: 'Dashboard' }]} />
      <div className="page-header">
        <div className="titel-block">
          <h1>Übersicht</h1>
          <div className="subtitel">
            Aktuelle Kennzahlen, Aktivitäten und Schnellzugriff
          </div>
        </div>
      </div>

      {fehler && (
        <Alert titel="Backend nicht erreichbar">
          {fehler} — Bitte prüfe, ob das Backend unter
          http://localhost:8000 läuft.
        </Alert>
      )}

      {/* KPI-Karten */}
      <div className="kpi-grid">
        <KpiCard
          titel="Kunden"
          wert={daten?.counts.kunden}
          lade={lade}
          link="/kunden"
        />
        <KpiCard
          titel="Mitarbeiter"
          wert={daten?.counts.personal}
          lade={lade}
          link="/personal"
        />
        <KpiCard
          titel="Aktive Projekte"
          wert={aktiveProjekte}
          lade={lade}
          link="/projekte"
          ton="akzent"
          subwert={
            daten
              ? `von ${daten.counts.projekte} insgesamt`
              : null
          }
        />
        <KpiCard
          titel="Stunden diese Woche"
          wert={
            lade
              ? null
              : `${formatStunden(stundenDieseWoche)} h`
          }
          lade={lade}
          link="/zeiterfassungen"
          ton="akzent"
        />
      </div>

      {/* Letzte Aktivitäten */}
      <div className="activity-grid">
        <ActivityCard
          titel="Letzte Projekte"
          link="/projekte"
          lade={lade}
          leer="Noch keine Projekte"
          items={letzteProjekte.map((p) => {
            const kunde = kundenMap.get(p.kunden_id)
            return {
              key: p.id,
              to: `/projekte/${p.id}`,
              titel: p.name || `Projekt #${p.id}`,
              sub:
                [
                  kunde?.name,
                  p.status,
                  p.start_datum && `ab ${p.start_datum}`,
                ]
                  .filter(Boolean)
                  .join(' · ') || '—',
            }
          })}
        />
        <ActivityCard
          titel="Letzte Zeiterfassungen"
          link="/zeiterfassungen"
          lade={lade}
          leer="Noch keine Zeiten erfasst"
          items={letzteZeiten.map((z) => {
            const person = personalMap.get(z.personal_id)
            const projekt = projekteMap.get(z.projekt_id)
            return {
              key: z.id,
              to: `/zeiterfassungen`,
              titel: [
                person && [person.vorname, person.nachname].filter(Boolean).join(' '),
                projekt?.name,
              ]
                .filter(Boolean)
                .join(' · ') || `Zeiterfassung #${z.id}`,
              sub:
                z.start_zeit
                  ? String(z.start_zeit).slice(0, 16).replace('T', ' ')
                  : 'Zeit unbekannt',
            }
          })}
        />
      </div>

      {/* Schnellzugriff Module */}
      <div className="page-header" style={{ marginTop: 28 }}>
        <div className="titel-block">
          <h2 style={{ fontSize: 16 }}>Schnellzugriff</h2>
        </div>
      </div>
      <div className="module-grid">
        {MODULE.map((m) => {
          const count = daten?.counts[m.key]
          return (
            <Link key={m.key} to={`/${m.key}`} className="module-card">
              <div className="module-card-icon" aria-hidden="true">
                <ModulIcon name={m.icon} />
              </div>
              <div className="module-card-body">
                <div className="module-card-title">{m.label}</div>
                <div className="module-card-text">
                  {lade
                    ? 'lädt…'
                    : count === 0
                    ? 'keine Einträge'
                    : `${count} Eintrag${count === 1 ? '' : 'e'}`}
                </div>
              </div>
              <IconChevronRight className="icon module-card-arrow" />
            </Link>
          )
        })}
      </div>

      <DashboardStyles />
    </div>
  )
}

/* ============================================================ */

function KpiCard({ titel, wert, subwert, lade, link, ton = 'neutral' }) {
  const inhalt = (
    <div className={`kpi-card kpi-${ton}`}>
      <div className="kpi-titel">{titel}</div>
      {lade ? (
        <div className="kpi-skeleton" aria-hidden="true" />
      ) : (
        <div className="kpi-wert">{wert ?? '—'}</div>
      )}
      {subwert && !lade && <div className="kpi-subwert">{subwert}</div>}
    </div>
  )
  return link ? (
    <Link to={link} className="kpi-link" aria-label={titel}>
      {inhalt}
    </Link>
  ) : (
    inhalt
  )
}

function ActivityCard({ titel, link, items, lade, leer }) {
  return (
    <section className="activity-card">
      <div className="activity-header">
        <h3>{titel}</h3>
        {link && (
          <Link to={link} className="activity-mehr">
            Alle anzeigen →
          </Link>
        )}
      </div>
      {lade ? (
        <div className="activity-list">
          {[1, 2, 3, 4].map((i) => (
            <div className="activity-item activity-skel" key={i}>
              <div className="skel-zeile skel-zeile-titel" />
              <div className="skel-zeile skel-zeile-sub" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="activity-leer">{leer}</div>
      ) : (
        <ul className="activity-list">
          {items.map((it) => (
            <li key={it.key}>
              <Link to={it.to} className="activity-item">
                <div className="activity-titel">{it.titel}</div>
                <div className="activity-sub">{it.sub}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/* ============================================================ */

function DashboardStyles() {
  return (
    <style>{`
      /* KPI */
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 14px;
        margin-bottom: 22px;
      }
      .kpi-link {
        text-decoration: none;
        color: inherit;
      }
      .kpi-card {
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: var(--r-lg);
        box-shadow: var(--shadow-xs);
        padding: 16px 18px;
        min-height: 102px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        transition: border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease;
      }
      .kpi-link:hover .kpi-card {
        border-color: var(--accent-soft-border);
        box-shadow: var(--shadow-sm);
      }
      .kpi-card.kpi-akzent .kpi-wert { color: var(--accent); }
      .kpi-titel {
        font-size: 11.5px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--text-muted);
        font-weight: 600;
      }
      .kpi-wert {
        font-size: 30px;
        font-weight: 600;
        color: var(--text);
        letter-spacing: -0.025em;
        font-variant-numeric: tabular-nums;
        line-height: 1.1;
      }
      .kpi-subwert {
        font-size: 12px;
        color: var(--text-muted);
      }
      .kpi-skeleton {
        height: 32px;
        width: 64%;
        background: linear-gradient(90deg, var(--bg-muted) 0%, var(--slate-200) 50%, var(--bg-muted) 100%);
        background-size: 200% 100%;
        border-radius: 4px;
        animation: skel-pulse 1.4s ease-in-out infinite;
      }

      /* Aktivitäten */
      .activity-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
        margin-bottom: 8px;
      }
      @media (max-width: 800px) {
        .activity-grid { grid-template-columns: 1fr; }
      }
      .activity-card {
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: var(--r-lg);
        box-shadow: var(--shadow-xs);
        overflow: hidden;
      }
      .activity-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 18px;
        border-bottom: 1px solid var(--border);
      }
      .activity-header h3 {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin: 0;
      }
      .activity-mehr {
        font-size: 12px;
        color: var(--accent);
        font-weight: 500;
        text-decoration: none;
      }
      .activity-mehr:hover { text-decoration: underline; }
      .activity-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .activity-list li + li .activity-item { border-top: 1px solid var(--border); }
      .activity-item {
        display: block;
        padding: 11px 18px;
        text-decoration: none;
        color: inherit;
        transition: background 100ms ease;
      }
      .activity-item:hover { background: var(--bg-hover); }
      .activity-item:hover .activity-titel { color: var(--accent); }
      .activity-titel {
        font-size: 13.5px;
        font-weight: 500;
        color: var(--text);
      }
      .activity-sub {
        font-size: 12px;
        color: var(--text-muted);
        margin-top: 2px;
      }
      .activity-leer {
        padding: 28px 18px;
        text-align: center;
        color: var(--text-muted);
        font-size: 13px;
      }
      .activity-skel { pointer-events: none; }
      .skel-zeile {
        height: 10px;
        border-radius: 4px;
        background: linear-gradient(90deg, var(--bg-muted) 0%, var(--slate-200) 50%, var(--bg-muted) 100%);
        background-size: 200% 100%;
        animation: skel-pulse 1.4s ease-in-out infinite;
      }
      .skel-zeile-titel { width: 60%; margin-bottom: 6px; }
      .skel-zeile-sub   { width: 40%; height: 8px; }

      @keyframes skel-pulse {
        0%   { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      /* Modul-Schnellzugriff (kompakter als die alten Karten) */
      .module-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
        gap: 10px;
      }
      .module-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 14px;
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: var(--r-md);
        box-shadow: var(--shadow-xs);
        text-decoration: none;
        color: var(--text);
        transition: border-color 120ms ease, background 120ms ease;
      }
      .module-card:hover {
        border-color: var(--accent-soft-border);
        background: var(--bg-hover);
      }
      .module-card-icon {
        width: 32px;
        height: 32px;
        border-radius: 7px;
        background: var(--accent-soft);
        color: var(--accent);
        display: grid;
        place-items: center;
        flex-shrink: 0;
        border: 1px solid var(--accent-soft-border);
      }
      .module-card-icon svg { width: 16px; height: 16px; }
      .module-card-body { flex: 1; min-width: 0; }
      .module-card-title { font-weight: 600; font-size: 13.5px; }
      .module-card-text {
        font-size: 12px;
        color: var(--text-muted);
        margin-top: 1px;
      }
      .module-card-arrow {
        color: var(--text-muted);
        width: 14px;
        height: 14px;
        flex-shrink: 0;
      }
      .module-card:hover .module-card-arrow { color: var(--accent); }
    `}</style>
  )
}
