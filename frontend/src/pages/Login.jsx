import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [benutzername, setBenutzername] = useState('')
  const [passwort, setPasswort] = useState('')
  const [fehler, setFehler] = useState(null)
  const [laedt, setLaedt] = useState(false)

  async function absenden(e) {
    e.preventDefault()
    setFehler(null)
    setLaedt(true)
    try {
      await login(benutzername, passwort)
      navigate('/', { replace: true })
    } catch (err) {
      setFehler(
        err.message.includes('401')
          ? 'Benutzername oder Passwort falsch.'
          : err.message
      )
    } finally {
      setLaedt(false)
    }
  }

  return (
    <div className="login-seite">
      <form className="login-karte" onSubmit={absenden}>
        <div className="login-kopf">
          <div className="brand-logo" aria-hidden="true">
            GB
          </div>
          <div>
            <div className="brand-name">Gleisbau-CRM</div>
            <div className="brand-sub">Anmeldung</div>
          </div>
        </div>

        {fehler && (
          <div className="alert alert-error" role="alert">
            {fehler}
          </div>
        )}

        <label className="feld" htmlFor="login-benutzer">
          <span className="feld-label">Benutzername</span>
          <input
            id="login-benutzer"
            type="text"
            autoComplete="username"
            autoFocus
            required
            value={benutzername}
            onChange={(e) => setBenutzername(e.target.value)}
          />
        </label>

        <label className="feld" htmlFor="login-passwort">
          <span className="feld-label">Passwort</span>
          <input
            id="login-passwort"
            type="password"
            autoComplete="current-password"
            required
            value={passwort}
            onChange={(e) => setPasswort(e.target.value)}
          />
        </label>

        <button type="submit" className="btn btn-primary login-btn" disabled={laedt}>
          {laedt ? 'Anmelden…' : 'Anmelden'}
        </button>
      </form>
    </div>
  )
}
