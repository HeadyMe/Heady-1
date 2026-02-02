"""
Natural_Observer.py - OBSERVER Daemon
Monitors the Playground directory and logs file activity.
Expanded Scope: Includes Human Societal Patterns (Governance, Management, Economics).
"""
import time
import os
import sys
from pathlib import Path
from datetime import datetime

PLAYGROUND_DIR = Path(__file__).parent.parent.parent / "Playground"
LOG_FILE = Path(__file__).parent.parent.parent / "Logs" / "observer.log"

# Societal Patterns to Observe
SOCIETAL_KEYWORDS = ["Governance", "Management", "Economy", "Hierarchy", "Protocol", "Contract"]

# Universal Patterns (Nature & Abstract)
UNIVERSAL_KEYWORDS = ["Fractal", "Cycle", "Flow", "Structure", "Balance", "Symmetry", "Chaos", "Order", "Golden"]

def log_event(message):
    """Log an event with timestamp."""
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().isoformat()
    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(f"[{timestamp}] {message}\n")

def observe():
    """Main observation loop."""
    log_event("Observer daemon started")
    print("[OBSERVER] Daemon started. Monitoring Playground...")
    
    PLAYGROUND_DIR.mkdir(parents=True, exist_ok=True)
    known_files = set()
    
    try:
        while True:
            current_files = set(f.name for f in PLAYGROUND_DIR.iterdir() if f.is_file())
            
            new_files = current_files - known_files
            removed_files = known_files - current_files
            
            for f in new_files:
                log_event(f"NEW: {f}")
                # Check for Societal Patterns
                for keyword in SOCIETAL_KEYWORDS:
                    if keyword.lower() in f.lower():
                        log_event(f"🧬 SOCIETAL PATTERN DETECTED: {keyword} in {f}")

                # Check for Universal Patterns
                for keyword in UNIVERSAL_KEYWORDS:
                    if keyword.lower() in f.lower():
                        log_event(f"🌌 UNIVERSAL PATTERN DETECTED: {keyword} in {f}")
            
            for f in removed_files:
                log_event(f"REMOVED: {f}")
            
            known_files = current_files
            time.sleep(5)
    except KeyboardInterrupt:
        log_event("Observer daemon stopped by user")
    except Exception as e:
        log_event(f"Observer error: {e}")

if __name__ == "__main__":
    observe()
