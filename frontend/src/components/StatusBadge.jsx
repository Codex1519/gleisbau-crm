// Farbiges Pill-Badge für enum-Werte (z. B. Projekt-Status).
// Findet die Option per `value` und nutzt deren `farbe`.
// Erlaubte Farben (CSS-Klassen): grau, blau, gelb, gruen, rot

export function StatusBadge({ optionen, value }) {
  if (!value) {
    return <span className="status-badge farbe-grau">—</span>
  }
  const opt = optionen?.find((o) => o.value === value)
  const farbe = opt?.farbe || 'grau'
  const label = opt?.label || value
  return <span className={`status-badge farbe-${farbe}`}>{label}</span>
}
