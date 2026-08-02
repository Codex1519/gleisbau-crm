import { useState } from 'react'
import { IconPlus, IconX } from './Icons'

// Strukturierte Erfassung des anwesenden Personals im Bautagesbericht.
//
// Gespeichert wird weiterhin ein lesbarer Text im bestehenden Backend-Feld
// personal_anwesend (TEXT), z. B. "2× Polier · 3× Facharbeiter · 1× Kranführer".
// Dadurch bleiben Detailansicht, PDF-Export und Alt-Einträge kompatibel.

export const STANDARD_ROLLEN = [
  'Polier',
  'Vorarbeiter',
  'Facharbeiter',
  'Bauhelfer',
]

// "2× Polier · 1x Kranführer" → { counts, extra }
// Alt-Freitext, der nicht dem Muster entspricht, wird als Zusatz-Zeile
// übernommen (nichts geht verloren).
export function parsePersonalAnwesend(text) {
  const counts = Object.fromEntries(STANDARD_ROLLEN.map((r) => [r, 0]))
  const extra = []
  if (!text || !String(text).trim()) return { counts, extra }

  for (const roh of String(text).split(/\s*[·;,]\s*/)) {
    const chunk = roh.trim()
    if (!chunk) continue
    const m = chunk.match(/^(\d+)\s*[×x*]\s*(.+)$/i)
    if (m) {
      const anzahl = Number(m[1])
      const name = m[2].trim()
      const std = STANDARD_ROLLEN.find(
        (r) => r.toLowerCase() === name.toLowerCase()
      )
      if (std) counts[std] += anzahl
      else extra.push({ bezeichnung: name, anzahl: String(anzahl) })
    } else {
      extra.push({ bezeichnung: chunk, anzahl: '1' })
    }
  }
  return { counts, extra }
}

export function serializePersonalAnwesend(counts, extra) {
  const teile = []
  for (const r of STANDARD_ROLLEN) {
    const n = Number(counts[r]) || 0
    if (n > 0) teile.push(`${n}× ${r}`)
  }
  for (const e of extra) {
    const name = String(e.bezeichnung || '').trim()
    if (!name) continue
    teile.push(`${Number(e.anzahl) || 1}× ${name}`)
  }
  return teile.join(' · ')
}

export function PersonalAnwesendFeld({ wert, onChange, disabled }) {
  // Einmalig aus dem gespeicherten Text initialisieren; danach ist
  // dieser State die Quelle der Wahrheit und wird serialisiert hochgereicht.
  const [{ counts, extra }, setState] = useState(() =>
    parsePersonalAnwesend(wert)
  )

  function update(neueCounts, neuesExtra) {
    setState({ counts: neueCounts, extra: neuesExtra })
    onChange(serializePersonalAnwesend(neueCounts, neuesExtra))
  }

  function setCount(rolle, roh) {
    const n = roh === '' ? '' : Math.max(0, Number(roh) || 0)
    update({ ...counts, [rolle]: n }, extra)
  }

  function setExtra(i, feld, v) {
    const neu = extra.map((e, idx) => (idx === i ? { ...e, [feld]: v } : e))
    update(counts, neu)
  }

  function addExtra() {
    update(counts, [...extra, { bezeichnung: '', anzahl: '1' }])
  }

  function removeExtra(i) {
    update(
      counts,
      extra.filter((_, idx) => idx !== i)
    )
  }

  const zusammenfassung = serializePersonalAnwesend(counts, extra)

  return (
    <div className="pa-feld">
      <div className="pa-rollen">
        {STANDARD_ROLLEN.map((rolle) => (
          <label className="pa-rolle" key={rolle}>
            <span className="pa-rolle-name">{rolle}</span>
            <input
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={counts[rolle]}
              disabled={disabled}
              onChange={(e) => setCount(rolle, e.target.value)}
            />
          </label>
        ))}
      </div>

      {extra.map((e, i) => (
        <div className="pa-extra" key={i}>
          <input
            type="text"
            placeholder="Qualifikation (z. B. Kranführer)"
            value={e.bezeichnung}
            disabled={disabled}
            onChange={(ev) => setExtra(i, 'bezeichnung', ev.target.value)}
          />
          <input
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            aria-label="Anzahl"
            value={e.anzahl}
            disabled={disabled}
            onChange={(ev) => setExtra(i, 'anzahl', ev.target.value)}
          />
          <button
            type="button"
            className="pa-entfernen"
            onClick={() => removeExtra(i)}
            disabled={disabled}
            title="Qualifikation entfernen"
            aria-label="Qualifikation entfernen"
          >
            <IconX />
          </button>
        </div>
      ))}

      <button
        type="button"
        className="btn btn-ghost pa-add"
        onClick={addExtra}
        disabled={disabled}
      >
        <IconPlus />
        Weitere Qualifikation hinzufügen
      </button>

      {zusammenfassung && (
        <div className="pa-zusammenfassung">
          Erfasst: <span>{zusammenfassung}</span>
        </div>
      )}
    </div>
  )
}
