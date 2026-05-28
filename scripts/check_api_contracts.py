#!/usr/bin/env python3
"""Structural API contract checks for backend and agent services."""

from __future__ import annotations

import importlib
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BACKEND_SRC = ROOT / "apps" / "backend" / "src"
AGENTS_SRC = ROOT / "apps" / "agents" / "src"


def _route_paths(app) -> set[str]:
    return {getattr(route, "path", "") for route in app.routes}


def main() -> int:
    sys.path.insert(0, str(BACKEND_SRC))
    sys.path.insert(0, str(AGENTS_SRC))

    try:
        backend_server = importlib.import_module("finly_backend.server")
        agents_server = importlib.import_module("finly_agents.server")
    except ModuleNotFoundError as exc:
        print(
            "API contract check requires backend/agent dependencies. "
            "Run `bash scripts/setup_dev.sh` first."
        )
        print(f"Missing module: {exc.name}")
        return 1

    backend_paths = _route_paths(backend_server.app)
    agents_paths = _route_paths(agents_server.app)

    required_backend = {
        "/healthz",
        "/api/report/generate",
        "/api/report/chat",
        "/api/chat",
    }
    required_agents = {
        "/healthz",
        "/agent/run-pipeline",
        "/agent/panel-chat",
    }

    missing_backend = sorted(required_backend - backend_paths)
    missing_agents = sorted(required_agents - agents_paths)

    if missing_backend or missing_agents:
        print("API contract check failed.")
        if missing_backend:
            print("Missing backend routes:")
            for path in missing_backend:
                print(f"- {path}")
        if missing_agents:
            print("Missing agent routes:")
            for path in missing_agents:
                print(f"- {path}")
        return 1

    print("API contract check passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
