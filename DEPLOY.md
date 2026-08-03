# Deployment auf Hetzner (Test-Server)

Server: **zenbu-01** · CX23 · `89.167.118.97`

## 1. SSH-Zugang prüfen (auf dem Mac)

```bash
# Vorhandene Keys ansehen
ls ~/.ssh

# Einfach probieren – SSH testet alle Standard-Keys automatisch
ssh root@89.167.118.97
```

Falls "Permission denied": In der Hetzner Cloud Console → Server → **Rescue**
→ "Reset root password", dann mit Passwort einloggen und eigenen Key
hinterlegen:

```bash
ssh-copy-id root@89.167.118.97
```

## 2. Docker auf dem Server installieren (einmalig)

```bash
ssh root@89.167.118.97
curl -fsSL https://get.docker.com | sh
```

## 3. Projekt auf den Server kopieren (vom Mac)

```bash
rsync -av \
  --exclude venv --exclude node_modules --exclude dist \
  --exclude __pycache__ --exclude '*.db' \
  ~/Dev/gleisbau-crm/ root@89.167.118.97:/opt/gleisbau-crm/
```

(Alternativ auf dem Server per `git clone`, falls die Änderungen gepusht sind.)

## 4. Starten

```bash
ssh root@89.167.118.97
cd /opt/gleisbau-crm

# Einmalig: Secrets anlegen (JWT + Postgres-Passwort)
cat > .env <<EOF
JWT_SECRET=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -hex 16)
EOF

docker compose up -d --build
```

Danach läuft die App unter **http://89.167.118.97:8080** —
Frontend über Container-nginx, API same-origin unter `/api/…`,
PostgreSQL und Backend nicht direkt von außen erreichbar.
Erster Login: `admin` / `gleisbau2026` (danach ändern!).

> Falls eine Hetzner Cloud Firewall aktiv ist: eingehend **TCP 8080** (und 22)
> erlauben.

## HTTPS (sobald eine Domain da ist)

Der System-nginx auf dem Server (Port 80) übernimmt TLS und leitet auf
den CRM-Container (8080) weiter — Anleitung und fertiger vHost in
`deploy/nginx-crm.conf`. Kurzfassung: A-Record setzen, vHost aktivieren,
`certbot --nginx -d crm.deine-domain.de`.

## Datenbank-Backup

```bash
# Manuell:
docker compose exec db pg_dump -U gleisbau gleisbau > backup_$(date +%F).sql

# Automatisch täglich 03:00 (crontab -e auf dem Server):
0 3 * * * cd /opt/gleisbau-crm && docker compose exec -T db pg_dump -U gleisbau gleisbau > /root/backups/gleisbau_$(date +\%F).sql
```

## Betrieb

```bash
docker compose logs -f            # Logs
docker compose up -d --build      # Neu deployen nach Code-Änderung
docker compose down               # Stoppen (DB bleibt erhalten)
docker compose down -v            # Stoppen + DB löschen (frischer Start)
```

Die SQLite-DB liegt im Docker-Volume `gleisbau-crm_db-data` und überlebt
Rebuilds und Neustarts.

## Architektur

```
Browser ──:80──> nginx (frontend-Container)
                   ├── /            React-Build (SPA-Fallback)
                   └── /api/…  ──>  backend:8000 (FastAPI, intern)
                                      └── /data/gleisbau.db (Volume)
```

Lokal ändert sich nichts: `npm run dev` + `uvicorn main:app --reload`
funktionieren weiter wie bisher (API_BASE fällt auf `localhost:8000` zurück).
