import { Link } from 'react-router-dom'
import { findModul } from '../modules'
import { EmptyState } from './EmptyState'
import { IconPencil } from './Icons'
import {
  berechneGesamtMinuten,
  berechneNettoMinuten,
  formatDatum,
  formatStunden,
  formatZeit,
  UEBERSTUNDEN_SCHWELLE_MIN,
} from '../lib/zeiterfassung'

// Wiederverwendbare Tabelle für Zeiterfassungs-Einträge.
//
// variant:
//   'voll'      – Spalten: Mitarbeiter + Projekt (Übersicht /zeiterfassungen)
//   'personal'  – Spalten: Projekt (auf Personal-Detailseite)
//   'projekt'   – Spalten: Mitarbeiter (auf Projekt-Detailseite)
//
// personalMap, projekteMap: Map<id, entity> — vom Aufrufer vorbereitet.
// markiereUeberstunden: Zeilen > 8 h gelb hervorheben.
// onEdit(eintrag): falls gesetzt, erscheint eine Aktion-Spalte mit Edit-Button.
export function Stundenzettel({
  zeiten,
  variant = 'voll',
  personalMap,
  projekteMap,
  leerTitel = 'Keine Zeiten erfasst',
  leerText,
  markiereUeberstunden = false,
  onEdit,
}) {
  if (!zeiten || zeiten.length === 0) {
    return <EmptyState titel={leerTitel} text={leerText} />
  }

  const personalModul = findModul('personal')
  const projekteModul = findModul('projekte')
  const gesamtMinuten = berechneGesamtMinuten(zeiten)

  const zeigeMitarbeiter = variant === 'voll' || variant === 'projekt'
  const zeigeProjekt = variant === 'voll' || variant === 'personal'
  const zeigeAktion = typeof onEdit === 'function'

  // sortiert nach Start absteigend (neueste zuerst)
  const sortiert = [...zeiten].sort((a, b) =>
    String(b.start_zeit || '').localeCompare(String(a.start_zeit || ''))
  )

  // colSpan für die Summen-Zeile = alle Spalten bis vor "Stunden"
  const summeColSpan =
    1 /* Datum */ +
    (zeigeMitarbeiter ? 1 : 0) +
    (zeigeProjekt ? 1 : 0) +
    1 /* Start */ +
    1 /* Ende */ +
    1 /* Pause */

  return (
    <div className="tabelle-wrap">
      <table className="stundenzettel">
        <thead>
          <tr>
            <th>Datum</th>
            {zeigeMitarbeiter && <th>Mitarbeiter</th>}
            {zeigeProjekt && <th>Projekt</th>}
            <th>Start</th>
            <th>Ende</th>
            <th>Pause</th>
            <th className="num-col">Stunden</th>
            {zeigeAktion && <th className="col-actions">Aktion</th>}
          </tr>
        </thead>
        <tbody>
          {sortiert.map((z) => {
            const minuten = berechneNettoMinuten(z)
            const ueber =
              markiereUeberstunden &&
              minuten != null &&
              minuten > UEBERSTUNDEN_SCHWELLE_MIN
            const p = personalMap?.get(z.personal_id)
            const pr = projekteMap?.get(z.projekt_id)
            return (
              <tr key={z.id} className={ueber ? 'ueberstunde' : ''}>
                <td className="muted-cell">{formatDatum(z.start_zeit)}</td>
                {zeigeMitarbeiter && (
                  <td className="primary-cell">
                    {p ? (
                      <Link to={`/personal/${p.id}`}>
                        {personalModul.displayName(p)}
                      </Link>
                    ) : (
                      <span className="value-empty">#{z.personal_id}</span>
                    )}
                  </td>
                )}
                {zeigeProjekt && (
                  <td className="primary-cell">
                    {pr ? (
                      <Link to={`/projekte/${pr.id}`}>
                        {projekteModul.displayName(pr)}
                      </Link>
                    ) : (
                      <span className="value-empty">#{z.projekt_id}</span>
                    )}
                  </td>
                )}
                <td>{formatZeit(z.start_zeit)}</td>
                <td>{formatZeit(z.end_zeit)}</td>
                <td className="muted-cell">
                  {Number(z.pause_minuten || 0)} min
                </td>
                <td className="num-col stunden-zelle">
                  {formatStunden(minuten)} h
                  {ueber && (
                    <span className="ueber-tag" title="Über 8 Stunden">
                      ÜS
                    </span>
                  )}
                </td>
                {zeigeAktion && (
                  <td className="col-actions">
                    <button
                      type="button"
                      className="btn-icon-edit"
                      title="Zeiterfassung bearbeiten"
                      aria-label="Zeiterfassung bearbeiten"
                      onClick={() => onEdit(z)}
                    >
                      <IconPencil />
                    </button>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="summe-row">
            <td colSpan={summeColSpan}>Gesamtstunden</td>
            <td className="num-col">{formatStunden(gesamtMinuten)} h</td>
            {zeigeAktion && <td />}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
