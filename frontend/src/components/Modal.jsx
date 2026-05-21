import { useEffect } from 'react'

// Bestätigungs-Modal. offen=true rendert; Escape und Backdrop-Klick = onCancel.
export function ConfirmDialog({
  offen,
  titel,
  nachricht,
  bestaetigenText = 'Bestätigen',
  abbrechenText = 'Abbrechen',
  gefaehrlich = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!offen) return
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel?.()
      if (e.key === 'Enter') onConfirm?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [offen, onConfirm, onCancel])

  if (!offen) return null

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel?.()
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-body">
          <div className="modal-title" id="modal-title">
            {titel}
          </div>
          {nachricht && <div className="modal-message">{nachricht}</div>}
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            {abbrechenText}
          </button>
          <button
            type="button"
            className={gefaehrlich ? 'btn btn-danger-solid' : 'btn btn-primary'}
            onClick={onConfirm}
            autoFocus
          >
            {bestaetigenText}
          </button>
        </div>
      </div>
    </div>
  )
}
