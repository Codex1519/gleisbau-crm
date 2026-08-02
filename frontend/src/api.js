// Zentrale API-Konfiguration für das Gleisbau-CRM
// Lokal: localhost:8000 · Im Docker-Build: VITE_API_BASE=/api (nginx-Proxy)
export const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

const TOKEN_KEY = 'gleisbau_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

// Häufige Pydantic-Meldungen auf Deutsch
const MELDUNGEN = {
  'Field required': 'Pflichtfeld fehlt',
  'Input should be a valid integer': 'Muss eine ganze Zahl sein',
  'Input should be a valid number': 'Muss eine Zahl sein',
  'Input should be a valid string': 'Muss ein Text sein',
  'Input should be a valid date': 'Ungültiges Datum',
}

// Technische Feldnamen lesbar machen: "kunden_id" -> "Kunde"
function feldLabel(name) {
  const bekannt = {
    kunden_id: 'Kunde',
    personal_id: 'Mitarbeiter',
    projekt_id: 'Projekt',
    maschinen_id: 'Maschine',
    ersteller_id: 'Ersteller',
  }
  return bekannt[name] ?? name
}

function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function handle(res) {
  // Sitzung abgelaufen / kein Login -> zurück zur Login-Seite
  // /melden (Feld-Formular) ist öffentlich und nutzt keinen CRM-Login —
  // ein abgelaufener alter Token darf dort NICHT zum Login umleiten.
  const oeffentlich =
    window.location.pathname.startsWith('/login') ||
    window.location.pathname.startsWith('/melden')
  if (res.status === 401 && !oeffentlich) {
    setToken(null)
    window.location.href = '/login'
    return new Promise(() => {}) // Navigation läuft, nichts mehr auflösen
  }
  if (!res.ok) {
    let text = await res.text().catch(() => '')
    // FastAPI-Fehler lesbar machen statt rohem JSON
    try {
      const json = JSON.parse(text)
      if (typeof json.detail === 'string') {
        // z.B. "Benutzername oder Passwort falsch"
        text = json.detail
      } else if (Array.isArray(json.detail)) {
        // Pydantic-Validierungsfehler: [{loc, msg, ...}, ...]
        text = json.detail
          .map((f) => {
            const feld = f.loc?.filter((p) => p !== 'body').join(' → ')
            const msg = MELDUNGEN[f.msg] ?? f.msg
            return feld ? `${feldLabel(feld)}: ${msg}` : msg
          })
          .join(' · ')
      }
    } catch {
      /* Antwort ist kein JSON (z. B. nginx-HTML-Fehlerseite) */
    }
    // Rohes HTML nie anzeigen — stattdessen verständliche Meldung
    if (/<\s*(!doctype|html|head|body)/i.test(text)) {
      text =
        res.status === 502 || res.status === 503 || res.status === 504
          ? 'Server ist gerade nicht erreichbar — bitte einen Moment warten und neu laden.'
          : `Fehler ${res.status} (${res.statusText})`
    }
    throw new Error(text || `Fehler ${res.status} (${res.statusText})`)
  }
  // DELETE kann leere Antwort liefern
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  list: (pfad) =>
    fetch(`${API_BASE}/${pfad}`, { headers: authHeaders() }).then(handle),
  get: (pfad, id) =>
    fetch(`${API_BASE}/${pfad}/${id}`, { headers: authHeaders() }).then(handle),
  create: (pfad, data) =>
    fetch(`${API_BASE}/${pfad}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data),
    }).then(handle),
  update: (pfad, id, data) =>
    fetch(`${API_BASE}/${pfad}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data),
    }).then(handle),
  remove: (pfad, id) =>
    fetch(`${API_BASE}/${pfad}/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }).then(handle),
}

export const authApi = {
  login: (benutzername, passwort) =>
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ benutzername, passwort }),
    }).then(handle),
  me: () => fetch(`${API_BASE}/auth/me`, { headers: authHeaders() }).then(handle),
  passwortAendern: (altes_passwort, neues_passwort) =>
    fetch(`${API_BASE}/auth/passwort`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ altes_passwort, neues_passwort }),
    }).then(handle),
}
