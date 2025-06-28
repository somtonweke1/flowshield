#!/bin/bash

# Database backup script for FlowShield
# This script creates daily backups of the PostgreSQL database

set -e

# Configuration
BACKUP_DIR="/backups"
DB_HOST="postgres"
DB_PORT="5432"
DB_NAME="flowshield"
DB_USER="flowshield"
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
BACKUP_FILE="$BACKUP_DIR/flowshield-backup-$(date +%Y%m%d-%H%M%S).sql.gz"

# Create backup
echo "Creating database backup: $BACKUP_FILE"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "Backup completed successfully: $BACKUP_FILE"
    
    # Get backup size
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "Backup size: $BACKUP_SIZE"
    
    # Clean up old backups (keep only last 30 days)
    echo "Cleaning up backups older than $RETENTION_DAYS days..."
    find "$BACKUP_DIR" -name "flowshield-backup-*.sql.gz" -mtime +$RETENTION_DAYS -delete
    
    # List remaining backups
    echo "Remaining backups:"
    ls -lh "$BACKUP_DIR"/flowshield-backup-*.sql.gz 2>/dev/null || echo "No backups found"
    
else
    echo "Backup failed!"
    exit 1
fi 