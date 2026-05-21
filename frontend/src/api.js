// Zentrale API-Konfiguration für das Gleisbau-CRM
export const API_BASE = 'http://localhost:8000'

async function handle(res) {
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`${res.status} ${res.statusText} – ${text}`)
  }
  // DELETE kann leere Antwort liefern
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  list: (pfad) => fetch(`${API_BASE}/${pfad}`).then(handle),
  get: (pfad, id) => fetch(`${API_BASE}/${pfad}/${id}`).then(handle),
  create: (pfad, data) =>
    fetch(`${API_BASE}/${pfad}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handle),
  update: (pfad, id, data) =>
    fetch(`${API_BASE}/${pfad}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handle),
  remove: (pfad, id) =>
    fetch(`${API_BASE}/${pfad}/${id}`, { method: 'DELETE' }).then(handle),
}
