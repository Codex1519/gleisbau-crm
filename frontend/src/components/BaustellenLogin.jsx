import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Sektion } from './Sektion'
import { Spinner } from './Spinner'
import { Alert } from './Alert'
import { STANDARD_ROLLEN } from './PersonalAnwesendFeld'

// Baustellen-Login direkt aus der Personalakte anlegen (nur Admins).
// Erstellt ein Benutzer-Konto mit Rolle "feld" und verknüpft es
// automatisch mit diesem Mitarbeiter — kein Umweg über die
// Benutzerverwaltung nötig.
export function BaustellenLogin({ person }) {
  const { istAdmin } = useAuth()
  const toast = useToast()

  const [konten, setKonten] = useState(null)
  const [name, setName] = useState('')
  const [passwort, setPasswort] = useState('')
  const [lege, setLege] = useState(false)
  const [fehler, setFehler] = useState(null)

  useEffect(() => {
    if (!istAdmin || !person) return
    api
      .list('benutzer')
      .then(setKonten)
      .catch(() => setKonten([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [istAdmin, person?.id])

  // Benutzernamen-Vorschlag aus dem Namen, z. B. "s.arsnukajev"
  useEffect(() => {
    if (!person) return
    const vorschlag = [person.vorname?.[0], person.nachname]
      .filter(Boolean)
      .join('.')
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9.]/g, '')
    setName(vorschlag)
    setPasswort('')
    setFehler(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [person?.id])

  if (!istAdmin || !person) return null

  const konto = konten?.find((b) => b.personal_id === person.id)
  const qualifiziert = STANDARD_ROLLEN.some((q) =>
    (person.position || '').toLowerCase().includes(q.toLowerCase())
  )

  async function anlegen(e) {
    e.preventDefault()
    setFehler(null)
    setLege(true)
    try {
      const neu = await api.create('benutzer', {
        benutzername: name.trim(),
        passwort,
        rolle: 'feld',
        personal_id: person.id,
      })
      setKonten((k) => [...(k || []), neu])
      toast.erfolg(`Baustellen-Login „${neu.benutzername}" erstellt`)
      setPasswort('')
    } catch (err) {
      setFehler(err.message)
    } finally {
      setLege(false)
    }
  }

  return (
    <Sektion titel="Baustellen-Login">
      {!qualifiziert && (
        <Alert typ="info" titel="Hinweis">
          Die Position „{person.position || '—'}" ist keine
          Baustellen-Qualifikation (Polier, Vorarbeiter, Facharbeiter,
          Bauhelfer) — das Melde-Formular würde diesen Mitarbeiter
          abweisen. Zuerst die Position anpassen.
        </Alert>
      )}

      {konten === null ? (
        <Spinner />
      ) : konto ? (
        <div className="bl-vorhanden">
          Konto <strong>{konto.benutzername}</strong> · Rolle{' '}
          {konto.rolle === 'feld' ? 'Baustelle' : konto.rolle} ·{' '}
          {konto.aktiv ? (
            <span className="bl-aktiv">aktiv</span>
          ) : (
            <span className="bl-inaktiv">deaktiviert</span>
          )}{' '}
          — Passwort zurücksetzen oder deaktivieren in der{' '}
          <Link to="/benutzer">Benutzerverwaltung</Link>. Anmeldung unter{' '}
          <strong>/melden</strong>.
        </div>
      ) : (
        <>
          {fehler && <Alert titel="Konnte nicht angelegt werden">{fehler}</Alert>}
          <form onSubmit={anlegen}>
            <div
              className="felder"
              style={{ gridTemplateColumns: '1fr 1fr auto', marginBottom: 0 }}
            >
              <label className="feld">
                <span className="feld-label">
                  Benutzername<span className="feld-required">*</span>
                </span>
                <input
                  type="text"
                  required
                  autoCapitalize="none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label className="feld">
                <span className="feld-label">
                  Passwort (min. 8 Zeichen)<span className="feld-required">*</span>
                </span>
                <input
                  type="text"
                  required
                  minLength={8}
                  placeholder="wird dem Mitarbeiter mitgeteilt"
                  value={passwort}
                  onChange={(e) => setPasswort(e.target.value)}
                />
              </label>
              <div className="feld" style={{ justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={lege || !name.trim() || passwort.length < 8}
                >
                  {lege ? <Spinner /> : 'Login erstellen'}
                </button>
              </div>
            </div>
          </form>
          <p className="bl-hilfe">
            Erstellt ein Konto mit Rolle „Baustelle" (nur Bautagesberichte)
            und verknüpft es automatisch mit diesem Mitarbeiter. Die
            Zugangsdaten danach einfach weitergeben — Anmeldung unter{' '}
            <strong>gleisbau-crm.duckdns.org/melden</strong>.
          </p>
        </>
      )}
    </Sektion>
  )
}
