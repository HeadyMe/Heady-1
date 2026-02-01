---
description: Configure SSH keys for secure authentication
---
# SSH Setup Workflow

This workflow automates the generation and configuration of SSH keys for GitHub authentication and secure git operations.

1. **Run SSH Setup Script**
   This script will check for existing keys, generate a new one if needed, and configure Git to use SSH.
   ```powershell
   // turbo
   .\scripts\setup_ssh.ps1
   ```

2. **Add Key to GitHub**
   The script displays your public key. You must manually add this to your GitHub account:
   1. Copy the key output (starts with `ssh-rsa`).
   2. Go to [GitHub Settings > SSH and GPG keys](https://github.com/settings/keys).
   3. Click **New SSH key**, give it a title, and paste the key.

3. **Verify Connection**
   Test the connection to GitHub.
   ```powershell
   ssh -T git@github.com
   ```
   *Expected output: "Hi username! You've successfully authenticated..."*

4. **Troubleshooting**
   - If git commands still ask for a password, ensure the remote URL is using SSH format (`git@github.com:user/repo.git`) not HTTPS.
   - Run `git remote -v` to check current remotes.
