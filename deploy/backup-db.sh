#!/usr/bin/env bash
# Nächtliches Backup der Gleisbau-CRM-Datenbank (Postgres im Docker).
#
# Installation auf dem Server (einmalig):
#   cp /opt/gleisbau-crm/deploy/backup-db.sh /usr/local/bin/gleisbau-backup
#   chmod +x /usr/local/bin/gleisbau-backup
#   echo '0 3 * * * root /usr/local/bin/gleisbau-backup' > /etc/cron.d/gleisbau-backup
#
# Wiederherstellen eines Backups:
#   gunzip -c /opt/backups/gleisbau-JJJJ-MM-TT.sql.gz | \
#     docker compose -f /opt/gleisbau-crm/docker-compose.yml exec -T db \
#     psql -U gleisbau -d gleisbau

set -euo pipefail

BACKUP_DIR="/opt/backups"
COMPOSE="docker compose -f /opt/gleisbau-crm/docker-compose.yml"
BEHALTE_TAGE=14

mkdir -p "$BACKUP_DIR"

DATEI="$BACKUP_DIR/gleisbau-$(date +%F).sql.gz"
$COMPOSE exec -T db pg_dump -U gleisbau gleisbau | gzip > "$DATEI"

# Leere/kaputte Dumps sofort auffällig machen
if [ ! -s "$DATEI" ]; then
  echo "FEHLER: Backup $DATEI ist leer!" >&2
  exit 1
fi

# Alte Backups aufräumen (älter als BEHALTE_TAGE Tage)
find "$BACKUP_DIR" -name 'gleisbau-*.sql.gz' -mtime +"$BEHALTE_TAGE" -delete

echo "OK: $DATEI ($(du -h "$DATEI" | cut -f1))"
