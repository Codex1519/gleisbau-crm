import { createContext, useContext, useEffect, useState } from 'react'
import { authApi, getToken, setToken } from '../api'

const AuthContext = createContext(null)
const BENUTZER_CACHE = 'gleisbau_benutzer'

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth außerhalb von <AuthProvider>')
  return ctx
}

function istNetzfehler(err) {
  return /Failed to fetch|NetworkError|Load failed/i.test(
    String(err?.message || err)
  )
}

export function AuthProvider({ children }) {
  const [benutzer, setBenutzer] = useState(null)
  const [laedt, setLaedt] = useState(!!getToken())

  // Bei App-Start: vorhandenen Token validieren.
  // Offline (kein Netz) heißt NICHT abgemeldet: dann gilt der zuletzt
  // bestätigte Benutzer aus dem Cache — wichtig fürs Feld-Formular
  // auf Baustellen ohne Empfang. Nur ein echtes 401 wirft raus.
  useEffect(() => {
    if (!getToken()) return
    authApi
      .me()
      .then((b) => {
        setBenutzer(b)
        localStorage.setItem(BENUTZER_CACHE, JSON.stringify(b))
      })
      .catch((e) => {
        if (istNetzfehler(e)) {
          try {
            const cached = JSON.parse(localStorage.getItem(BENUTZER_CACHE))
            if (cached) {
              setBenutzer(cached)
              return
            }
          } catch {
            /* kein Cache */
          }
        }
        setToken(null)
        localStorage.removeItem(BENUTZER_CACHE)
      })
      .finally(() => setLaedt(false))
  }, [])

  async function login(benutzername, passwort) {
    const res = await authApi.login(benutzername, passwort)
    setToken(res.token)
    setBenutzer(res.benutzer)
    localStorage.setItem(BENUTZER_CACHE, JSON.stringify(res.benutzer))
    return res.benutzer
  }

  function logout() {
    setToken(null)
    setBenutzer(null)
    localStorage.removeItem(BENUTZER_CACHE)
  }

  const istAdmin = benutzer?.rolle === 'admin'
  // Sachbearbeiter dürfen nicht löschen (Backend erzwingt das ebenfalls)
  const darfLoeschen = benutzer != null && benutzer.rolle !== 'sachbearbeiter'

  return (
    <AuthContext.Provider
      value={{ benutzer, istAdmin, darfLoeschen, laedt, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}
