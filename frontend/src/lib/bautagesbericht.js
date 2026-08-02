// Wetter-Optionen für Bautagesberichte.
// Die Icons sind eigene SVGs (WetterSymbol in components/Icons.jsx) —
// Emojis rendern auf jedem Gerät anders und wirken unprofessionell.
export const WETTER_OPTIONEN = [
  { value: 'Sonnig', label: 'Sonnig' },
  { value: 'Bewölkt', label: 'Bewölkt' },
  { value: 'Leichter Regen', label: 'Leichter Regen' },
  { value: 'Starkregen', label: 'Starkregen' },
  { value: 'Frost', label: 'Frost' },
  { value: 'Schnee', label: 'Schnee' },
  { value: 'Sturm', label: 'Sturm' },
  { value: 'Nebel', label: 'Nebel' },
]

// Ampel-Farbe (CSS-Klassen-Suffix) für einen Baufortschritt-Wert.
export function fortschrittFarbe(prozent) {
  const p = Number(prozent)
  if (!Number.isFinite(p)) return 'grau'
  if (p >= 100) return 'gruen'
  if (p >= 50) return 'blau'
  if (p > 0) return 'gelb'
  return 'grau'
}

// Ersteller-ID mit Fallback auf die Altlast personal_id.
export function erstellerId(bericht) {
  return bericht?.ersteller_id ?? bericht?.personal_id ?? null
}

// Hat der Bericht überhaupt inhaltliche Angaben (für "leer ausblenden")?
export function hatInhalt(wert) {
  return wert !== null && wert !== undefined && String(wert).trim() !== ''
}
