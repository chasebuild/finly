#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[1/4] Harness readiness"
python3 scripts/check_harness_readiness.py

echo "[2/4] Repository hygiene"
python3 scripts/check_repo_hygiene.py

echo "[3/4] Python checks"
if command -v ruff >/dev/null 2>&1; then
  ruff check apps/agents apps/backend
else
  python3 -m ruff check apps/agents apps/backend
fi
python3 -m build apps/agents
python3 -m build apps/backend
python3 scripts/check_api_contracts.py

echo "[4/4] Mobile checks"
if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required for mobile checks. Install pnpm and rerun scripts/local_ci.sh"
  exit 1
fi
cd apps/mobile
pnpm install --frozen-lockfile
pnpm exec prettier --check .
pnpm run lint:check
pnpm run compile
pnpm run test -- --ci

echo "Local CI checks passed."
