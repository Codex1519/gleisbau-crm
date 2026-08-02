"""Authentifizierung: Passwort-Hashing (PBKDF2, stdlib) + JWT-Tokens.

Rollen:
  admin          — alles, inkl. Benutzerverwaltung
  bauleiter      — alle Module
  sachbearbeiter — alle Module

Feinere Rechte pro Modul lassen sich später über require_rolle() ergänzen.
"""

import contextvars
import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from database import get_db
from models import Benutzer

# Auf dem Server per Umgebungsvariable setzen (siehe docker-compose.yml)!
JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret-nur-lokal")
TOKEN_GUELTIGKEIT = timedelta(hours=12)

ROLLEN = ("admin", "bauleiter", "sachbearbeiter")

# Wer bearbeitet gerade? Wird pro Request in get_current_user gesetzt und
# vom Session-Event (unten) in erstellt_von/geaendert_von geschrieben.
aktueller_benutzername: contextvars.ContextVar[str | None] = contextvars.ContextVar(
    "aktueller_benutzername", default=None
)

_bearer = HTTPBearer(auto_error=False)


# ---------- Passwort-Hashing (PBKDF2-SHA256, kein extra Paket nötig) ----------

def hash_passwort(passwort: str, salt: str | None = None) -> str:
    if salt is None:
        salt = secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac(
        "sha256", passwort.encode(), bytes.fromhex(salt), 100_000
    )
    return f"{salt}${h.hex()}"


def pruefe_passwort(passwort: str, gespeichert: str) -> bool:
    try:
        salt, _ = gespeichert.split("$", 1)
    except ValueError:
        return False
    return hmac.compare_digest(hash_passwort(passwort, salt), gespeichert)


# ---------- JWT ----------

def erstelle_token(benutzer: Benutzer) -> str:
    payload = {
        "sub": str(benutzer.id),
        "benutzername": benutzer.benutzername,
        "rolle": benutzer.rolle,
        "exp": datetime.now(timezone.utc) + TOKEN_GUELTIGKEIT,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


# ---------- FastAPI-Dependencies ----------

async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db=Depends(get_db),
) -> Benutzer:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Nicht angemeldet oder Sitzung abgelaufen",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise unauthorized

    benutzer = db.query(Benutzer).filter(Benutzer.id == int(payload["sub"])).first()
    if benutzer is None or not benutzer.aktiv:
        raise unauthorized
    aktueller_benutzername.set(benutzer.benutzername)
    return benutzer


def require_admin(benutzer: Benutzer = Depends(get_current_user)) -> Benutzer:
    if benutzer.rolle != "admin":
        raise HTTPException(status_code=403, detail="Nur für Administratoren")
    return benutzer


def require_loeschen(benutzer: Benutzer = Depends(get_current_user)) -> Benutzer:
    """Sachbearbeiter dürfen anlegen und ändern, aber nicht löschen."""
    if benutzer.rolle == "sachbearbeiter":
        raise HTTPException(
            status_code=403, detail="Sachbearbeiter dürfen keine Einträge löschen"
        )
    return benutzer


# ---------- Audit: erstellt_von / geaendert_von automatisch setzen ----------

from sqlalchemy import event  # noqa: E402
from database import Session as _Session  # noqa: E402


@event.listens_for(_Session, "before_flush")
def _setze_audit_felder(session, flush_context, instances):
    name = aktueller_benutzername.get()
    if not name:
        return
    for obj in session.new:
        if hasattr(obj, "erstellt_von") and obj.erstellt_von is None:
            obj.erstellt_von = name
    for obj in session.dirty:
        if hasattr(obj, "geaendert_von") and session.is_modified(obj):
            obj.geaendert_von = name
