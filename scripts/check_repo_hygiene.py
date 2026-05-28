#!/usr/bin/env python3
"""Fail if generated/runtime artifacts are tracked in git."""

from __future__ import annotations

import subprocess
import sys


BLOCKED_PATTERNS = (
    "__pycache__/",
    ".egg-info/",
    ".pytest_cache/",
    ".ruff_cache/",
    "apps/agents/eval_results/",
    "apps/agents/src/tradingagents/eval_results/",
    "apps/agents/src/tradingagents/dataflows/data_cache/",
)

BLOCKED_SUFFIXES = (".pyc", ".pyo", ".db", ".sqlite", ".sqlite3")


def main() -> int:
    result = subprocess.run(
        ["git", "ls-files"],
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    tracked = [line.strip() for line in result.stdout.splitlines() if line.strip()]

    offenders: list[str] = []
    for path in tracked:
        if any(pattern in path for pattern in BLOCKED_PATTERNS):
            offenders.append(path)
            continue
        if path.endswith(BLOCKED_SUFFIXES):
            offenders.append(path)

    if offenders:
        print("Repository hygiene check failed. Remove generated/runtime artifacts:")
        for path in sorted(offenders):
            print(f"- {path}")
        return 1

    print("Repository hygiene check passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
