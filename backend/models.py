from sqlalchemy import COlumn, Integer, String, DateTime
from sqlalchemy.sql import func  
from database import Base


class Kunde(Base):
    __tablename__ = "Kunden"
    id = Column(Integer, primary_key=True)
    name = Column(String(50))