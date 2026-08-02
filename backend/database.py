import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

# Lokal (Entwicklung): SQLite. Auf dem Server setzt docker-compose
# DATABASE_URL auf PostgreSQL — siehe docker-compose.yml.
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///gleisbau.db")

# engine zur Aufbau einer Verbindung zur Datenbank
# pool_pre_ping: tote Verbindungen (z.B. nach Postgres-Neustart) erkennen
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# Fundamentales Bindeglied zwischen Python-Klassen und Datenbanktabellen im SQLAlchemy-ORM
Base = declarative_base()

# Dient als Schnittstelle zur Datenbank. Verwaltet Transaktionen, verfolgt Änderungen an Objekten
Session = sessionmaker(engine)

def get_db():
    db = Session()
    try:
        yield db
    finally:
        db.close()
