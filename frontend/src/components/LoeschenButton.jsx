import { useAuth } from '../contexts/AuthContext'
import { IconTrash } from './Icons'

// Lösch-Button, der sich für Sachbearbeiter selbst ausblendet
// (das Backend verweigert das Löschen zusätzlich mit 403).
export function LoeschenButton({ onClick, children = 'Löschen' }) {
  const { darfLoeschen } = useAuth()
  if (!darfLoeschen) return null
  return (
    <button type="button" className="btn btn-danger" onClick={onClick}>
      <IconTrash />
      {children}
    </button>
  )
}
