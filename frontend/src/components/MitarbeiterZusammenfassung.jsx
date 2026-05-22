import { useMemo } from 'react'
import { findModul } from '../modules'
import {
  berechneNettoMinuten,
  formatStunden,
} from '../lib/zeiterfassung'

// Auswertung der gefilterten Einträge gruppiert nach Mitarbeiter:
// Mitarbeiter | Gesamtstunden | Anzahl Einträge   (+ Gesamtsumme)
export function MitarbeiterZusammenfassung({ zeiten, personalMap }) {
  const personalModul = findModul('personal')

  const zeilen = useMemo(() => {
    const acc = new Map() // personal_id -> { minuten, anzahl }
    for (const z of zeiten) {
      const m = berechneNettoMinuten(z)
      const eintrag = acc.get(z.personal_id) || { minuten: 0, anzahl: 0 }
      eintrag.minuten += m ?? 0
      eintrag.anzahl += 1
      acc.set(z.personal_id, eintrag)
    }
    const liste = [...acc.entries()].map(([pid, v]) => {
      const p = personalMap?.get(pid)
      return {
        pid,
        name: p ? personalModul.displayName(p) : `#${pid}`,
        minuten: v.minuten,
        anzahl: v.anzahl,
      }
    })
    // nach Stunden absteigend
    liste.sort((a, b) => b.minuten - a.minuten)
    return liste
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zeiten, personalMap])

  const gesamtMinuten = zeilen.reduce((s, z) => s + z.minuten, 0)
  const gesamtAnzahl = zeilen.reduce((s, z) => s + z.anzahl, 0)

  if (zeilen.length === 0) return null

  return (
    <div className="tabelle-wrap">
      <table className="stundenzettel">
        <thead>
          <tr>
            <th>Mitarbeiter</th>
            <th className="num-col">Gesamtstunden</th>
            <th className="num-col">Einträge</th>
          </tr>
        </thead>
        <tbody>
          {zeilen.map((z) => (
            <tr key={z.pid}>
              <td className="primary-cell">{z.name}</td>
              <td className="num-col stunden-zelle">
                {formatStunden(z.minuten)} h
              </td>
              <td className="num-col muted-cell">{z.anzahl}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="summe-row">
            <td>Alle Mitarbeiter</td>
            <td className="num-col">{formatStunden(gesamtMinuten)} h</td>
            <td className="num-col">{gesamtAnzahl}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
