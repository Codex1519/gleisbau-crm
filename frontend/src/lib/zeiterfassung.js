// Zentrale Helper für Zeiterfassungs-Berechnungen.
// Eine einzige Quelle der Wahrheit — überall identische Werte.

// Netto-Minuten = (Ende - Start) - Pause. Liefert null wenn unklar.
export function berechneNettoMinuten(eintrag) {
  if (!eintrag?.start_zeit || !eintrag?.end_zeit) return null
  const start = new Date(eintrag.start_zeit)
  const ende = new Date(eintrag.end_zeit)
  const brutto = (ende - start) / 60000
  if (!Number.isFinite(brutto) || brutto < 0) return null
  const pause = Number(eintrag.pause_minuten ?? 0) || 0
  return Math.max(0, brutto - pause)
}

// Stunden mit 2 Nachkommastellen, z. B. 7.25
export function formatStunden(minuten) {
  if (minuten == null) return '—'
  return (minuten / 60).toFixed(2)
}

// Summe Netto-Minuten über eine Liste
export function berechneGesamtMinuten(eintraege) {
  let summe = 0
  for (const e of eintraege) {
    const m = berechneNettoMinuten(e)
    if (m != null) summe += m
  }
  return summe
}

// "2025-05-20T08:30:00" → "2025-05-20"
export function formatDatum(isoString) {
  if (!isoString) return '—'
  return String(isoString).slice(0, 10)
}

// "2025-05-20T08:30:00" → "08:30"
export function formatZeit(isoString) {
  if (!isoString) return '—'
  const m = String(isoString).match(/T(\d{2}:\d{2})/)
  return m ? m[1] : '—'
}

// ---------- Überstunden ----------
// Schwelle: mehr als 8 Stunden pro Eintrag gilt als Überstunde.
export const UEBERSTUNDEN_SCHWELLE_MIN = 8 * 60

export function istUeberstunde(eintrag) {
  const m = berechneNettoMinuten(eintrag)
  return m != null && m > UEBERSTUNDEN_SCHWELLE_MIN
}

// ---------- Datums-Helfer ----------
// "YYYY-MM-DD" in lokaler Zeit (ohne TZ-Verschiebung durch toISOString).
export function toISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function heuteISO() {
  return toISODate(new Date())
}

// Montag 00:00 der Woche, die `datum` enthält (ISO-Wochenanfang).
export function montagDerWoche(datum = new Date()) {
  const d = new Date(datum)
  d.setHours(0, 0, 0, 0)
  const tag = d.getDay() // 0=So … 6=Sa
  const offset = tag === 0 ? 6 : tag - 1
  d.setDate(d.getDate() - offset)
  return d
}

// Erster Tag des Monats, der `datum` enthält.
export function ersterDesMonats(datum = new Date()) {
  const d = new Date(datum)
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

// Datum eines Eintrags als "YYYY-MM-DD" (abgeleitet aus start_zeit).
export function eintragDatum(eintrag) {
  return eintrag?.start_zeit ? String(eintrag.start_zeit).slice(0, 10) : null
}

// Wochentag-Index Mo=0 … So=6 für ein "YYYY-MM-DD" oder Date.
export function wochentagIndex(dateOrStr) {
  const d = new Date(dateOrStr)
  const tag = d.getDay()
  return tag === 0 ? 6 : tag - 1
}

export const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

// Gibt 7 ISO-Datumsstrings ab dem Montag der Woche von `datum` zurück.
export function wochenTageAb(montag) {
  const mo = montagDerWoche(montag)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mo)
    d.setDate(mo.getDate() + i)
    return toISODate(d)
  })
}

// ---------- CSV-Export ----------
// zeilen: Array von Arrays (erste Zeile = Header).
export function exportiereCsv(dateiname, zeilen) {
  const escape = (val) => {
    const s = String(val ?? '')
    return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  const csv = zeilen.map((z) => z.map(escape).join(',')).join('\n')
  // BOM voranstellen → Excel erkennt UTF-8 (Umlaute korrekt).
  const blob = new Blob(['﻿' + csv], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = dateiname
  a.click()
  URL.revokeObjectURL(url)
}
