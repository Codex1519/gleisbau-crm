// Sende-Warteschlange für Bautagesberichte ohne Netz.
// Fehlgeschlagene POSTs landen im localStorage und werden automatisch
// nachgesendet, sobald wieder Verbindung besteht.

const QUEUE_KEY = 'gleisbau_feld_queue'

export function queueLaenge() {
  return leseQueue().length
}

function leseQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY)) || []
  } catch {
    return []
  }
}

function schreibeQueue(liste) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(liste))
}

export function pushQueue(payload) {
  const liste = leseQueue()
  liste.push({ payload, erstellt: new Date().toISOString() })
  schreibeQueue(liste)
  return liste.length
}

// Versucht alle wartenden Berichte zu senden (Reihenfolge bleibt erhalten).
// senden(payload) muss die Response zurückgeben. Bricht beim ersten
// Netzfehler ab (weiter warten); 4xx-Antworten werden verworfen, damit
// ein kaputter Bericht die Queue nicht für immer blockiert.
export async function flushQueue(senden) {
  const liste = leseQueue()
  let gesendet = 0
  let verworfen = 0

  while (liste.length > 0) {
    const { payload } = liste[0]
    try {
      const r = await senden(payload)
      if (r.ok) {
        gesendet++
        liste.shift()
      } else if (r.status >= 400 && r.status < 500 && r.status !== 401) {
        // dauerhaft ungültig (z. B. Projekt gelöscht) — verwerfen
        verworfen++
        liste.shift()
      } else {
        break // 401 (Token abgelaufen) oder 5xx: später erneut
      }
    } catch {
      break // kein Netz: später erneut
    }
  }

  schreibeQueue(liste)
  return { gesendet, verworfen, verbleibend: liste.length }
}

export function istNetzfehler(err) {
  return /Failed to fetch|NetworkError|Load failed/i.test(
    String(err?.message || err)
  )
}
