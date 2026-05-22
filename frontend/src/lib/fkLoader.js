// Sammelt alle FK-Ziel-Module eines Moduls und lädt sie parallel.
// Liefert:
//   fkData:   { [moduleKey]: Array<Entity> }
//   fkLabels: { [moduleKey]: Map<id, string> }   – für formatiereWert
//   fkOptionen: (feldName) => Array<{ id, label }>  – fürs Dropdown im Form

import { api } from '../api'
import { findModul } from '../modules'

export function fkModuleKeys(modul) {
  const set = new Set()
  for (const f of modul.felder) {
    if (f.type === 'fk') set.add(f.fk.module)
  }
  return [...set]
}

export async function ladeFkDaten(modul) {
  const keys = fkModuleKeys(modul)
  if (keys.length === 0) return { fkData: {}, fkLabels: {} }

  const ergebnisse = await Promise.all(
    keys.map(async (k) => {
      const m = findModul(k)
      const daten = await api.list(m.pfad)
      return [k, daten, m]
    })
  )

  const fkData = {}
  const fkLabels = {}
  for (const [k, daten, m] of ergebnisse) {
    fkData[k] = daten
    fkLabels[k] = new Map(daten.map((e) => [e.id, m.displayName(e)]))
  }
  return { fkData, fkLabels }
}

export function fkOptionenFuerFeld(feld, fkData) {
  const daten = fkData?.[feld.fk.module] ?? []
  const ziel = findModul(feld.fk.module)
  return daten.map((e) => ({ id: e.id, label: ziel.displayName(e) }))
}
