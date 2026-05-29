# Execution Plan: Production Hardening Cleanup Sprint

## Objective

Stabilize the Finly repository for production-oriented development with strict CI, cleaner repository hygiene, clearer backend/agent boundaries, and targeted UI consistency refactors.

## Why

The repo has drift from hackathon velocity (tracked runtime artifacts, fragmented CI, and inconsistent UI patterns). Tightening these now reduces regressions and speeds up future feature delivery.

## Scope

- In scope:
  - Strict CI pipeline consolidation and fail-fast checks
  - Repository hygiene guardrails + artifact cleanup
  - Deterministic local bootstrap/check scripts and docs updates
  - Backend/agent API contract structural checks
  - Targeted shared token usage across highest-traffic mobile screens
  - Execution-plan cleanup for superseded entries
- Out of scope:
  - Full navigation redesign
  - Major product behavior changes
  - New infrastructure providers

## Constraints

- Architectural: Keep `apps/backend` as app-facing API and `apps/agents` as stateless runtime.
- Reliability: Preserve existing endpoint behavior while adding stricter checks.
- Security: No secrets in repository; keep env-based runtime contracts.

## Work Plan

1. Discovery
2. Implementation
3. Verification
4. Documentation updates

## Decision Log

- 2026-05-28: Consolidate CI into a single strict `ci.yml` while keeping release workflow separate.
- 2026-05-28: Enforce repository hygiene with a dedicated tracked-file check script in CI.
- 2026-05-28: Use structural route-contract checks instead of full integration tests for first hardening pass.

## Progress Log

- 2026-05-28: Started plan.
- 2026-05-28: Added hygiene and API contract scripts, local CI script, and strict CI workflow.
- 2026-05-28: Added onboarding lifecycle contracts/status fields and streaming-recovery semantics.
- 2026-05-28: Hardened heartbeat stream parsing, rule parse error semantics, and scheduler duplicate-trigger guard.
- 2026-05-28: Improved agent panel stream idempotency with stream `message_id` propagation and client delivery statuses.
- 2026-05-28: Standardized heartbeat UI surfaces to shared UI tokens and added rule-level error feedback.

## Verification

- Commands run:
  - `python3 scripts/check_harness_readiness.py`
  - `python3 scripts/check_repo_hygiene.py`
  - `python3 scripts/check_api_contracts.py`
- Manual checks:
  - Confirmed CI enforces harness + hygiene + python + mobile checks.
  - Confirmed four high-traffic screens share centralized UI token usage.
- Remaining risk:
  - Full mobile and Python lint/test checks require local `pnpm`/`ruff` tool installation in this environment.
