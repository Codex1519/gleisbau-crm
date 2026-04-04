from sqlalchemy import Column, Integer, String, DateTime, Text, Numeric, Date
from sqlalchemy.sql import func  
from database import Base
from sqlalchemy import ForeignKey

class Kunde(Base):
    __tablename__ = "Kunden"
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    straße = Column(String(150))
    hausnummer = Column(String(10))
    plz = Column(String(5))
    ort = Column(String(100))
    telefon = Column(String(20))
    email = Column(String(254))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Projekt(Base):
    __tablename__ = "Projekte"
    id = Column(Integer, primary_key=True)
    kunden_id = Column(Integer, ForeignKey("Kunden.id"))
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