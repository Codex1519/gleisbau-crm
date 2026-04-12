from pydantic import BaseModel

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