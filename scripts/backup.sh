#!/bin/bash

# ======================================================================
# ModernShop Enterprise Automated Database Backup Script
# Perfect for running via cron on Cloud VM, Railway, or VPS.
# ======================================================================

set -e

# Target Variables
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="modernshop_backup_${TIMESTAMP}"
RETENTION_DAYS=14

echo "[BACKUP ENGINE] Initializing database dump cycle..."

# Create target backup directory
mkdir -p "$BACKUP_DIR"

if [ -n "$MONGODB_URI" ]; then
  echo "[BACKUP ENGINE] Active MongoDB connection found. Triggering cloud mongodump..."
  
  # Dump MongoDB Atlas
  mongodump --uri="$MONGODB_URI" --out="${BACKUP_DIR}/${BACKUP_NAME}"
  
  # Archive dumping files
  tar -czf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" -C "${BACKUP_DIR}" "${BACKUP_NAME}"
  
  # Clean up raw dumping files
  rm -rf "${BACKUP_DIR}/${BACKUP_NAME}"
else
  echo "[BACKUP ENGINE] Running on fallback JSON database. Backing up db.json..."
  
  if [ -f "./db.json" ]; then
    cp "./db.json" "${BACKUP_DIR}/${BACKUP_NAME}.json"
    tar -czf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" -C "${BACKUP_DIR}" "${BACKUP_NAME}.json"
    rm -f "${BACKUP_DIR}/${BACKUP_NAME}.json"
  else
    echo "[BACKUP ENGINE] Error: db.json file not found!"
    exit 1
  fi
fi

# Clean up backups older than RETENTION_DAYS
echo "[BACKUP ENGINE] Administering storage optimization (purging backups older than ${RETENTION_DAYS} days)..."
find "$BACKUP_DIR" -type f -name "modernshop_backup_*.tar.gz" -mtime +$RETENTION_DAYS -exec rm {} \;

echo "[BACKUP ENGINE] Backup completed successfully: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
