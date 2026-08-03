from sqlalchemy import Column, Integer, String, DateTime, Text, Numeric, Date, ForeignKey
from sqlalchemy.sql import func  
from database import Base

class Kunde(Base):
    __tablename__ = "kunden"
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    strasse = Column(String(150))
    hausnummer = Column(String(10))
    plz = Column(String(5))
    ort = Column(String(100))
    telefon = Column(String(20))
    email = Column(String(254))
    erstellt_von = Column(String(50))
    geaendert_von = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Maschine(Base):
    __tablename__ = "maschinen"
    id = Column(Integer, primary_key=True)
    typ = Column(String(100))
    baujahr = Column(Integer)
    status = Column(String(50))
    tuev_datum = Column(Date)
    kennzeichen = Column(String(50))
    naechste_wartung = Column(Date)
    erstellt_von = Column(String(50))
    geaendert_von = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Personal(Base):
    __tablename__ = "personal"
    id = Column(Integer, primary_key=True)
    nachname = Column(String(100))
    vorname = Column(String(100))
    geburtsdatum = Column(Date)
    strasse = Column(String(150))
    hausnummer = Column(String(10))
    plz = Column(String(5))
    ort = Column(String(100))
    telefon = Column(String(20))
    position = Column(String(100))
    einstellungsdatum = Column(Date)
    crm_rolle = Column(String(50))
    kranktage = Column(Integer)
    urlaubstage = Column(Integer)
    erstellt_von = Column(String(50))
    geaendert_von = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Projekt(Base):
    __tablename__ = "projekte"
    id = Column(Integer, primary_key=True)
    kunden_id = Column(Integer, ForeignKey("kunden.id"))
    name = Column(String(100))
    beschreibung = Column(Text)
    auftragsnummer = Column(String(50))
    budget_geplant = Column(Numeric(12, 2))
    budget_tatsaechlich = Column(Numeric(12, 2))
    start_datum = Column(Date)
    end_datum = Column(Date)
    status = Column(String(50))
    erstellt_von = Column(String(50))
    geaendert_von = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Ansprechpartner(Base):
    __tablename__ = "ansprechpartner"
    id = Column(Integer, primary_key=True)
    kunden_id = Column(Integer, ForeignKey("kunden.id"))
    nachname = Column(String(100))
    vorname = Column(String(100))
    telefon = Column(String(20))
    email = Column(String(254))
    position = Column(String(100))
    erstellt_von = Column(String(50))
    geaendert_von = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Notfallkontakt (Base):
    __tablename__ = "notfallkontakte"
    id = Column(Integer, primary_key=True)
    personal_id = Column(Integer, ForeignKey("personal.id"))
    nachname = Column(String(100))
    vorname = Column(String(100))
    telefon = Column(String(20))
    beziehung = Column(String(50))
    erstellt_von = Column(String(50))
    geaendert_von = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Qualifikation(Base):
    __tablename__ = "qualifikationen"
    id = Column(Integer, primary_key=True)
    personal_id = Column(Integer, ForeignKey("personal.id"))
    bezeichnung = Column(String(200))
    gueltig_bis = Column(Date)
    erstellt_von = Column(String(50))
    geaendert_von = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Zeiterfassung(Base):
    __tablename__ = "zeiterfassungen"
    id = Column(Integer, primary_key=True)
    personal_id = Column(Integer, ForeignKey("personal.id"))
    projekt_id = Column(Integer, ForeignKey("projekte.id"))
    start_zeit = Column(DateTime)
    end_zeit = Column(DateTime)
    pause_minuten = Column(Integer)
    erstellt_von = Column(String(50))
    geaendert_von = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Dokument(Base):
    __tablename__ = "dokumente"
    id = Column(Integer, primary_key=True)
    projekt_id = Column(Integer, ForeignKey("projekte.id"))
    typ = Column(String(50))
    betrag = Column(Numeric(12, 2))
    status = Column(String(50))
    ausstellungsdatum = Column(Date)
    faelligkeitsdatum = Column(Date)
    erstellt_von = Column(String(50))
    geaendert_von = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class ProjektPersonal(Base):
    __tablename__ = "projekt_personal"
    projekt_id = Column(Integer, ForeignKey("projekte.id"), primary_key=True)
    personal_id = Column(Integer, ForeignKey("personal.id"), primary_key=True)
    erstellt_von = Column(String(50))
    geaendert_von = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class ProjektMaschine(Base):
    __tablename__ = "projekt_maschinen"
    projekt_id = Column(Integer, ForeignKey("projekte.id"), primary_key=True)
    maschinen_id = Column(Integer, ForeignKey("maschinen.id"), primary_key=True)
    erstellt_von = Column(String(50))
    geaendert_von = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Bautagesbericht(Base):
    __tablename__ = "bautagesberichte"
    id = Column(Integer, primary_key=True)
    projekt_id = Column(Integer, ForeignKey("projekte.id"))
    # Ersteller des Berichts (FK auf personal). personal_id ist die Altlast
    # aus v0.2 und wird per Migration nach ersteller_id übertragen.
    ersteller_id = Column(Integer, ForeignKey("personal.id"))
    personal_id = Column(Integer, ForeignKey("personal.id"))
    datum = Column(Date)
    # Wetter & Bedingungen
    wetter = Column(String(100))
    temperatur = Column(Integer)
    # Baustellenaktivität
    arbeiten_durchgefuehrt = Column(Text)
    personal_anwesend = Column(Text)
    maschinen_eingesetzt = Column(Text)
    materiallieferungen = Column(Text)
    # Besonderheiten
    behinderungen = Column(Text)
    besondere_vorkommnisse = Column(Text)
    # Fortschritt & Notizen
    baufortschritt = Column(Integer)
    bemerkungen = Column(Text)
    # Ort & Arbeitszeit (v0.8 — Feld-Formular)
    ort = Column(String(200))
    # Mehrtägige Einsätze: Berichte mit gleichem Montage-Namen gehören zusammen
    montage = Column(String(200))
    arbeitszeit_von = Column(String(10))
    arbeitszeit_bis = Column(String(10))
    pause_minuten = Column(Integer)
    # Unterschriften (PNG-Data-URLs vom Touch-Canvas)
    unterschrift_auftragnehmer = Column(Text)
    unterschrift_auftraggeber = Column(Text)
    unterschrift_datum = Column(Date)
    # Altlast (v0.2) — bleibt für Bestandsdaten erhalten
    beschreibung = Column(Text)
    erstellt_von = Column(String(50))
    geaendert_von = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Benutzer(Base):
    """Login-Konten (v0.6). Nur Büro-Mitarbeiter brauchen eines —
    die Verknüpfung zu Personal ist deshalb optional."""

    __tablename__ = "benutzer"
    id = Column(Integer, primary_key=True)
    benutzername = Column(String(50), unique=True, nullable=False)
    passwort_hash = Column(String(200), nullable=False)
    # Rollen: 'admin' | 'bauleiter' | 'sachbearbeiter'
    rolle = Column(String(30), nullable=False, default="sachbearbeiter")
    aktiv = Column(Integer, nullable=False, default=1)  # SQLite: 1/0
    personal_id = Column(Integer, ForeignKey("personal.id"), nullable=True)
    erstellt_von = Column(String(50))
    geaendert_von = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

# ---------- Rechnungen (v1.0 — E-Rechnungspflicht) ----------

class Firmendaten(Base):
    """Eigene Firmendaten — Absender aller Ausgangsrechnungen (eine Zeile)."""
    __tablename__ = "firmendaten"
    id = Column(Integer, primary_key=True)
    name = Column(String(200))
    strasse = Column(String(150))
    hausnummer = Column(String(10))
    plz = Column(String(10))
    ort = Column(String(100))
    land = Column(String(2), default="DE")
    ust_id = Column(String(20))        # USt-IdNr. (DE...)
    steuernummer = Column(String(30))
    iban = Column(String(34))
    bic = Column(String(11))
    bank = Column(String(100))
    email = Column(String(254))
    telefon = Column(String(30))
    erstellt_von = Column(String(50))
    geaendert_von = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Rechnung(Base):
    __tablename__ = "rechnungen"
    id = Column(Integer, primary_key=True)
    richtung = Column(String(10), default="ausgang")  # ausgang | eingang
    # Nummer wird erst beim Festschreiben vergeben (lueckenloser Kreis)
    nummer = Column(String(30), unique=True)
    status = Column(String(20), default="entwurf")
    # entwurf -> gestellt -> bezahlt | storniert; eingang: eingegangen -> bezahlt
    kunden_id = Column(Integer, ForeignKey("kunden.id"))
    projekt_id = Column(Integer, ForeignKey("projekte.id"))
    datum = Column(Date)
    leistung_von = Column(Date)
    leistung_bis = Column(Date)
    zahlungsziel_tage = Column(Integer, default=14)
    faellig_am = Column(Date)
    bemerkung = Column(Text)
    # Eingangsrechnungen (empfangene E-Rechnungen)
    lieferant = Column(String(200))
    extern_nummer = Column(String(50))
    betrag = Column(Numeric(12, 2))
    dateiname = Column(String(200))
    xml_roh = Column(Text)
    erstellt_von = Column(String(50))
    geaendert_von = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Rechnungsposition(Base):
    __tablename__ = "rechnungspositionen"
    id = Column(Integer, primary_key=True)
    rechnung_id = Column(Integer, ForeignKey("rechnungen.id"))
    pos = Column(Integer)
    bezeichnung = Column(String(300))
    menge = Column(Numeric(12, 3))
    einheit = Column(String(20))       # Stück, Stunde, Tag, m, m2, m3, t, kg, pauschal
    einzelpreis = Column(Numeric(12, 2))
    ust_satz = Column(Integer, default=19)
    erstellt_von = Column(String(50))
    geaendert_von = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
