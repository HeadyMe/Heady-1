---
description: Audit and rotate security credentials
---
# Secrets Management Workflow

This workflow ensures the security of the system by auditing and rotating sensitive credentials.

1. **Audit Secrets**
   Check for the presence of required environment variables in `.env.local`.
   ```powershell
   // turbo
   .\scripts\audit_secrets.ps1
   ```

2. **Generate Missing Secrets**
   If secrets are missing, generate them automatically.
   ```powershell
   python scripts/generate_missing_secrets.py
   ```

3. **Rotate Secrets**
   Rotate critical security keys (JWT, Auth Tokens, Encryption Keys).
   *Note: This creates a backup of your current `.env.local` file.*
   ```powershell
   python scripts/rotate_secrets.py
   ```

4. **Apply Changes**
   After rotating secrets, you must restart the services for changes to take effect.
   ```powershell
   // turbo
   docker-compose restart
   ```

## Managed Secrets
- `JWT_SECRET_KEY`: Used for authentication tokens.
- `HEADY_AUTH_TOKEN`: Internal service-to-service auth.
- `ENCRYPTION_KEY`: Data encryption.
- `WEBHOOK_SIGNATURE_SECRET`: Verifying external webhooks.
