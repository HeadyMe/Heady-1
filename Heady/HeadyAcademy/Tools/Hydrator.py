#!/usr/bin/env python3
"""
HEADY SCAFFOLDING & INGESTION PROTOCOL
Initializes structure, creates secret dump, and performs secure ingestion.
"""

import os
import re
from pathlib import Path

def scaffold_project():
    """Initialize project structure and handle secret ingestion."""
    root = Path.cwd()
    dump_file = root / "secrets_dump.txt"
    env_file = root / ".env"
    gitignore = root / ".gitignore"
    
    print("∞ INITIATING HEADY PROTOCOL ∞")
    
    # Create directories
    for d in ["src", "public", ".github/workflows", "docs"]:
        (root / d).mkdir(parents=True, exist_ok=True)
        print(f"  + Created Directory: {d}")
    
    # Setup gitignore
    gitignore.touch()
    content = gitignore.read_text() if gitignore.exists() else ""
    for item in [".env", ".venv", "secrets_dump.txt"]:
        if item not in content:
            with gitignore.open("a") as f:
                f.write(f"\n{item}")
            print(f"  ✓ Security: Added '{item}' to .gitignore")
    
    # Create dump template
    if not dump_file.exists():
        dump_file.write_text("""# SECRET DUMP AREA
# PASTE YOUR RAW KEYS BELOW AND SAVE.
# Examples:
# GITHUB_TOKEN=ghp_xyz...
# DATABASE_URL="postgres://user:pass@localhost:5432/db"
""")
        print(f"  ✓ Created Dump File: {dump_file.name}")
    
    # Ingestion
    if input(f"Scan '{dump_file.name}' and ingest secrets? (y/n): ") == 'y':
        content = dump_file.read_text()
        keys = {}
        
        for line in content.splitlines():
            match = re.match(r'^\s*([A-Z_][A-Z0-9_]+)\s*[:=]\s*["\']?([^"\'\r\n]+)["\']?', line)
            if match:
                keys[match.group(1)] = match.group(2)
        
        if keys:
            env_content = env_file.read_text() if env_file.exists() else "# HEADY SYSTEM SECRETS\n"
            lines = env_content.splitlines()
            
            for key, value in keys.items():
                pattern = f"^{key}="
                updated = False
                for i, line in enumerate(lines):
                    if re.match(pattern, line):
                        lines[i] = f"{key}={value}"
                        print(f"  > Updated: {key}")
                        updated = True
                        break
                if not updated:
                    lines.append(f"{key}={value}")
                    print(f"  + Added: {key}")
            
            env_file.write_text("\n".join(lines) + "\n")
            print(f"  ✓ Secrets secured in {env_file.name}")
            
            if input(f"Delete '{dump_file.name}' to prevent leaks? (y/n): ") == 'y':
                dump_file.unlink()
                print("  ✓ Dump file incinerated.")
        else:
            print("  ! No secrets found.")
    
    print("\nPROTOCOL COMPLETE.")

if __name__ == "__main__":
    scaffold_project()