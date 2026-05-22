from pydantic import BaseModel
from datetime import date, datetime
from decimal import Decimal


# ---------- Kunden ----------
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
    hausnummer: str | None = None
    plz: str | None = None
    ort: str | None = None
    telefon: str | None = None
    email: str | None = None


# ---------- Maschinen ----------
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


# ---------- Personal ----------
class PersonalCreate(BaseModel):
    nachname: str
    vorname: str
    geburtsdatum: date | None = None
    strasse: str | None = None
    hausnummer: str | None = None
    plz: str | None = None
    ort: str | None = None
    telefon: str | None = None
    position: str | None = None
    einstellungsdatum: date | None = None
    crm_rolle: str | None = None
    kranktage: int | None = 0
    urlaubstage: int | None = 0


class PersonalUpdate(BaseModel):
    nachname: str | None = None
    vorname: str | None = None
    geburtsdatum: date | None = None
    strasse: str | None = None
    hausnummer: str | None = None
    plz: str | None = None
    ort: str | None = None
    telefon: str | None = None
    position: str | None = None
    einstellungsdatum: date | None = None
    crm_rolle: str | None = None
    kranktage: int | None = None
    urlaubstage: int | None = None


# ---------- Projekte ----------
class ProjektCreate(BaseModel):
    kunden_id: int
    name: str
    beschreibung: str | None = None
    auftragsnummer: str | None = None
    budget_geplant: Decimal | None = None
    budget_tatsaechlich: Decimal | None = None
    start_datum: date | None = None
    end_datum: date | None = None
    status: str | None = None


class ProjektUpdate(BaseModel):
    kunden_id: int | None = None
    name: str | None = None
    beschreibung: str | None = None
    auftragsnummer: str | None = None
    budget_geplant: Decimal | None = None
    budget_tatsaechlich: Decimal | None = None
    start_datum: date | None = None
    end_datum: date | None = None
    status: str | None = None


# ---------- Ansprechpartner ----------
class AnsprechpartnerCreate(BaseModel):
    kunden_id: int
    nachname: str
    vorname: str | None = None
    telefon: str | None = None
    email: str | None = None
    position: str | None = None


class AnsprechpartnerUpdate(BaseModel):
    kunden_id: int | None = None
    nachname: str | None = None
    vorname: str | None = None
    telefon: str | None = None
    email: str | None = None
    position: str | None = None


# ---------- Notfallkontakte ----------
class NotfallkontaktCreate(BaseModel):
    personal_id: int
    nachname: str
    vorname: str
    telefon: str
    beziehung: str | None = None


class NotfallkontaktUpdate(BaseModel):
    personal_id: int | None = None
    nachname: str | None = None
    vorname: str | None = None
    telefon: str | None = None
    beziehung: str | None = None


# ---------- Qualifikationen ----------
class QualifikationCreate(BaseModel):
    personal_id: int
    bezeichnung: str
    gueltig_bis: date | None = None


class QualifikationUpdate(BaseModel):
    personal_id: int | None = None
    bezeichnung: str | None = None
    gueltig_bis: date | None = None


# ---------- Zeiterfassungen ----------
class ZeiterfassungCreate(BaseModel):
    personal_id: int
    projekt_id: int
    start_zeit: datetime
    end_zeit: datetime
    pause_minuten: int | None = 0


class ZeiterfassungUpdate(BaseModel):
    personal_id: int | None = None
    projekt_id: int | None = None
    start_zeit: datetime | None = None
    end_zeit: datetime | None = None
    pause_minuten: int | None = None


# ---------- Dokumente ----------
class DokumentCreate(BaseModel):
    projekt_id: int
    typ: str
    betrag: Decimal | None = None
    status: str | None = None
    ausstellungsdatum: date | None = None
    faelligkeitsdatum: date | None = None


class DokumentUpdate(BaseModel):
    projekt_id: int | None = None
    typ: str | None = None
    betrag: Decimal | None = None
    status: str | None = None
    ausstellungsdatum: date | None = None
    faelligkeitsdatum: date | None = None


# ---------- Bautagesberichte ----------
class BautagesberichtCreate(BaseModel):
    projekt_id: int
    personal_id: int
    datum: date
    wetter: str | None = None
    beschreibung: str | None = None


class BautagesberichtUpdate(BaseModel):
    projekt_id: int | None = None
    personal_id: int | None = None
    datum: date | None = None
    wetter: str | None = None
    beschreibung: str | None = None
