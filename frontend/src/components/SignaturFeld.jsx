import { useEffect, useRef } from 'react'

// Touch-Unterschrift auf Canvas (Finger oder Stift, auch Maus).
// Liefert bei jedem Strich-Ende ein PNG als Data-URL über onChange.
// Hintergrund ist immer weiß ("Papier"), Tinte dunkel — sieht im
// hellen wie im dunklen Modus und im PDF-Export korrekt aus.

const TINTE = '#1e293b'

export function SignaturFeld({ wert, onChange, disabled }) {
  const canvasRef = useRef(null)
  const ctxRef = useRef(null)
  const zeichnet = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, rect.width, rect.height)
    ctx.lineWidth = 2.4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = TINTE
    ctxRef.current = ctx

    // Vorhandene Unterschrift wiederherstellen (z. B. nach Zurück)
    if (wert) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height)
      img.src = wert
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function pos(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function start(e) {
    if (disabled) return
    e.preventDefault()
    canvasRef.current.setPointerCapture(e.pointerId)
    zeichnet.current = true
    const { x, y } = pos(e)
    const ctx = ctxRef.current
    ctx.beginPath()
    ctx.moveTo(x, y)
    // Punkt auch bei bloßem Tippen sichtbar machen
    ctx.lineTo(x + 0.1, y + 0.1)
    ctx.stroke()
  }

  function move(e) {
    if (!zeichnet.current) return
    e.preventDefault()
    const { x, y } = pos(e)
    const ctx = ctxRef.current
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  function ende(e) {
    if (!zeichnet.current) return
    zeichnet.current = false
    try {
      canvasRef.current.releasePointerCapture(e.pointerId)
    } catch {
      /* schon freigegeben */
    }
    onChange(canvasRef.current.toDataURL('image/png'))
  }

  function leeren() {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const ctx = ctxRef.current
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, rect.width, rect.height)
    ctx.strokeStyle = TINTE
    onChange('')
  }

  return (
    <div className="signatur">
      <canvas
        ref={canvasRef}
        className="signatur-canvas"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={ende}
        onPointerCancel={ende}
        aria-label="Unterschriftsfeld — mit dem Finger unterschreiben"
      />
      <div className="signatur-leiste">
        <span className="signatur-hinweis">
          {wert ? '✓ Unterschrieben' : 'Mit dem Finger unterschreiben'}
        </span>
        <button
          type="button"
          className="signatur-leeren"
          onClick={leeren}
          disabled={disabled || !wert}
        >
          Neu unterschreiben
        </button>
      </div>
    </div>
  )
}
