import { createContext, useContext, useEffect, useState } from 'react'
import { authApi, getToken, setToken } from '../api'

const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth außerhalb von <AuthProvider>')
  return ctx
}

export function AuthProvider({ children }) {
  const [benutzer, setBenutzer] = useState(null)
  const [laedt, setLaedt] = useState(!!getToken())

  // Bei App-Start: vorhandenen Token validieren
  useEffect(() => {
    if (!getToken()) return
    authApi
      .me()
      .then(setBenutzer)
      .catch(() => setToken(null))
      .finally(() => setLaedt(false))
  }, [])

  async function login(benutzername, passwort) {
    const res = await authApi.login(benutzername, passwort)
    setToken(res.token)
    setBenutzer(res.benutzer)
    return res.benutzer
  }

  function logout() {
    setToken(null)
    setBenutzer(null)
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
