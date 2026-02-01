# Head Systems Secret Rotation Protocol

## Overview
The `scripts/rotate_secrets.py` utility provides a secure mechanism to rotate critical system secrets in the `.env.local` environment file while preserving existing configuration and creating safety backups.

## Usage

```bash
python scripts/rotate_secrets.py
```

## Features

### 1. Automatic Backup
Before any changes are made, a timestamped backup of your `.env.local` file is created:
- Format: `.env.local.YYYYMMDD_HHMMSS.bak`
- Location: Same directory as `.env.local`

### 2. Selective Rotation
Only specific security-critical keys are rotated. Other configuration (database URLs, API keys) remains untouched.

**Rotated Keys:**
- `JWT_SECRET_KEY` (64 chars)
- `HEADY_AUTH_TOKEN` (32 chars)
- `ENCRYPTION_KEY` (32 chars)
- `WEBHOOK_SIGNATURE_SECRET` (32 chars)

### 3. Cryptographic Security
Uses Python's `secrets` module to generate cryptographically strong random strings suitable for security purposes.

### 4. Smart Updates
- If a key exists, it is updated in place.
- If a key is missing, it is appended to the file.
- Preserves comments and formatting of unrelated lines.

## Protocol for Production Rotation

1. **Notify Team**: Announce upcoming secret rotation.
2. **Run Rotation**: Execute the script on the production server or local environment to be pushed.
3. **Distribute**: Securely share the new `.env` file with authorized nodes/developers (if applicable) or update the secret store (Vault/Render/GitHub Secrets).
4. **Restart Services**: 
   - Restart the Node.js backend.
   - Restart any workers or consumers relying on these secrets.
5. **Verify**: Check logs for authentication failures.

## Recovery
If issues arise, restore the backup:

```bash
cp .env.local.20240101_120000.bak .env.local
# Restart services
```
