#!/usr/bin/env bash
# One-time GitHub setup from your Mac (needs GitHub CLI: `brew install gh && gh auth login`).
# Creates the public repo if it doesn't exist, uploads the signing secrets and pushes.
# Usage (from the pes-app folder):  bash tools/github-setup.sh ../pes-app-signing
set -euo pipefail
REPO="helgurkonungson/pes-app"
KEYS="${1:-../pes-app-signing}"

command -v gh >/dev/null || { echo "Install GitHub CLI first: brew install gh && gh auth login"; exit 1; }
[ -f "$KEYS/pes-release.jks.base64" ] || { echo "Signing files not found in $KEYS"; exit 1; }

gh repo view "$REPO" >/dev/null 2>&1 || gh repo create "$REPO" --public --description "PES — learn anything in daily portions"
git remote get-url origin >/dev/null 2>&1 || git remote add origin "https://github.com/$REPO.git"

PW=$(grep 'PES_KEYSTORE_PASSWORD' "$KEYS/SIGNING-SECRETS.txt" | sed 's/.*= //')
gh secret set PES_KEYSTORE_BASE64 -R "$REPO" < "$KEYS/pes-release.jks.base64"
gh secret set PES_KEYSTORE_PASSWORD -R "$REPO" -b "$PW"
gh secret set PES_KEY_ALIAS -R "$REPO" -b "pes"
gh secret set PES_KEY_PASSWORD -R "$REPO" -b "$PW"

git push -u origin main
echo "Pushed. Follow the build with:  gh run watch -R $REPO"
