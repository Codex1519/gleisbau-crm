// Gemeinsamer CSV-Export, Excel-tauglich (deutsches Excel):
// Semikolon als Trenner + UTF-8-BOM, damit Umlaute und Spalten stimmen.
//
// zeilen: Array von Arrays, erste Zeile = Kopfzeile.

export function exportiereCsv(dateiname, zeilen) {
  const escape = (val) => {
    const s = String(val ?? '')
    return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  const csv = zeilen.map((z) => z.map(escape).join(';')).join('\r\n')
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
