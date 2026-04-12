from pydantic import BaseModel
from datetime import date

class KundeCreate(BaseModel):
    name: str
    strasse: str
    hausnummer: str
    plz: str
    ort: str
    telefon: str
    email: str

class KundeUpdate(BaseModel):
    name: str | None = None
    strasse: str | None = None
    hausnummer: str| None = None
    plz: str | None = None
    ort: str | None = None
    telefon: str | None = None
    email: str | None = None

class MaschineCreate(BaseModel):
    typ: str
    baujahr: int
    status: str
    tuev_datum: date
    kennzeichen: str
    naechste_wartung: date

class MaschineUpdate(BaseModel):
    typ: str | None = None
    baujahr: int | None = None
    status: str | None = None
    tuev_datum: date | None = None
    kennzeichen: str | None = None
    naechste_wartung: date | None = None