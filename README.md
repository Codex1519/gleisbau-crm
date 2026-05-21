# Gleisbau-CRM

> CRM / ERP-Prototyp für ein Gleisbau-Unternehmen — Kunden, Projekte, Personal,
> Maschinen, Zeiterfassung und Dokumente in einer Anwendung.

**Version:** v0.1 (Prototyp)

---

## Über das Projekt

Gleisbau-CRM bündelt den operativen Alltag eines mittelständischen
Gleisbau-Betriebs in einer einzigen Web-Anwendung:

- **Stammdaten** für Kunden, Ansprechpartner und Mitarbeiter
- **Projektsteuerung** mit Auftragsdaten, Budget und Zeitraum
- **Ressourcenverwaltung** für Maschinen (Wartung, TÜV)
- **Bautagesberichte** dokumentieren Einsätze pro Projekt
- **Zeiterfassung** verbindet Mitarbeiter und Projekt, mit
  automatischer Stundenberechnung und Stundenzettel-Ansicht
- **Qualifikationen** und **Notfallkontakte** pro Mitarbeiter
- **Dokumente** (Rechnungen, Verträge etc.) je Projekt

Die Anwendung richtet sich an Bauleiter, Projektleiter und kaufmännische
Sachbearbeiter im Gleisbau, denen heute Excel-Listen und Papierordner
nicht mehr reichen.

---

## Tech Stack

### Backend
- **Python 3.13** mit **FastAPI 0.135**
- **SQLAlchemy 2.0** als ORM
- **Pydantic 2** für Schema-Validierung
- **SQLite** als Datenbank (`gleisbau.db`)
- **Uvicorn** als ASGI-Server

### Frontend
- **React 19** + **Vite 8**
- **React Router 7** für SPA-Navigation
- Reines CSS mit zentralem Design-System (keine UI-Bibliothek)
- Inline-SVG-Icons (keine Icon-Library)

---

## Voraussetzungen

- **Node.js** ≥ 20 (entwickelt mit 24.x)
- **Python** ≥ 3.11 (entwickelt mit 3.13)
- **pip** und das mitgelieferte `venv`-Modul

---

## Setup & Starten

Klone das Repository und navigiere ins Projektverzeichnis:

```bash
git clone git@github.com:Codex1519/gleisbau-crm.git
cd gleisbau-crm
```

### Backend starten

```bash
cd backend

# Einmalig: virtuelle Umgebung anlegen
python3 -m venv venv

# Aktivieren (macOS / Linux)
source venv/bin/activate
# Windows:
# venv\Scripts\activate

# Abhängigkeiten installieren
pip install -r requirements.txt

# Server starten (Auto-Reload bei Dateiänderungen)
uvicorn main:app --reload
```

Das Backend läuft anschließend auf **http://localhost:8000**.
Beim ersten Start wird `gleisbau.db` automatisch angelegt.

### Frontend starten

In einem **zweiten Terminal**:

```bash
cd frontend
npm install
npm run dev
```

Das Frontend ist unter **http://localhost:5173** erreichbar.

> Hinweis: Das Backend muss zusätzlich laufen — das Frontend ruft direkt
> `http://localhost:8000` auf. CORS für `localhost:5173` ist in `main.py`
> bereits freigeschaltet.

---

## Projektstruktur

```
gleisbau-crm/
├── backend/                     FastAPI + SQLAlchemy
│   ├── main.py                  App-Entrypoint, CORS, Router-Registrierung
│   ├── database.py              Engine, Session, get_db-Dependency
│   ├── models.py                SQLAlchemy-Modelle aller 12 Tabellen
│   ├── schemas.py               Pydantic Create/Update-Schemas
│   ├── routers/                 Ein Router je Modul (CRUD-Endpunkte)
│   ├── requirements.txt
│   └── gleisbau.db              SQLite-DB (wird beim ersten Start erzeugt)
│
├── frontend/                    React + Vite
│   ├── src/
│   │   ├── main.jsx             Einstiegspunkt + BrowserRouter
│   │   ├── App.jsx              Routing (Layout + alle Modul-Routen)
│   │   ├── App.css              Design-System (Tokens, Komponenten)
│   │   ├── api.js               Fetch-Wrapper (GET/POST/PUT/DELETE)
│   │   ├── modules.js           Modul-Konfiguration (Felder, Sektionen, FK)
│   │   ├── components/          Layout, Sektion, FormField, Modal, Icons, …
│   │   ├── contexts/            Toast-Context
│   │   ├── lib/                 Helper (FK-Loader, Zeitberechnung)
│   │   └── pages/               ListPage, FormPage, DetailPage + Custom-Pages
│   ├── package.json
│   └── vite.config.js
│
├── README.md                    diese Datei
└── Datenbankschema.png          ER-Diagramm
```

---

## Verfügbare Module

| Modul | Pfad im UI | Zweck |
|---|---|---|
| **Kunden** | `/kunden` | Firmenstammdaten + Anschrift |
| **Ansprechpartner** | `/ansprechpartner` | Personen je Kunde |
| **Personal** | `/personal` | Mitarbeiterstammdaten |
| **Projekte** | `/projekte` | Aufträge, Budget, Zeitraum |
| **Maschinen** | `/maschinen` | Fuhrpark, TÜV, Wartung |
| **Zeiterfassungen** | `/zeiterfassungen` | Stundenzettel mit Filter + Live-Summe |
| **Bautagesberichte** | `/bautagesberichte` | Tageseinsatz je Projekt |
| **Qualifikationen** | `/qualifikationen` | Zertifikate je Mitarbeiter |
| **Notfallkontakte** | `/notfallkontakte` | Notfallnummern je Mitarbeiter |
| **Dokumente** | `/dokumente` | Rechnungen, Verträge je Projekt |

Jedes Modul hat zwei Ebenen:

- **Listenansicht** mit Volltextsuche und „+ Neu anlegen"-Button
- **Detailseite** mit allen Feldern, In-Place-**Bearbeiten** und Löschen
  (mit Bestätigungsdialog)

Die Detailseiten für **Kunden**, **Personal** und **Projekte** zeigen
zusätzlich verknüpfte Daten („Akten"-Sicht): Ansprechpartner, Projekte,
Dokumente, Qualifikationen, Notfallkontakte, gebuchte Stunden, …

---

## API-Dokumentation

FastAPI generiert automatisch eine interaktive OpenAPI-Doku.

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

Pro Modul stehen die üblichen REST-Endpunkte zur Verfügung:

```
GET    /<modul>          Liste aller Einträge
GET    /<modul>/{id}     Einzelner Eintrag
POST   /<modul>          Neu anlegen
PUT    /<modul>/{id}     Aktualisieren
DELETE /<modul>/{id}     Löschen
```

Beispiel: `GET http://localhost:8000/kunden`

---

## Datenbankschema

![Datenbankschema](Datenbankschema.png)

---

## Bekannte Limitierungen (Prototyp-Status)

Dieser Prototyp dient zum Validieren der UX-Konzepte und der
Datenarchitektur. Für den produktiven Einsatz fehlen bewusst:

- **Keine Authentifizierung / kein Login** — jeder mit Netzwerk-Zugriff
  hat volle Schreibrechte. Vor Produktiv-Einsatz dringend ergänzen.
- **SQLite** statt PostgreSQL — gut für lokale Entwicklung, aber kein
  Concurrency-Konzept für mehrere Schreib-Clients.
- **Keine Datei-Uploads** für Dokumente — momentan nur Metadaten (Typ,
  Betrag, Status). Tatsächliche PDFs müssen anderswo abgelegt werden.
- **Keine Audit-Trail / kein Soft-Delete** — Löschen ist endgültig.
- **Keine Berechtigungen** pro Rolle.
- **Keine Mehrsprachigkeit** — Oberfläche ist Deutsch.
- **Tests** sind nicht enthalten.
- **Join-Tabellen** `projekt_personal` und `projekt_maschinen` existieren
  in der DB, sind aber noch nicht über die API ansprechbar.
  Personal-Zuordnung erfolgt momentan nur indirekt über
  Bautagesberichte und Zeiterfassungen.

---

## Lizenz

Internes Projekt — alle Rechte vorbehalten.
