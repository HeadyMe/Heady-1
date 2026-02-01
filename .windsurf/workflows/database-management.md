---
description: Manage the PostgreSQL database and Redis cache
---
# Database Management Workflow

This workflow provides standard procedures for managing the Heady Systems persistent storage (PostgreSQL) and cache (Redis) running in Docker.

1. **Access PostgreSQL Shell**
   Connect directly to the database CLI.
   ```powershell
   // turbo
   docker-compose exec db psql -U heady -d headysystems_dev
   ```

2. **Create Database Backup**
   Dump the current database schema and data to a file.
   ```powershell
   docker-compose exec -T db pg_dump -U heady headysystems_dev > backup_$(Get-Date -Format "yyyyMMdd_HHmm").sql
   ```

3. **Restore Database Backup**
   Restore from a SQL file (WARNING: Overwrites existing data).
   ```powershell
   # cat backup.sql | docker-compose exec -T db psql -U heady -d headysystems_dev
   ```

4. **Access Redis CLI**
   Connect to the Redis cache for debugging keys and queues.
   ```powershell
   // turbo
   docker-compose exec redis redis-cli
   ```

5. **Reset Database**
   Completely wipe and restart the database container (Data loss will occur).
   ```powershell
   docker-compose stop db
   docker-compose rm -f db
   docker volume rm headysystems_postgres_data
   docker-compose up -d db
   ```
