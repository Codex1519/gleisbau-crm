import { useMemo } from 'react'
import { findModul } from '../modules'
import { EmptyState } from './EmptyState'
import {
  berechneNettoMinuten,
  eintragDatum,
  formatStunden,
  montagDerWoche,
  toISODate,
  UEBERSTUNDEN_SCHWELLE_MIN,
  WOCHENTAGE,
  wochenTageAb,
} from '../lib/zeiterfassung'

// Wochen-Matrix: Zeilen = Mitarbeiter, Spalten = Mo–So.
// Zellen zeigen die Summe der gebuchten Stunden des Mitarbeiters an dem Tag.
// Zellen > 8 h werden gelb markiert. Leere Zellen bleiben grau.
//
// `wochenAnker`: ein Datum (Date oder ISO-String) irgendwo in der Zielwoche.
export function WochenUebersicht({ zeiten, personalMap, wochenAnker }) {
  const personalModul = findModul('personal')

  const tage = useMemo(
    () => wochenTageAb(wochenAnker || new Date()),
    [wochenAnker]
  )
  const montag = useMemo(
    () => montagDerWoche(wochenAnker || new Date()),
    [wochenAnker]
  )

  // Einträge die in diese Woche fallen
  const wochenEintraege = useMemo(() => {
    const von = tage[0]
    const bis = tage[6]
    return zeiten.filter((z) => {
      const d = eintragDatum(z)
      return d && d >= von && d <= bis
    })
  }, [zeiten, tage])

  // Map: personal_id -> [minuten je Tag-Index 0..6]
  const matrix = useMemo(() => {
    const m = new Map()
    for (const z of wochenEintraege) {
      const d = eintragDatum(z)
      const tagIdx = tage.indexOf(d)
      if (tagIdx < 0) continue
      const min = berechneNettoMinuten(z) ?? 0
      if (!m.has(z.personal_id)) m.set(z.personal_id, [0, 0, 0, 0, 0, 0, 0])
      m.get(z.personal_id)[tagIdx] += min
    }
    // in sortierte Zeilen umwandeln
    const zeilen = [...m.entries()].map(([pid, tageMin]) => {
      const p = personalMap?.get(pid)
      return {
        pid,
        name: p ? personalModul.displayName(p) : `#${pid}`,
        tageMin,
        summe: tageMin.reduce((s, v) => s + v, 0),
      }
    })
    zeilen.sort((a, b) => a.name.localeCompare(b.name, 'de'))
    return zeilen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wochenEintraege, tage, personalMap])

  // Tagessummen (Fußzeile)
  const tagesSummen = useMemo(() => {
    const summen = [0, 0, 0, 0, 0, 0, 0]
    for (const zeile of matrix) {
      zeile.tageMin.forEach((min, i) => (summen[i] += min))
    }
    return summen
  }, [matrix])

  const wochenSumme = tagesSummen.reduce((s, v) => s + v, 0)

  const wochenLabel = `${tage[0]} – ${tage[6]}`

  if (matrix.length === 0) {
    return (
      <>
        <div className="woche-kopf">
          Kalenderwoche ab {toISODate(montag)} ({wochenLabel})
        </div>
        <EmptyState
          titel="Keine Zeiten in dieser Woche"
          text="Passe den Datumsbereich an, um eine andere Woche zu sehen."
        />
      </>
    )
  }

  return (
    <div>
      <div className="woche-kopf">
        Kalenderwoche ab {toISODate(montag)}{' '}
        <span className="woche-kopf-range">({wochenLabel})</span>
      </div>
      <div className="tabelle-wrap">
        <table className="stundenzettel woche-tabelle">
          <thead>
            <tr>
              <th>Mitarbeiter</th>
              {WOCHENTAGE.map((tag, i) => (
                <th key={tag} className="num-col">
                  <div className="woche-th">
                    <span>{tag}</span>
                    <span className="woche-th-datum">{tage[i].slice(5)}</span>
                  </div>
                </th>
              ))}
              <th className="num-col">Summe</th>
            </tr>
          </thead>
          <tbody>
            {matrix.map((zeile) => (
              <tr key={zeile.pid}>
                <td className="primary-cell">{zeile.name}</td>
                {zeile.tageMin.map((min, i) => {
                  const leer = min <= 0
                  const ueber = min > UEBERSTUNDEN_SCHWELLE_MIN
                  return (
                    <td
                      key={i}
                      className={`num-col woche-zelle${
                        leer ? ' leer' : ''
                      }${ueber ? ' ueber' : ''}`}
                    >
                      {leer ? '·' : `${formatStunden(min)}`}
                    </td>
                  )
                })}
                <td className="num-col stunden-zelle">
                  {formatStunden(zeile.summe)} h
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="summe-row">
              <td>Tagessumme</td>
              {tagesSummen.map((min, i) => (
                <td key={i} className="num-col">
                  {min > 0 ? formatStunden(min) : '·'}
                </td>
              ))}
              <td className="num-col">{formatStunden(wochenSumme)} h</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <style>{`
        .woche-kopf {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          padding: 0 2px 12px;
        }
        .woche-kopf-range {
          color: var(--text-muted);
          font-weight: 500;
        }
        .woche-tabelle th.num-col { text-align: right; }
        .woche-th {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 1px;
        }
        .woche-th-datum {
          font-size: 9.5px;
          color: var(--text-muted);
          font-weight: 500;
          letter-spacing: 0;
          text-transform: none;
        }
        .woche-zelle { font-variant-numeric: tabular-nums; }
        .woche-zelle.leer { color: var(--text-muted); }
        .woche-zelle.ueber {
          background: #fefce8;
          color: #854d0e;
          font-weight: 600;
        }
      `}</style>
    </div>
  )
}
