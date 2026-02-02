import secrets
import os
import shutil
import datetime
import re

def generate_secret(length=32):
    return secrets.token_urlsafe(length)

def rotate_secrets():
    print(">> HEADY SECRET ROTATION PROTOCOL")
    
    env_path = os.path.join(os.getcwd(), '.env.local')
    if not os.path.exists(env_path):
        print(f"!! No .env.local found at {env_path}")
        return

    # Backup
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = f"{env_path}.{timestamp}.bak"
    shutil.copy2(env_path, backup_path)
    print(f"[OK] Backup created: {backup_path}")

    # Secrets to rotate
    secrets_config = {
        "JWT_SECRET_KEY": 64,
        "HEADY_AUTH_TOKEN": 32,
        "ENCRYPTION_KEY": 32,
        "WEBHOOK_SIGNATURE_SECRET": 32
    }

    with open(env_path, 'r') as f:
        content = f.read()

    new_content = content
    rotated_count = 0

    for key, length in secrets_config.items():
        new_val = generate_secret(length)
        # Regex to replace value: KEY=value
        pattern = f"^{key}=.*$"
        
        if re.search(pattern, new_content, re.MULTILINE):
            new_content = re.sub(pattern, f"{key}={new_val}", new_content, flags=re.MULTILINE)
            print(f"  * Rotated {key}")
            rotated_count += 1
        else:
            print(f"  + Added {key} (was missing)")
            new_content += f"\n{key}={new_val}"
            rotated_count += 1

    with open(env_path, 'w') as f:
        f.write(new_content)

    print(f"[OK] Rotation complete. {rotated_count} secrets updated.")
    print("!! Restart services for changes to take effect.")

if __name__ == "__main__":
    rotate_secrets()
