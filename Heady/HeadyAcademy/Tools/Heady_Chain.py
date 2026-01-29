import os
import sys
import json
import hashlib
import datetime
from pathlib import Path

ACADEMY_ROOT = Path(__file__).resolve().parent.parent
LEDGER_DIR = ACADEMY_ROOT / "Logs" / "Ledger"
CHAIN_FILE = LEDGER_DIR / "chain_head.json"


class Block:
    def __init__(self, index, timestamp, data, prev_hash):
        self.index = index
        self.timestamp = timestamp
        self.data = data
        self.prev_hash = prev_hash
        self.nonce = 0
        self.hash = self.compute_hash()

    def compute_hash(self):
        block_str = f"{self.index}{self.timestamp}{self.data}{self.prev_hash}{self.nonce}"
        return hashlib.sha256(block_str.encode()).hexdigest()

    def mine(self, difficulty=2):
        target = "0" * difficulty
        while not self.hash.startswith(target):
            self.nonce += 1
            self.hash = self.compute_hash()


class HeadyChain:
    def __init__(self):
        self.chain = []
        LEDGER_DIR.mkdir(parents=True, exist_ok=True)
        self.load()

    def gen(self):
        self.chain = [Block(0, str(datetime.datetime.now()), "Genesis", "0")]
        self.save()

    def save(self):
        with CHAIN_FILE.open("w", encoding="utf-8") as f:
            json.dump([vars(b) for b in self.chain], f, indent=4)

    def load(self):
        try:
            with CHAIN_FILE.open("r", encoding="utf-8") as f:
                data = json.load(f)

            self.chain = []
            for b in data:
                block = Block(b["index"], b["timestamp"], b["data"], b["prev_hash"])
                block.nonce = b.get("nonce", 0)
                block.hash = b.get("hash", block.compute_hash())
                self.chain.append(block)

            if not self.chain:
                self.gen()

        except (FileNotFoundError, json.JSONDecodeError, KeyError, TypeError):
            self.gen()

    def add(self, role, user):
        prev = self.chain[-1]
        block = Block(prev.index + 1, str(datetime.datetime.now()), f"{role}:{user}", prev.hash)
        block.mine()
        self.chain.append(block)
        self.save()
        print(f"Mined: {block.hash}")

    def verify(self, role, user):
        target = f"{role}:{user}"
        for block in reversed(self.chain):
            if target == block.data:
                return True
        return False


def run_build_repair():
    print("Build & Repair is not available from this tool.")
    return 2


def main(argv):
    if len(argv) < 2:
        print("Usage: python Heady_Chain.py <grant|verify> <role> <user>")
        return 2

    cmd = argv[1].lower()

    if cmd == "build":
        return run_build_repair()

    if cmd not in ("grant", "verify"):
        print("Usage: python Heady_Chain.py <build|grant|verify> [args]")
        return 2

    if len(argv) < 4:
        print(f"Usage: python Heady_Chain.py {cmd} <role> <user>")
        return 2

    role = argv[2]
    user = argv[3]
    hc = HeadyChain()

    if cmd == "grant":
        hc.add(role, user)
        return 0

    ok = hc.verify(role, user)
    print("ACCESS GRANTED" if ok else "DENIED")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
def auto_commit_push(message: str = "Auto-commit from Heady_Chain", branch: str = "main"):
    """Stage all changes, commit with message, and push to remote."""
    import subprocess
    
    try:
        # Stage all changes
        subprocess.run(["git", "add", "."], check=True)
        
        # Commit with message
        subprocess.run(["git", "commit", "-m", message], check=True)
        
        # Push to remote
        subprocess.run(["git", "push", "origin", branch], check=True)
        
        print(f"Successfully committed and pushed to {branch}")
        return 0
    except subprocess.CalledProcessError as e:
        print(f"Git operation failed: {e}")
        return 1
