import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { IconCheck, IconAlert } from '../components/Icons'

const ToastContext = createContext(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast außerhalb von <ToastProvider>')
  return ctx
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const counter = useRef(0)

  const remove = useCallback((id) => {
    setToasts((ts) => ts.filter((t) => t.id !== id))
  }, [])

  const add = useCallback(
    (text, options = {}) => {
      const { typ = 'success', dauer = 3000 } = options
      const id = ++counter.current
      setToasts((ts) => [...ts, { id, text, typ }])
      if (dauer > 0) setTimeout(() => remove(id), dauer)
      return id
    },
    [remove]
  )

  const erfolg = useCallback((text, dauer) => add(text, { typ: 'success', dauer }), [add])
  const fehler = useCallback((text, dauer) => add(text, { typ: 'error', dauer }), [add])

  return (
    <ToastContext.Provider value={{ add, erfolg, fehler, remove }}>
      {children}
      <ToastHost toasts={toasts} />
    </ToastContext.Provider>
  )
}

function ToastHost({ toasts }) {
  if (toasts.length === 0) return null
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast-${t.typ}`}
          role={t.typ === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          {t.typ === 'error' ? <IconAlert /> : <IconCheck />}
          <div>{t.text}</div>
        </div>
      ))}
    </div>
  )
}
