from pydantic import BaseModel

class KundeCreate(BaseModel):
    name: str
    strasse: str
    hausnummer: str
    plz: str
    ort: str
    telefon: str
    email: str

