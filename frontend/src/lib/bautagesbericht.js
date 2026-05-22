// Wetter-Optionen für Bautagesberichte (Dropdown + Icon-Anzeige).
// Emojis sind hier bewusst gewünscht (Icon + Text laut Anforderung).
export const WETTER_OPTIONEN = [
  { value: 'Sonnig', label: 'Sonnig', icon: '☀️' },
  { value: 'Bewölkt', label: 'Bewölkt', icon: '☁️' },
  { value: 'Leichter Regen', label: 'Leichter Regen', icon: '🌦️' },
  { value: 'Starkregen', label: 'Starkregen', icon: '🌧️' },
  { value: 'Frost', label: 'Frost', icon: '❄️' },
  { value: 'Schnee', label: 'Schnee', icon: '🌨️' },
  { value: 'Sturm', label: 'Sturm', icon: '💨' },
  { value: 'Nebel', label: 'Nebel', icon: '🌫️' },
]

export function wetterIcon(value) {
  return WETTER_OPTIONEN.find((o) => o.value === value)?.icon || '🌡️'
}

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
