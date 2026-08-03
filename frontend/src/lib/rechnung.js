// Gemeinsame Helfer für das Rechnungs-Modul (v1.0 — E-Rechnungspflicht)
import { API_BASE, getToken } from '../api'

// Status-Optionen für StatusBadge (Ausgang + Eingang)
export const RECHNUNG_STATUS = [
  { value: 'entwurf', label: 'Entwurf', farbe: 'grau' },
  { value: 'gestellt', label: 'Gestellt', farbe: 'blau' },
  { value: 'eingegangen', label: 'Eingegangen', farbe: 'gelb' },
  { value: 'bezahlt', label: 'Bezahlt', farbe: 'gruen' },
  { value: 'storniert', label: 'Storniert', farbe: 'rot' },
]

// Muss zu EINHEIT_CODES im Backend passen (XRechnung-Einheitencodes)
export const EINHEITEN = [
  'Stück',
  'Stunde',
  'Tag',
  'm',
  'm2',
  'm3',
  't',
  'kg',
  'pauschal',
]

export const UST_SAETZE = [19, 7, 0]

const euroFormat = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
})

export function formatEuro(wert) {
  const zahl = Number(wert)
  if (wert == null || wert === '' || Number.isNaN(zahl)) return '—'
  return euroFormat.format(zahl)
}

export function formatDatumDE(iso) {
  if (!iso) return '—'
  const [j, m, t] = String(iso).slice(0, 10).split('-')
  return `${t}.${m}.${j}`
}

// Clientseitige Vorschau-Summen (der Server rechnet beim Speichern erneut)
export function berechneSummen(positionen) {
  let netto = 0
  const ustJeSatz = {}
  for (const p of positionen) {
    const zeile =
      Math.round(Number(p.menge || 0) * Number(p.einzelpreis || 0) * 100) / 100
    netto += zeile
    const satz = Number(p.ust_satz || 0)
    ustJeSatz[satz] = (ustJeSatz[satz] || 0) + zeile
  }
  let ustGesamt = 0
  const ust = Object.entries(ustJeSatz).map(([satz, basis]) => {
    const betrag = Math.round(basis * Number(satz)) / 100
    ustGesamt += betrag
    return { satz: Number(satz), basis, betrag }
  })
  return { netto, ust, ustGesamt, brutto: netto + ustGesamt }
}

// XRechnung-XML mit Auth-Header laden und als Download anstoßen
export async function ladeXRechnung(rechnung) {
  const res = await fetch(`${API_BASE}/rechnungen/${rechnung.id}/xrechnung`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  if (!res.ok) {
    let text = await res.text().catch(() => '')
    try {
      text = JSON.parse(text).detail || text
    } catch {
      /* kein JSON */
    }
    throw new Error(text || `Fehler ${res.status}`)
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${rechnung.nummer || 'rechnung'}.xml`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// Firmendaten: Einzelressource ohne id — deshalb eigene Aufrufe
export async function speichereFirmendaten(daten) {
  const res = await fetch(`${API_BASE}/firmendaten`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(daten),
  })
  if (!res.ok) throw new Error('Firmendaten konnten nicht gespeichert werden')
  return res.json()
}
