import { Fragment } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { MODULE } from './modules'
import { Layout } from './components/Layout'
import { ToastProvider } from './contexts/ToastContext'
import { SearchProvider } from './contexts/SearchContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { Login } from './pages/Login'
import { BenutzerVerwaltung } from './pages/BenutzerVerwaltung'
import { PasswortAendern } from './pages/PasswortAendern'
import { Einstellungen } from './pages/Einstellungen'
import { LadeBlock } from './components/Spinner'
import { Dashboard } from './pages/Dashboard'
import { ListPage } from './pages/ListPage'
import { FormPage } from './pages/FormPage'
import { DetailPage } from './pages/DetailPage'
import { KundeDetail } from './pages/KundeDetail'
import { PersonalDetail } from './pages/PersonalDetail'
import { ProjektDetail } from './pages/ProjektDetail'
import { ZeiterfassungenListe } from './pages/ZeiterfassungenListe'
import { ZeiterfassungNeu } from './pages/ZeiterfassungNeu'
import { BautagesberichteListe } from './pages/BautagesberichteListe'
import { BautagesberichtNeu } from './pages/BautagesberichtNeu'
import { BautagesberichtDetail } from './pages/BautagesberichtDetail'
import { ProjekteListe } from './pages/ProjekteListe'
import './App.css'

// Sondermodule mit individueller Detail-Seite (Akten-Ansicht mit Verknüpfungen).
const CUSTOM_DETAIL = {
  kunden: KundeDetail,
  personal: PersonalDetail,
  projekte: ProjektDetail,
  bautagesberichte: BautagesberichtDetail,
}

// Module mit komplett eigener Listenansicht (statt generischer ListPage).
const CUSTOM_LISTE = {
  zeiterfassungen: ZeiterfassungenListe,
  bautagesberichte: BautagesberichteListe,
  projekte: ProjekteListe,
}

// Module mit komplett eigenem Anlege-Formular (statt generischer FormPage).
const CUSTOM_NEU = {
  zeiterfassungen: ZeiterfassungNeu,
  bautagesberichte: BautagesberichtNeu,
}

// Module ohne aufrufbare Detail-Seite — Einträge sind nur im Kontext sinnvoll.
const KEINE_DETAIL_ROUTE = new Set(['zeiterfassungen'])

// Nur eingeloggte Benutzer — sonst zur Login-Seite.
function RequireAuth({ children }) {
  const { benutzer, laedt } = useAuth()
  if (laedt) return <LadeBlock text="Anmeldung wird geprüft…" />
  if (!benutzer) return <Navigate to="/login" replace />
  return children
}

// Nur Admins — sonst zurück zum Dashboard.
function NurAdmin({ children }) {
  const { istAdmin } = useAuth()
  if (!istAdmin) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
    <ToastProvider>
      <SearchProvider>
        <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/passwort" element={<PasswortAendern />} />
          <Route path="/einstellungen" element={<Einstellungen />} />
          <Route
            path="/benutzer"
            element={
              <NurAdmin>
                <BenutzerVerwaltung />
              </NurAdmin>
            }
          />

          {MODULE.map((m) => {
            const CustomListe = CUSTOM_LISTE[m.key]
            const CustomNeu = CUSTOM_NEU[m.key]
            const CustomDetail = CUSTOM_DETAIL[m.key]

            const listenElement = CustomListe ? (
              <CustomListe />
            ) : (
              <ListPage modulKey={m.key} />
            )
            const neuElement = CustomNeu ? (
              <CustomNeu />
            ) : (
              <FormPage modulKey={m.key} />
            )
            const detailElement = CustomDetail ? (
              <CustomDetail />
            ) : (
              <DetailPage modulKey={m.key} />
            )

            return (
              <Fragment key={m.key}>
                <Route path={`/${m.key}`} element={listenElement} />
                <Route path={`/${m.key}/neu`} element={neuElement} />
                {!KEINE_DETAIL_ROUTE.has(m.key) && (
                  <Route
                    path={`/${m.key}/:id`}
                    element={detailElement}
                  />
                )}
              </Fragment>
            )
          })}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
        </Routes>
      </SearchProvider>
    </ToastProvider>
    </AuthProvider>
    </ThemeProvider>
  )
}
