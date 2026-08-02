import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

// Farbschema-Verwaltung: 'hell' | 'dunkel' | 'system'
// Persistiert in localStorage; 'system' folgt der OS-Einstellung live.
// Angewendet wird das Theme als data-theme="dunkel" auf <html> —
// die CSS-Token-Overrides hängen an :root[data-theme='dunkel'].

const THEME_KEY = 'gleisbau_theme'
const ThemeContext = createContext(null)

function systemIstDunkel() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function wendeThemeAn(theme) {
  const dunkel = theme === 'dunkel' || (theme === 'system' && systemIstDunkel())
  if (dunkel) document.documentElement.setAttribute('data-theme', 'dunkel')
  else document.documentElement.removeAttribute('data-theme')
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(
    () => localStorage.getItem(THEME_KEY) || 'system'
  )

  // Theme anwenden + bei 'system' auf OS-Wechsel reagieren
  useEffect(() => {
    wendeThemeAn(theme)
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => wendeThemeAn('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  const setTheme = useCallback((neu) => {
    localStorage.setItem(THEME_KEY, neu)
    setThemeState(neu)
  }, [])

  // Schnell-Umschalter (Topbar): wechselt explizit hell <-> dunkel,
  // ausgehend vom aktuell wirksamen Zustand.
  const toggle = useCallback(() => {
    const aktuellDunkel =
      document.documentElement.getAttribute('data-theme') === 'dunkel'
    setTheme(aktuellDunkel ? 'hell' : 'dunkel')
  }, [setTheme])

  const istDunkel =
    theme === 'dunkel' || (theme === 'system' && systemIstDunkel())

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle, istDunkel }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme außerhalb von <ThemeProvider>')
  return ctx
}
