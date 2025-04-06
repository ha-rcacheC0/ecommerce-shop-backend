#!/bin/bash
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

# Load environment variables
source .env.production

# Extract database details from DATABASE_URL
DB_NAME=$(echo $DATABASE_URL | sed -E 's/.*\/([^?]+).*/\1/')
DB_USER=$(echo $DATABASE_URL | sed -E 's/.*:\/\/([^:]+).*/\1/')
DB_HOST=$(echo $DATABASE_URL | sed -E 's/.*@([^:]+).*/\1/')

# Create backup
PGPASSWORD=$DB_PASSWORD pg_dump -U $DB_USER -h $DB_HOST -d $DB_NAME -F c -f "$BACKUP_DIR/backup_$DATE.dump"
echo "Backup created: $BACKUP_DIR/backup_$DATE.dump"