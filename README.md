# Gleisbau-CRM

> CRM / ERP-Prototyp für ein Gleisbau-Unternehmen — Kunden, Projekte, Personal,
> Maschinen, Zeiterfassung, Bautagesberichte und Rechnungen in einer Anwendung.

**Version:** v1.0 (Prototyp)

---

## Über das Projekt

Gleisbau-CRM bündelt den operativen Alltag eines mittelständischen
Gleisbau-Betriebs in einer einzigen Web-Anwendung:

- **Stammdaten** für Kunden, Ansprechpartner und Mitarbeiter
- **Projektsteuerung** mit Auftragsdaten, Budget, Zeitraum, Kanban-Board
  und Personal-/Maschinen-Zuordnung
- **Ressourcenverwaltung** für Maschinen (Wartung, TÜV)
- **Bautagesberichte** dokumentieren Einsätze pro Projekt — inklusive
  mobilem Melde-Formular (`/melden`) für Feld-Mitarbeiter mit eigenem
  Login, Touch-Unterschriften, Nachtschicht-Erfassung und Offline-Modus
- **Montage-Serien**: mehrtägige Einsätze werden gruppiert, Folgeberichte
  mit Vortageswerten vorbefüllt
- **Zeiterfassung** mit Stundenzettel, Wochenansicht, CSV-Import/-Export
- **Rechnungen mit E-Rechnungs-Unterstützung** (gesetzliche
  E-Rechnungspflicht): lückenloser Nummernkreis, XRechnung-Export,
  Empfang und Parsen eingehender E-Rechnungen — Details unten
- **Login & Rollen** (admin, bauleiter, sachbearbeiter, feld) mit JWT,
  Audit-Spalten (wer hat angelegt/geändert) und Benutzerverwaltung
- **Dark Mode**, globale Suche (Cmd/Strg+K), Dashboard-KPIs

Die Anwendung richtet sich an Bauleiter, Projektleiter und kaufmännische
Sachbearbeiter im Gleisbau, denen heute Excel-Listen und Papierordner
nicht mehr reichen.

---

## E-Rechnung (Rechnungsmodul)

Hintergrund: In Deutschland müssen Unternehmen im B2B-Bereich seit
**01.01.2025** E-Rechnungen (EN 16931) **empfangen** können; die Pflicht
zur **Ausstellung** folgt ab 2027 (Umsatz > 800 T€) bzw. 2028 (alle).

Das Modul unter **Finanzen → Rechnungen** deckt beides ab:

- **Entwurf → Festschreiben**: Die Rechnungsnummer (`RE-JJJJ-NNNN`) wird
  erst beim Festschreiben vergeben — lückenloser Nummernkreis pro Jahr.
  Festgeschriebene Rechnungen sind unveränderbar und nicht löschbar,
  nur stornierbar (GoBD-Prinzip).
- **USt-Berechnung serverseitig** je Steuersatz (19/7/0 %), Fälligkeit
  aus dem Zahlungsziel.
- **XRechnung-Export**: `GET /rechnungen/{id}/xrechnung` liefert eine
  XRechnung 3.0 (CII-Syntax, EN 16931) als XML — inkl. Verkäufer-Kontakt,
  Zahlungsdaten (IBAN) und Einheiten-Codes nach UN/ECE Rec 20.
- **Eingang**: XML-Upload empfangener E-Rechnungen (XRechnung/CII oder
  UBL); Lieferant, Nummer, Datum und Betrag werden geparst, das
  Original-XML wird gespeichert.
- **Firmendaten** (Absender) pflegt der Admin unter Einstellungen —
  ohne vollständige Firmendaten verweigert der XRechnung-Export.

> Erzeugte XML-Dateien lassen sich mit dem
> [KoSIT-Validator](https://erechnungsvalidator.service-bw.de/) gegen den
> XRechnung-Standard prüfen. Keine Steuerberatung — die erste echte
> Rechnung bitte fachlich prüfen lassen.

---

## Tech Stack

### Backend
- **Python 3.13** mit **FastAPI 0.135**
- **SQLAlchemy 2.0** als ORM
- **Pydantic 2** für Schema-Validierung
- **PyJWT** für Login-Tokens (Rollen: admin, bauleiter, sachbearbeiter, feld)
- **SQLite** lokal (`gleisbau.db`) · **PostgreSQL 16** im Docker-Deployment
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
│   ├── main.py                  App-Entrypoint, CORS, Migrationen, Router
│   ├── database.py              Engine, Session, get_db-Dependency
│   ├── auth.py                  JWT, Passwort-Hashing, Rollen-Guards
│   ├── models.py                SQLAlchemy-Modelle aller Tabellen
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
├── deploy/                      nginx-Konfiguration, Backup-Skript
├── docker-compose.yml           Produktions-Setup (Postgres + Backend + nginx)
├── DEPLOY.md                    Deployment-Anleitung (Hetzner)
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
| **Dokumente** | `/dokumente` | Verträge & Unterlagen je Projekt |
| **Rechnungen** | `/rechnungen` | Ausgang mit XRechnung-Export, Eingang per XML-Upload |
| **Melden** | `/melden` | Mobiles Bautagesbericht-Formular für Feld-Konten |

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

- **Kein Datei-Upload** für Dokumente — momentan nur Metadaten (Typ,
  Betrag, Status). PDFs müssen anderswo abgelegt werden; bei
  Eingangsrechnungen wird immerhin das Original-XML gespeichert.
- **Kein Soft-Delete** — Löschen ist endgültig (Ausnahme:
  festgeschriebene Rechnungen sind gegen Löschen gesperrt).
- **Keine Mehrsprachigkeit** — Oberfläche ist Deutsch.
- **Keine automatisierte Testsuite** — getestet wird manuell und per
  TestClient-Skripten.
- **XRechnung ohne eingebettete Validierung** — erzeugte XMLs sollten
  vor dem Erstversand einmal durch den KoSIT-Validator laufen.
- Das beim ersten Start angelegte **Admin-Konto** (`admin`) hat ein
  bekanntes Standard-Passwort — nach der Installation sofort ändern.

---

## Lizenz

Internes Projekt — alle Rechte vorbehalten.
