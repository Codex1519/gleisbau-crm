import { useEffect, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Breadcrumb } from '../components/Breadcrumb'
import { Alert } from '../components/Alert'
import { EmptyState } from '../components/EmptyState'
import { LadeBlock } from '../components/Spinner'
import { Sektion } from '../components/Sektion'
import { ConfirmDialog } from '../components/Modal'
import { IconPlus } from '../components/Icons'

const ROLLEN = [
  { value: 'admin', label: 'Admin' },
  { value: 'bauleiter', label: 'Bauleiter' },
  { value: 'sachbearbeiter', label: 'Sachbearbeiter' },
]

const NEUER_BENUTZER = {
  benutzername: '',
  passwort: '',
  rolle: 'sachbearbeiter',
  personal_id: '',
}

export function BenutzerVerwaltung() {
  const { benutzer: ich } = useAuth()
  const toast = useToast()

  const [liste, setListe] = useState([])
  const [personal, setPersonal] = useState([])
  const [lade, setLade] = useState(true)
  const [fehler, setFehler] = useState(null)

  const [neuOffen, setNeuOffen] = useState(false)
  const [neu, setNeu] = useState(NEUER_BENUTZER)
  const [pwReset, setPwReset] = useState(null) // { id, passwort }
  const [loeschen, setLoeschen] = useState(null) // Benutzer-Objekt

  useEffect(() => {
    laden()
  }, [])

  async function laden() {
    setLade(true)
    setFehler(null)
    try {
      const [benutzerListe, personalListe] = await Promise.all([
        api.list('benutzer'),
        api.list('personal'),
      ])
      setListe(benutzerListe)
      setPersonal(personalListe)
    } catch (e) {
      setFehler(e.message)
    } finally {
      setLade(false)
    }
  }

  function personalName(id) {
    if (!id) return '—'
    const p = personal.find((x) => x.id === id)
    return p ? `${p.vorname ?? ''} ${p.nachname ?? ''}`.trim() || `#${id}` : `#${id}`
  }

  async function anlegen(e) {
    e.preventDefault()
    try {
      await api.create('benutzer', {
        benutzername: neu.benutzername,
        passwort: neu.passwort,
        rolle: neu.rolle,
        personal_id: neu.personal_id ? Number(neu.personal_id) : null,
      })
      toast.erfolg(`Benutzer „${neu.benutzername}" angelegt`)
      setNeu(NEUER_BENUTZER)
      setNeuOffen(false)
      laden()
    } catch (err) {
      toast.fehler(err.message)
    }
  }

  async function aktivToggle(b) {
    try {
      await api.update('benutzer', b.id, { aktiv: !b.aktiv })
      toast.erfolg(`„${b.benutzername}" ${b.aktiv ? 'deaktiviert' : 'aktiviert'}`)
      laden()
    } catch (err) {
      toast.fehler(err.message)
    }
  }

  async function passwortSpeichern(e) {
    e.preventDefault()
    try {
      await api.update('benutzer', pwReset.id, { passwort: pwReset.passwort })
      toast.erfolg('Passwort geändert')
      setPwReset(null)
    } catch (err) {
      toast.fehler(err.message)
    }
  }

  async function loeschenBestaetigt() {
    try {
      await api.remove('benutzer', loeschen.id)
      toast.erfolg(`„${loeschen.benutzername}" gelöscht`)
      setLoeschen(null)
      laden()
    } catch (err) {
      toast.fehler(err.message)
      setLoeschen(null)
    }
  }

  return (
    <div className="content">
      <Breadcrumb items={[{ label: 'Module', to: '/' }, { label: 'Benutzer' }]} />

      <div className="page-header">
        <div className="titel-block">
          <h1>
            Benutzer
            <span className="badge">{liste.length}</span>
          </h1>
        </div>
        <div className="aktionen">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setNeuOffen((o) => !o)}
          >
            <IconPlus />
            Neuen Benutzer anlegen
          </button>
        </div>
      </div>

      {fehler && <Alert titel="Fehler beim Laden">{fehler}</Alert>}

      {neuOffen && (
        <Sektion>
          <form className="felder" onSubmit={anlegen}>
            <label className="feld" htmlFor="nb-name">
              <span className="feld-label">
                Benutzername<span className="feld-required">*</span>
              </span>
              <input
                id="nb-name"
                type="text"
                required
                autoComplete="off"
                value={neu.benutzername}
                onChange={(e) => setNeu({ ...neu, benutzername: e.target.value })}
              />
            </label>
            <label className="feld" htmlFor="nb-pw">
              <span className="feld-label">
                Passwort (min. 8 Zeichen)<span className="feld-required">*</span>
              </span>
              <input
                id="nb-pw"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={neu.passwort}
                onChange={(e) => setNeu({ ...neu, passwort: e.target.value })}
              />
            </label>
            <label className="feld" htmlFor="nb-rolle">
              <span className="feld-label">Rolle</span>
              <select
                id="nb-rolle"
                value={neu.rolle}
                onChange={(e) => setNeu({ ...neu, rolle: e.target.value })}
              >
                {ROLLEN.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="feld" htmlFor="nb-personal">
              <span className="feld-label">Mitarbeiter (optional)</span>
              <select
                id="nb-personal"
                value={neu.personal_id}
                onChange={(e) => setNeu({ ...neu, personal_id: e.target.value })}
              >
                <option value="">— keine Verknüpfung —</option>
                {personal.map((p) => (
                  <option key={p.id} value={p.id}>
                    {personalName(p.id)}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Anlegen
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setNeuOffen(false)}
              >
                Abbrechen
              </button>
            </div>
          </form>
        </Sektion>
      )}

      <Sektion tight>
        {lade ? (
          <LadeBlock text="Lade Benutzer…" />
        ) : liste.length === 0 ? (
          <EmptyState titel="Keine Benutzer" text="Lege den ersten Benutzer an." />
        ) : (
          <div className="tabelle-wrap">
            <table>
              <thead>
                <tr>
                  <th className="col-id">ID</th>
                  <th>Benutzername</th>
                  <th>Rolle</th>
                  <th>Mitarbeiter</th>
                  <th>Status</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {liste.map((b) => (
                  <tr key={b.id}>
                    <td className="col-id">{b.id}</td>
                    <td>
                      {b.benutzername}
                      {b.id === ich?.id && (
                        <span className="badge badge-accent" style={{ marginLeft: 6 }}>
                          du
                        </span>
                      )}
                    </td>
                    <td>{ROLLEN.find((r) => r.value === b.rolle)?.label ?? b.rolle}</td>
                    <td>{personalName(b.personal_id)}</td>
                    <td>{b.aktiv ? 'aktiv' : 'deaktiviert'}</td>
                    <td>
                      <div className="aktionen" style={{ gap: 6 }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setPwReset({ id: b.id, passwort: '' })}
                        >
                          Passwort
                        </button>
                        {b.id !== ich?.id && (
                          <>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => aktivToggle(b)}
                            >
                              {b.aktiv ? 'Deaktivieren' : 'Aktivieren'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger"
                              onClick={() => setLoeschen(b)}
                            >
                              Löschen
                            </button>
                          </>
                        )}
                      </div>
                      {pwReset?.id === b.id && (
                        <form
                          onSubmit={passwortSpeichern}
                          style={{ display: 'flex', gap: 6, marginTop: 8 }}
                        >
                          <input
                            type="password"
                            placeholder="Neues Passwort (min. 8)"
                            required
                            minLength={8}
                            autoFocus
                            autoComplete="new-password"
                            value={pwReset.passwort}
                            onChange={(e) =>
                              setPwReset({ ...pwReset, passwort: e.target.value })
                            }
                          />
                          <button type="submit" className="btn btn-primary">
                            Speichern
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => setPwReset(null)}
                          >
                            Abbrechen
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Sektion>

      <ConfirmDialog
        offen={!!loeschen}
        titel="Benutzer löschen?"
        nachricht={`„${loeschen?.benutzername}" wird dauerhaft gelöscht. Alternativ kannst du das Konto nur deaktivieren.`}
        bestaetigenText="Löschen"
        gefaehrlich
        onConfirm={loeschenBestaetigt}
        onCancel={() => setLoeschen(null)}
      />
    </div>
  )
}
