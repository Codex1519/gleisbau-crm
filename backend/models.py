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

class ProjektPersonal(Base):
    __tablename__ = "projekt_personal"
    projekt_id = Column(Integer, ForeignKey("projekte.id"), primary_key=True)
    personal_id = Column(Integer, ForeignKey("personal.id"), primary_key=True)
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

class ProjektMaschinen(Base):
    __tablename__ = "projekt_maschinen"
    projekt_id = Column(Integer, ForeignKey("projekte.id"), primary_key=True)
    maschinen_id = Column(Integer, ForeignKey("maschinen.id"), primary_key=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())