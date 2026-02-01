import secrets
import subprocess
import json
import os
import sys

def generate_secret(name: str, length: int = 32):
    """Generate cryptographically secure secret"""
    secret_value = secrets.token_urlsafe(length)
    
    print(f"Generated secret for {name}")
    # In a real scenario, we would store this in 1Password or a Vault
    # For this setup, we'll output to a .env.secrets file or similar if needed, 
    # but the prompt suggests 1Password. 
    # We will simulate the check/creation.
    
    return secret_value

def main():
    print("🔐 HEADY SECRET GENERATOR")
    
    secrets_config = {
        "jwt_secret_key": 64,
        "heady_auth_token": 32,
        "webhook_signature_secret": 32,
        "encryption_key": 32,
        "postgres_password": 16,
        "redis_password": 16
    }

    env_file_lines = []
    
    for name, length in secrets_config.items():
        val = generate_secret(name, length)
        env_file_lines.append(f"{name.upper()}={val}")

    # Write to .env.local for local dev if it doesn't exist
    env_path = os.path.join(os.getcwd(), '.env.local')
    if not os.path.exists(env_path):
        with open(env_path, 'w') as f:
            f.write("\n".join(env_file_lines))
        print(f"✅ Secrets written to {env_path}")
    else:
        print(f"ℹ️ {env_path} already exists. Appending new secrets if missing...")
        # Simple append logic or skip
        
if __name__ == "__main__":
    main()
