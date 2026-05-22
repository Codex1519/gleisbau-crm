import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { api } from '../api'

// Globaler Daten-Cache für die Suche.
// Lädt Kunden, Personal, Projekte und Maschinen einmalig beim App-Start
// und aktualisiert sie alle 5 Minuten im Hintergrund (ohne Lade-Flackern).

const SearchDataContext = createContext(null)

const REFRESH_MS = 5 * 60 * 1000
const LEER = { kunden: [], personal: [], projekte: [], maschinen: [] }

export function SearchProvider({ children }) {
  const [daten, setDaten] = useState(LEER)
  const [lade, setLade] = useState(true)
  const [fehler, setFehler] = useState(null)

  const ladeDaten = useCallback(async (initial) => {
    if (initial) setLade(true)
    try {
      const [kunden, personal, projekte, maschinen] = await Promise.all([
        api.list('kunden'),
        api.list('personal'),
        api.list('projekte'),
        api.list('maschinen'),
      ])
      setDaten({ kunden, personal, projekte, maschinen })
      setFehler(null)
    } catch (e) {
      setFehler(e.message)
    } finally {
      if (initial) setLade(false)
    }
  }, [])

  useEffect(() => {
    ladeDaten(true)
    const id = setInterval(() => ladeDaten(false), REFRESH_MS)
    return () => clearInterval(id)
  }, [ladeDaten])

  return (
    <SearchDataContext.Provider
      value={{ daten, lade, fehler, reload: () => ladeDaten(true) }}
    >
      {children}
    </SearchDataContext.Provider>
  )
}

export function useSearchData() {
  const ctx = useContext(SearchDataContext)
  if (!ctx) throw new Error('useSearchData außerhalb von <SearchProvider>')
  return ctx
}
