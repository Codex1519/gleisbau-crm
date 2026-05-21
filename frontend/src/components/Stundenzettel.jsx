import { Link } from 'react-router-dom'
import { findModul } from '../modules'
import { EmptyState } from './EmptyState'
import {
  berechneGesamtMinuten,
  berechneNettoMinuten,
  formatDatum,
  formatStunden,
  formatZeit,
} from '../lib/zeiterfassung'

// Wiederverwendbare Tabelle für Zeiterfassungs-Einträge.
//
// variant:
//   'voll'      – Spalten: Mitarbeiter + Projekt (Übersicht /zeiterfassungen)
//   'personal'  – Spalten: Projekt (auf Personal-Detailseite)
//   'projekt'   – Spalten: Mitarbeiter (auf Projekt-Detailseite)
//
// personalMap, projekteMap: Map<id, entity> — vom Aufrufer vorbereitet,
// damit pro Tabelle nur einmal aufgelöst werden muss.
export function Stundenzettel({
  zeiten,
  variant = 'voll',
  personalMap,
  projekteMap,
  leerTitel = 'Keine Zeiten erfasst',
  leerText,
}) {
  if (!zeiten || zeiten.length === 0) {
    return <EmptyState titel={leerTitel} text={leerText} />
  }

  const personalModul = findModul('personal')
  const projekteModul = findModul('projekte')
  const gesamtMinuten = berechneGesamtMinuten(zeiten)

  const zeigeMitarbeiter = variant === 'voll' || variant === 'projekt'
  const zeigeProjekt = variant === 'voll' || variant === 'personal'

  // sortiert nach Start absteigend (neueste zuerst)
  const sortiert = [...zeiten].sort((a, b) =>
    String(b.start_zeit || '').localeCompare(String(a.start_zeit || ''))
  )

  // colSpan für die Summen-Zeile = Anzahl Spalten minus 1 (Summen-Wert)
  const spaltenAnzahl =
    1 /* Datum */ +
    (zeigeMitarbeiter ? 1 : 0) +
    (zeigeProjekt ? 1 : 0) +
    1 /* Start */ +
    1 /* Ende */ +
    1 /* Pause */ +
    1 /* Stunden */
  const summeColSpan = spaltenAnzahl - 1

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
          </tr>
        </thead>
        <tbody>
          {sortiert.map((z) => {
            const minuten = berechneNettoMinuten(z)
            const p = personalMap?.get(z.personal_id)
            const pr = projekteMap?.get(z.projekt_id)
            return (
              <tr key={z.id}>
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
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="summe-row">
            <td colSpan={summeColSpan}>Gesamtstunden</td>
            <td className="num-col">{formatStunden(gesamtMinuten)} h</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
