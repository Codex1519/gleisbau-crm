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
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Qualifikation(Base):
    __tablename__ = "qualifikationen"
    id = Column(Integer, primary_key=True)
    personal_id = Column(Integer, ForeignKey("personal.id"))
    bezeichnung = Column(String(200))
    gueltig_bis = Column(Date)
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
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class ProjektPersonal(Base):
    __tablename__ = "projekt_personal"
    projekt_id = Column(Integer, ForeignKey("projekte.id"), primary_key=True)
    personal_id = Column(Integer, ForeignKey("personal.id"), primary_key=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class ProjektMaschine(Base):
    __tablename__ = "projekt_maschinen"
    projekt_id = Column(Integer, ForeignKey("projekte.id"), primary_key=True)
    maschinen_id = Column(Integer, ForeignKey("maschinen.id"), primary_key=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Bautagesbericht(Base):
    __tablename__ = "bautagesberichte"
    id = Column(Integer, primary_key=True)
    projekt_id = Column(Integer, ForeignKey("projekte.id"))
    personal_id = Column(Integer, ForeignKey("personal.id"))
    datum = Column(Date)
    wetter = Column(String(100))
    beschreibung = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())