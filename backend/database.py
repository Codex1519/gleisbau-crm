from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

# engine zur Aufbau einer Verbindung zur Datenbank
engine = create_engine("sqlite:///gleisbau.db")

# Fundamentales Bindeglied zwischen Python-Klassen und Datenbanktabellen im SQLAlchemy-ORM
Base = declarative_base()

# Dient als Schnittstelle zur Datenbank. Verwaltet Transaktionen, verfolgt Änderungen an Objekten
Session = sessionmaker(engine)