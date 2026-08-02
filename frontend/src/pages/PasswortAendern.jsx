import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api'
import { useToast } from '../contexts/ToastContext'
import { Breadcrumb } from '../components/Breadcrumb'
import { Alert } from '../components/Alert'
import { Sektion } from '../components/Sektion'

export function PasswortAendern() {
  const navigate = useNavigate()
  const toast = useToast()
  const [altes, setAltes] = useState('')
  const [neues, setNeues] = useState('')
  const [wiederholung, setWiederholung] = useState('')
  const [fehler, setFehler] = useState(null)
  const [speichere, setSpeichere] = useState(false)

  async function absenden(e) {
    e.preventDefault()
    setFehler(null)
    if (neues !== wiederholung) {
      setFehler('Die Wiederholung stimmt nicht mit dem neuen Passwort überein.')
      return
    }
    setSpeichere(true)
    try {
      await authApi.passwortAendern(altes, neues)
      toast.erfolg('Passwort geändert')
      navigate('/')
    } catch (err) {
      setFehler(err.message)
    } finally {
      setSpeichere(false)
    }
  }

  return (
    <div className="content">
      <Breadcrumb items={[{ label: 'Module', to: '/' }, { label: 'Passwort ändern' }]} />

      <div className="page-header">
        <div className="titel-block">
          <h1>Passwort ändern</h1>
        </div>
      </div>

      {fehler && <Alert titel="Passwort ändern fehlgeschlagen">{fehler}</Alert>}

      <Sektion titel="Neues Passwort">
        <form onSubmit={absenden}>
          <div className="felder">
            <label className="feld" htmlFor="pw-alt">
              <span className="feld-label">
                Aktuelles Passwort<span className="feld-required">*</span>
              </span>
              <input
                id="pw-alt"
                type="password"
                required
                autoComplete="current-password"
                value={altes}
                onChange={(e) => setAltes(e.target.value)}
              />
            </label>
            <label className="feld" htmlFor="pw-neu">
              <span className="feld-label">
                Neues Passwort (min. 8 Zeichen)<span className="feld-required">*</span>
              </span>
              <input
                id="pw-neu"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={neues}
                onChange={(e) => setNeues(e.target.value)}
              />
            </label>
            <label className="feld" htmlFor="pw-wdh">
              <span className="feld-label">
                Neues Passwort wiederholen<span className="feld-required">*</span>
              </span>
              <input
                id="pw-wdh"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={wiederholung}
                onChange={(e) => setWiederholung(e.target.value)}
              />
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={speichere}>
              {speichere ? 'Speichert…' : 'Passwort ändern'}
            </button>
          </div>
        </form>
      </Sektion>
    </div>
  )
}
