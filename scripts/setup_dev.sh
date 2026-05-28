#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required."
  exit 1
fi

echo "[1/3] Setup Python apps"
for app in apps/agents apps/backend; do
  python3 -m venv "$app/.venv"
  "$app/.venv/bin/python" -m pip install --upgrade pip
  "$app/.venv/bin/pip" install -e "$app"
  if [[ ! -f "$app/.env" && -f "$app/.env.example" ]]; then
    cp "$app/.env.example" "$app/.env"
  fi
done

echo "[2/3] Setup mobile app"
if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is not installed. Install pnpm to finish mobile setup."
  exit 1
fi
cd apps/mobile
pnpm install --frozen-lockfile
if [[ ! -f .env && -f .env.example ]]; then
  cp .env.example .env
fi

echo "[3/3] Done"
echo "Setup complete."
