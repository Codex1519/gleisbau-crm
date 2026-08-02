from fastapi import APIRouter, Depends, HTTPException
from auth import require_loeschen
from database import get_db
from models import Personal
from schemas import PersonalCreate, PersonalUpdate

router = APIRouter()


@router.get("/personal")
async def read_personal_liste(db=Depends(get_db)):
    return db.query(Personal).all()


@router.post("/personal", status_code=201)
async def create_personal(personal: PersonalCreate, db=Depends(get_db)):
    neuer_eintrag = Personal(**personal.model_dump())
    db.add(neuer_eintrag)
    db.commit()
    db.refresh(neuer_eintrag)
    return neuer_eintrag


@router.get("/personal/{id}")
async def read_personal(id: int, db=Depends(get_db)):
    person = db.query(Personal).filter(Personal.id == id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Personal nicht gefunden")
    return person


@router.delete("/personal/{id}", dependencies=[Depends(require_loeschen)])
async def delete_personal(id: int, db=Depends(get_db)):
    person = db.query(Personal).filter(Personal.id == id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Personal nicht gefunden")
    db.delete(person)
    db.commit()
    return {"message": "Personal gelöscht"}


@router.put("/personal/{id}")
async def update_personal(id: int, personal_update: PersonalUpdate, db=Depends(get_db)):
    person = db.query(Personal).filter(Personal.id == id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Personal nicht gefunden")
    for feld, wert in personal_update.model_dump(exclude_unset=True).items():
        setattr(person, feld, wert)
    db.commit()
    db.refresh(person)
    return person
