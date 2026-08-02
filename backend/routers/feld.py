"""Feld-Zugang: Bautagesberichte von der Baustelle mit persönlichem Login.

Jeder Baustellen-Mitarbeiter hat ein Benutzerkonto (Rolle "feld"), das
über personal_id mit seinem Personal-Eintrag verknüpft ist. Nach dem
Login steht damit fest, WER den Bericht schreibt — der Ersteller wird
serverseitig aus dem Konto gesetzt und ist nicht wählbar.

Feld-Konten können ausschließlich:
  - ihre eigenen Stammdaten + aktive Projekte lesen (dieses Modul)
  - einen Bautagesbericht anlegen (dieses Modul)
Alle CRM-Daten-Router weisen die Rolle "feld" ab (require_buero).
"""

from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_user
from database import get_db
from models import Bautagesbericht, Benutzer, Kunde, Personal, Projekt
from schemas import BautagesberichtCreate

router = APIRouter(prefix="/feld")

# Nur Baustellen-Personal darf Berichte senden. Abgleich gegen das
# Positions-Feld (Teilstring, case-insensitive — "Oberpolier" zählt).
FELD_QUALIFIKATIONEN = ("polier", "vorarbeiter", "facharbeiter", "bauhelfer")


def ist_feldpersonal(p: Personal) -> bool:
    position = (p.position or "").lower()
    return any(q in position for q in FELD_QUALIFIKATIONEN)


def _eigene_person(benutzer: Benutzer, db) -> Personal | None:
    if not benutzer.personal_id:
        return None
    return db.query(Personal).filter(Personal.id == benutzer.personal_id).first()


@router.get("/stammdaten")
async def feld_stammdaten(
    benutzer: Benutzer = Depends(get_current_user), db=Depends(get_db)
):
    """Eigene Person + aktive Projekte für das Melde-Formular."""
    person = _eigene_person(benutzer, db)
    ich = None
    if person:
        ich = {
            "id": person.id,
            "vorname": person.vorname,
            "nachname": person.nachname,
            "berechtigt": ist_feldpersonal(person),
        }

    kunden = {k.id: k.name for k in db.query(Kunde)}
    projekte = []
    for p in (
        db.query(Projekt)
        .filter(Projekt.status != "Abgeschlossen")
        .order_by(Projekt.name)
    ):
        # Laufende Montagen dieses Projekts: neueste zuerst, je Montage der
        # letzte Bericht als Vorlage fürs Vorausfüllen des Folgetags.
        montagen = []
        gesehen = set()
        for b in (
            db.query(Bautagesbericht)
            .filter(
                Bautagesbericht.projekt_id == p.id,
                Bautagesbericht.montage.isnot(None),
                Bautagesbericht.montage != "",
            )
            .order_by(Bautagesbericht.datum.desc(), Bautagesbericht.id.desc())
            .limit(100)
        ):
            if b.montage in gesehen:
                continue
            gesehen.add(b.montage)
            anzahl = (
                db.query(Bautagesbericht)
                .filter(
                    Bautagesbericht.projekt_id == p.id,
                    Bautagesbericht.montage == b.montage,
                )
                .count()
            )
            montagen.append(
                {
                    "name": b.montage,
                    "anzahl": anzahl,
                    "letzter_datum": str(b.datum) if b.datum else None,
                    "vorlage": {
                        "ort": b.ort,
                        "personal_anwesend": b.personal_anwesend,
                        "maschinen_eingesetzt": b.maschinen_eingesetzt,
                        "arbeitszeit_von": b.arbeitszeit_von,
                        "arbeitszeit_bis": b.arbeitszeit_bis,
                        "pause_minuten": b.pause_minuten,
                        "baufortschritt": b.baufortschritt,
                    },
                }
            )
            if len(montagen) >= 5:
                break

        projekte.append(
            {
                "id": p.id,
                "name": p.name,
                "status": p.status,
                "kunde": kunden.get(p.kunden_id),
                "montagen": montagen,
            }
        )
    return {"ich": ich, "projekte": projekte}


@router.post("/bautagesberichte", status_code=201)
async def feld_bautagesbericht(
    b: BautagesberichtCreate,
    benutzer: Benutzer = Depends(get_current_user),
    db=Depends(get_db),
):
    """Bericht von der Baustelle — Ersteller ist immer das eigene Konto."""
    person = _eigene_person(benutzer, db)
    if not person:
        raise HTTPException(
            status_code=403,
            detail=(
                "Dein Konto ist keinem Mitarbeiter zugeordnet — "
                "bitte im Büro melden."
            ),
        )
    if not ist_feldpersonal(person):
        raise HTTPException(
            status_code=403,
            detail=(
                "Nur Baustellen-Personal (Polier, Vorarbeiter, Facharbeiter, "
                "Bauhelfer) darf Berichte über das Feld-Formular senden."
            ),
        )

    daten = b.model_dump()
    # Ersteller kommt IMMER aus dem Login — was der Client schickt, zählt nicht.
    daten["ersteller_id"] = person.id
    neu = Bautagesbericht(**daten)
    neu.erstellt_von = f"feld:{benutzer.benutzername}"
    db.add(neu)
    db.commit()
    db.refresh(neu)
    return {"id": neu.id, "message": "Bericht gesendet"}
