"""Rechnungen (v1.0) — Ausgangsrechnungen mit XRechnung-Export + Eingang.

Gesetzlicher Hintergrund (Deutschland, B2B):
  - seit 01.01.2025: E-Rechnungen müssen EMPFANGEN werden können
  - ab 2027/2028: E-Rechnungen müssen AUSGESTELLT werden (EN 16931)
  - B2G (öffentliche Auftraggeber/DB): XRechnung teils schon Pflicht

Umsetzung hier:
  - Lückenloser Nummernkreis: Nummer (RE-JJJJ-NNNN) wird erst beim
    Festschreiben vergeben; festgeschriebene Rechnungen sind nicht
    löschbar, nur stornierbar (GoBD-Gedanke)
  - Beträge werden serverseitig aus den Positionen berechnet
  - XRechnung 3.0 (CII-Syntax, EN 16931) als XML-Download
  - Eingang: XML-Upload (CII oder UBL), Basisdaten werden geparst
"""

from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP
from xml.etree import ElementTree
from xml.sax.saxutils import escape

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from auth import require_loeschen
from database import get_db
from models import Firmendaten, Kunde, Rechnung, Rechnungsposition

router = APIRouter()

# UN/ECE Rec 20 Einheiten-Codes für XRechnung
EINHEIT_CODES = {
    "Stück": "H87",
    "Stunde": "HUR",
    "Tag": "DAY",
    "m": "MTR",
    "m2": "MTK",
    "m3": "MTQ",
    "t": "TNE",
    "kg": "KGM",
    "pauschal": "C62",
}


# ---------- Schemas ----------

class PositionDaten(BaseModel):
    bezeichnung: str
    menge: float
    einheit: str = "Stück"
    einzelpreis: float
    ust_satz: int = 19


class RechnungCreate(BaseModel):
    kunden_id: int
    projekt_id: int | None = None
    datum: date
    leistung_von: date | None = None
    leistung_bis: date | None = None
    zahlungsziel_tage: int = 14
    bemerkung: str | None = None
    positionen: list[PositionDaten]


class StatusDaten(BaseModel):
    status: str  # bezahlt | storniert


class EingangDaten(BaseModel):
    dateiname: str
    xml: str


class FirmendatenDaten(BaseModel):
    name: str | None = None
    strasse: str | None = None
    hausnummer: str | None = None
    plz: str | None = None
    ort: str | None = None
    land: str | None = None
    ust_id: str | None = None
    steuernummer: str | None = None
    iban: str | None = None
    bic: str | None = None
    bank: str | None = None
    email: str | None = None
    telefon: str | None = None


# ---------- Helfer ----------

def _d(wert) -> Decimal:
    return Decimal(str(wert or 0))


def _runde(wert: Decimal) -> Decimal:
    return wert.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def berechne_summen(positionen) -> dict:
    """Netto, USt je Satz und Brutto aus den Positionen."""
    netto = Decimal("0")
    ust_je_satz: dict[int, Decimal] = {}
    for p in positionen:
        zeile = _runde(_d(p.menge) * _d(p.einzelpreis))
        netto += zeile
        satz = int(p.ust_satz or 0)
        ust_je_satz.setdefault(satz, Decimal("0"))
        ust_je_satz[satz] += zeile
    ust_betraege = {
        satz: _runde(basis * Decimal(satz) / 100)
        for satz, basis in ust_je_satz.items()
    }
    ust_gesamt = sum(ust_betraege.values(), Decimal("0"))
    return {
        "netto": _runde(netto),
        "ust": {
            str(satz): {"basis": str(_runde(basis)), "betrag": str(ust_betraege[satz])}
            for satz, basis in ust_je_satz.items()
        },
        "ust_gesamt": _runde(ust_gesamt),
        "brutto": _runde(netto + ust_gesamt),
    }


def _positionen(db, rechnung_id: int):
    return (
        db.query(Rechnungsposition)
        .filter(Rechnungsposition.rechnung_id == rechnung_id)
        .order_by(Rechnungsposition.pos)
        .all()
    )


def _oeffentlich(db, r: Rechnung) -> dict:
    positionen = _positionen(db, r.id)
    summen = berechne_summen(positionen)
    return {
        "id": r.id,
        "richtung": r.richtung,
        "nummer": r.nummer,
        "status": r.status,
        "kunden_id": r.kunden_id,
        "projekt_id": r.projekt_id,
        "datum": str(r.datum) if r.datum else None,
        "leistung_von": str(r.leistung_von) if r.leistung_von else None,
        "leistung_bis": str(r.leistung_bis) if r.leistung_bis else None,
        "zahlungsziel_tage": r.zahlungsziel_tage,
        "faellig_am": str(r.faellig_am) if r.faellig_am else None,
        "bemerkung": r.bemerkung,
        "lieferant": r.lieferant,
        "extern_nummer": r.extern_nummer,
        "betrag": str(r.betrag) if r.betrag is not None else None,
        "dateiname": r.dateiname,
        "erstellt_von": r.erstellt_von,
        "created_at": str(r.created_at) if r.created_at else None,
        "positionen": [
            {
                "pos": p.pos,
                "bezeichnung": p.bezeichnung,
                "menge": str(p.menge),
                "einheit": p.einheit,
                "einzelpreis": str(p.einzelpreis),
                "ust_satz": p.ust_satz,
                "zeilensumme": str(_runde(_d(p.menge) * _d(p.einzelpreis))),
            }
            for p in positionen
        ],
        "netto": str(summen["netto"]),
        "ust_gesamt": str(summen["ust_gesamt"]),
        "brutto": str(summen["brutto"]),
        "ust": summen["ust"],
    }


def _firmendaten(db) -> Firmendaten:
    fd = db.query(Firmendaten).first()
    if not fd:
        fd = Firmendaten(land="DE")
        db.add(fd)
        db.commit()
        db.refresh(fd)
    return fd


# ---------- Firmendaten ----------

@router.get("/firmendaten")
async def read_firmendaten(db=Depends(get_db)):
    fd = _firmendaten(db)
    return {
        c: getattr(fd, c)
        for c in (
            "name", "strasse", "hausnummer", "plz", "ort", "land",
            "ust_id", "steuernummer", "iban", "bic", "bank", "email", "telefon",
        )
    }


@router.put("/firmendaten")
async def update_firmendaten(daten: FirmendatenDaten, db=Depends(get_db)):
    fd = _firmendaten(db)
    for feld, wert in daten.model_dump(exclude_unset=True).items():
        setattr(fd, feld, wert)
    db.commit()
    return {"message": "Firmendaten gespeichert"}


# ---------- Rechnungen CRUD ----------

@router.get("/rechnungen")
async def read_rechnungen(db=Depends(get_db)):
    return [
        _oeffentlich(db, r)
        for r in db.query(Rechnung).order_by(Rechnung.id.desc()).all()
    ]


@router.post("/rechnungen", status_code=201)
async def create_rechnung(daten: RechnungCreate, db=Depends(get_db)):
    if not daten.positionen:
        raise HTTPException(status_code=422, detail="Mindestens eine Position")
    r = Rechnung(
        richtung="ausgang",
        status="entwurf",
        kunden_id=daten.kunden_id,
        projekt_id=daten.projekt_id,
        datum=daten.datum,
        leistung_von=daten.leistung_von,
        leistung_bis=daten.leistung_bis,
        zahlungsziel_tage=daten.zahlungsziel_tage,
        faellig_am=daten.datum + timedelta(days=daten.zahlungsziel_tage),
        bemerkung=daten.bemerkung,
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    for i, p in enumerate(daten.positionen, start=1):
        db.add(
            Rechnungsposition(
                rechnung_id=r.id, pos=i, bezeichnung=p.bezeichnung,
                menge=p.menge, einheit=p.einheit,
                einzelpreis=p.einzelpreis, ust_satz=p.ust_satz,
            )
        )
    db.commit()
    return _oeffentlich(db, r)


@router.get("/rechnungen/{id}")
async def read_rechnung(id: int, db=Depends(get_db)):
    r = db.query(Rechnung).filter(Rechnung.id == id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Rechnung nicht gefunden")
    return _oeffentlich(db, r)


@router.put("/rechnungen/{id}")
async def update_rechnung(id: int, daten: RechnungCreate, db=Depends(get_db)):
    r = db.query(Rechnung).filter(Rechnung.id == id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Rechnung nicht gefunden")
    if r.status != "entwurf":
        raise HTTPException(
            status_code=422,
            detail="Nur Entwürfe sind änderbar — festgeschriebene Rechnungen ggf. stornieren",
        )
    r.kunden_id = daten.kunden_id
    r.projekt_id = daten.projekt_id
    r.datum = daten.datum
    r.leistung_von = daten.leistung_von
    r.leistung_bis = daten.leistung_bis
    r.zahlungsziel_tage = daten.zahlungsziel_tage
    r.faellig_am = daten.datum + timedelta(days=daten.zahlungsziel_tage)
    r.bemerkung = daten.bemerkung
    db.query(Rechnungsposition).filter(
        Rechnungsposition.rechnung_id == r.id
    ).delete()
    for i, p in enumerate(daten.positionen, start=1):
        db.add(
            Rechnungsposition(
                rechnung_id=r.id, pos=i, bezeichnung=p.bezeichnung,
                menge=p.menge, einheit=p.einheit,
                einzelpreis=p.einzelpreis, ust_satz=p.ust_satz,
            )
        )
    db.commit()
    return _oeffentlich(db, r)


@router.delete("/rechnungen/{id}", dependencies=[Depends(require_loeschen)])
async def delete_rechnung(id: int, db=Depends(get_db)):
    r = db.query(Rechnung).filter(Rechnung.id == id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Rechnung nicht gefunden")
    if r.richtung == "ausgang" and r.status != "entwurf":
        raise HTTPException(
            status_code=422,
            detail="Festgeschriebene Rechnungen dürfen nicht gelöscht werden (Nummernkreis) — bitte stornieren",
        )
    db.query(Rechnungsposition).filter(
        Rechnungsposition.rechnung_id == r.id
    ).delete()
    db.delete(r)
    db.commit()
    return {"message": "Rechnung gelöscht"}


@router.post("/rechnungen/{id}/festschreiben")
async def festschreiben(id: int, db=Depends(get_db)):
    """Entwurf → gestellte Rechnung: vergibt die nächste lückenlose Nummer."""
    r = db.query(Rechnung).filter(Rechnung.id == id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Rechnung nicht gefunden")
    if r.status != "entwurf":
        raise HTTPException(status_code=422, detail="Rechnung ist bereits festgeschrieben")
    if not _positionen(db, r.id):
        raise HTTPException(status_code=422, detail="Rechnung hat keine Positionen")

    jahr = (r.datum or date.today()).year
    praefix = f"RE-{jahr}-"
    letzte = (
        db.query(Rechnung)
        .filter(Rechnung.nummer.like(f"{praefix}%"))
        .order_by(Rechnung.nummer.desc())
        .first()
    )
    naechste = 1
    if letzte and letzte.nummer:
        try:
            naechste = int(letzte.nummer.split("-")[-1]) + 1
        except ValueError:
            pass
    r.nummer = f"{praefix}{naechste:04d}"
    r.status = "gestellt"
    db.commit()
    return _oeffentlich(db, r)


@router.post("/rechnungen/{id}/status")
async def setze_status(id: int, daten: StatusDaten, db=Depends(get_db)):
    r = db.query(Rechnung).filter(Rechnung.id == id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Rechnung nicht gefunden")
    if daten.status not in ("bezahlt", "storniert", "gestellt", "eingegangen"):
        raise HTTPException(status_code=422, detail="Ungültiger Status")
    if r.status == "entwurf":
        raise HTTPException(status_code=422, detail="Entwurf zuerst festschreiben")
    r.status = daten.status
    db.commit()
    return _oeffentlich(db, r)


# ---------- XRechnung-Export (EN 16931, CII-Syntax) ----------

@router.get("/rechnungen/{id}/xrechnung")
async def xrechnung_export(id: int, db=Depends(get_db)):
    r = db.query(Rechnung).filter(Rechnung.id == id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Rechnung nicht gefunden")
    if r.richtung != "ausgang" or r.status == "entwurf":
        raise HTTPException(
            status_code=422, detail="Nur festgeschriebene Ausgangsrechnungen exportierbar"
        )
    fd = _firmendaten(db)
    # telefon: XRechnung verlangt einen Verkäufer-Kontakt mit Telefon (BR-DE-6)
    fehlend = [f for f in ("name", "strasse", "plz", "ort", "ust_id", "iban", "email", "telefon") if not getattr(fd, f)]
    if fehlend:
        raise HTTPException(
            status_code=422,
            detail=f"Firmendaten unvollständig (Einstellungen): {', '.join(fehlend)}",
        )
    kunde = db.query(Kunde).filter(Kunde.id == r.kunden_id).first()
    if not kunde:
        raise HTTPException(status_code=422, detail="Kunde der Rechnung fehlt")

    xml = _baue_xrechnung(r, _positionen(db, r.id), fd, kunde)
    return Response(
        content=xml,
        media_type="application/xml",
        headers={
            "Content-Disposition": f'attachment; filename="{r.nummer}.xml"'
        },
    )


def _dt102(d: date) -> str:
    return d.strftime("%Y%m%d")


def _baue_xrechnung(r: Rechnung, positionen, fd: Firmendaten, kunde: Kunde) -> str:
    s = berechne_summen(positionen)
    e = escape

    zeilen = []
    for p in positionen:
        einheit = EINHEIT_CODES.get(p.einheit or "Stück", "C62")
        zeilensumme = _runde(_d(p.menge) * _d(p.einzelpreis))
        zeilen.append(f"""
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument><ram:LineID>{p.pos}</ram:LineID></ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct><ram:Name>{e(p.bezeichnung or "")}</ram:Name></ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice><ram:ChargeAmount>{_runde(_d(p.einzelpreis))}</ram:ChargeAmount></ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery><ram:BilledQuantity unitCode="{einheit}">{_d(p.menge)}</ram:BilledQuantity></ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>{"S" if p.ust_satz else "Z"}</ram:CategoryCode>
          <ram:RateApplicablePercent>{p.ust_satz}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation><ram:LineTotalAmount>{zeilensumme}</ram:LineTotalAmount></ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>""")

    steuern = []
    for satz, werte in s["ust"].items():
        steuern.append(f"""
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>{werte["betrag"]}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>{werte["basis"]}</ram:BasisAmount>
        <ram:CategoryCode>{"S" if int(satz) else "Z"}</ram:CategoryCode>
        <ram:RateApplicablePercent>{satz}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>""")

    kaeufer_email = (
        f'\n        <ram:URIUniversalCommunication><ram:URIID schemeID="EM">{e(kunde.email)}</ram:URIID></ram:URIUniversalCommunication>'
        if kunde.email
        else ""
    )
    leistungsdatum = r.leistung_bis or r.leistung_von or r.datum

    return f"""<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:BusinessProcessSpecifiedDocumentContextParameter>
      <ram:ID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</ram:ID>
    </ram:BusinessProcessSpecifiedDocumentContextParameter>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>{e(r.nummer)}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime><udt:DateTimeString format="102">{_dt102(r.datum)}</udt:DateTimeString></ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>{"".join(zeilen)}
    <ram:ApplicableHeaderTradeAgreement>
      <ram:BuyerReference>{e(kunde.name or "")}</ram:BuyerReference>
      <ram:SellerTradeParty>
        <ram:Name>{e(fd.name)}</ram:Name>
        <ram:DefinedTradeContact>
          <ram:PersonName>{e(fd.name)}</ram:PersonName>
          <ram:TelephoneUniversalCommunication><ram:CompleteNumber>{e(fd.telefon or "")}</ram:CompleteNumber></ram:TelephoneUniversalCommunication>
          <ram:EmailURIUniversalCommunication><ram:URIID>{e(fd.email)}</ram:URIID></ram:EmailURIUniversalCommunication>
        </ram:DefinedTradeContact>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>{e(fd.plz)}</ram:PostcodeCode>
          <ram:LineOne>{e((fd.strasse or "") + " " + (fd.hausnummer or ""))}</ram:LineOne>
          <ram:CityName>{e(fd.ort)}</ram:CityName>
          <ram:CountryID>{e(fd.land or "DE")}</ram:CountryID>
        </ram:PostalTradeAddress>
        <ram:URIUniversalCommunication><ram:URIID schemeID="EM">{e(fd.email)}</ram:URIID></ram:URIUniversalCommunication>
        <ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">{e(fd.ust_id)}</ram:ID></ram:SpecifiedTaxRegistration>
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>{e(kunde.name or "")}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>{e(kunde.plz or "")}</ram:PostcodeCode>
          <ram:LineOne>{e((kunde.strasse or "") + " " + (kunde.hausnummer or ""))}</ram:LineOne>
          <ram:CityName>{e(kunde.ort or "")}</ram:CityName>
          <ram:CountryID>DE</ram:CountryID>
        </ram:PostalTradeAddress>{kaeufer_email}
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery>
      <ram:ActualDeliverySupplyChainEvent>
        <ram:OccurrenceDateTime><udt:DateTimeString format="102">{_dt102(leistungsdatum)}</udt:DateTimeString></ram:OccurrenceDateTime>
      </ram:ActualDeliverySupplyChainEvent>
    </ram:ApplicableHeaderTradeDelivery>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      <ram:SpecifiedTradeSettlementPaymentMeans>
        <ram:TypeCode>58</ram:TypeCode>
        <ram:PayeePartyCreditorFinancialAccount><ram:IBANID>{e((fd.iban or "").replace(" ", ""))}</ram:IBANID></ram:PayeePartyCreditorFinancialAccount>
      </ram:SpecifiedTradeSettlementPaymentMeans>{"".join(steuern)}
      <ram:SpecifiedTradePaymentTerms>
        <ram:DueDateDateTime><udt:DateTimeString format="102">{_dt102(r.faellig_am or r.datum)}</udt:DateTimeString></ram:DueDateDateTime>
      </ram:SpecifiedTradePaymentTerms>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>{s["netto"]}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>{s["netto"]}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">{s["ust_gesamt"]}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>{s["brutto"]}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>{s["brutto"]}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>
"""


# ---------- E-Rechnungs-Eingang (XML-Upload, CII oder UBL) ----------

def _lokal(tag: str) -> str:
    return tag.split("}")[-1] if "}" in tag else tag


def _finde_text(wurzel, *pfad_namen) -> str | None:
    """Sucht das erste Element, dessen Localname-Kette auf pfad_namen endet."""
    for el in wurzel.iter():
        if _lokal(el.tag) == pfad_namen[-1] and el.text and el.text.strip():
            # grobe Eltern-Prüfung für eindeutigere Treffer
            return el.text.strip()
    return None


def _parse_erechnung(xml_text: str) -> dict:
    try:
        wurzel = ElementTree.fromstring(xml_text)
    except ElementTree.ParseError:
        raise HTTPException(status_code=422, detail="Datei ist kein gültiges XML")

    wurzel_name = _lokal(wurzel.tag)
    if wurzel_name not in ("CrossIndustryInvoice", "Invoice"):
        raise HTTPException(
            status_code=422,
            detail="Kein bekanntes E-Rechnungs-Format (erwartet: XRechnung/CII oder UBL)",
        )

    daten = {"format": "CII" if wurzel_name == "CrossIndustryInvoice" else "UBL"}

    # Nummer + Datum
    if daten["format"] == "CII":
        for el in wurzel.iter():
            if _lokal(el.tag) == "ExchangedDocument":
                for kind in el:
                    if _lokal(kind.tag) == "ID" and kind.text:
                        daten["nummer"] = kind.text.strip()
                break
        for el in wurzel.iter():
            if _lokal(el.tag) == "DateTimeString" and el.text:
                daten.setdefault("datum_roh", el.text.strip())
                break
        for el in wurzel.iter():
            if _lokal(el.tag) == "SellerTradeParty":
                for kind in el.iter():
                    if _lokal(kind.tag) == "Name" and kind.text:
                        daten["lieferant"] = kind.text.strip()
                        break
                break
        for el in wurzel.iter():
            if _lokal(el.tag) == "DuePayableAmount" and el.text:
                daten["betrag"] = el.text.strip()
                break
    else:  # UBL
        for el in wurzel:
            if _lokal(el.tag) == "ID" and el.text:
                daten["nummer"] = el.text.strip()
            if _lokal(el.tag) == "IssueDate" and el.text:
                daten["datum"] = el.text.strip()
        for el in wurzel.iter():
            if _lokal(el.tag) == "AccountingSupplierParty":
                for kind in el.iter():
                    if _lokal(kind.tag) in ("RegistrationName", "Name") and kind.text:
                        daten["lieferant"] = kind.text.strip()
                        break
                break
        for el in wurzel.iter():
            if _lokal(el.tag) == "PayableAmount" and el.text:
                daten["betrag"] = el.text.strip()
                break

    # CII-Datum "20260802" -> ISO
    if "datum_roh" in daten and len(daten["datum_roh"]) == 8:
        roh = daten.pop("datum_roh")
        daten["datum"] = f"{roh[0:4]}-{roh[4:6]}-{roh[6:8]}"
    return daten


@router.post("/rechnungen/eingang", status_code=201)
async def eingang(daten: EingangDaten, db=Depends(get_db)):
    geparst = _parse_erechnung(daten.xml)
    r = Rechnung(
        richtung="eingang",
        status="eingegangen",
        extern_nummer=geparst.get("nummer"),
        lieferant=geparst.get("lieferant"),
        betrag=Decimal(geparst["betrag"]) if geparst.get("betrag") else None,
        datum=date.fromisoformat(geparst["datum"]) if geparst.get("datum") else None,
        dateiname=daten.dateiname,
        xml_roh=daten.xml,
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return _oeffentlich(db, r)
