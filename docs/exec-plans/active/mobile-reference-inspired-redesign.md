# Execution Plan: Mobile Reference-Inspired Redesign

## Objective

Redesign Finly mobile toward the provided investment UI references while preserving the existing five-tab product structure and current portfolio behavior.

## Why

The app already has working mobile flows, but Home and Portfolio need a more polished, chart-forward investment interface with stronger visual hierarchy and a consistent tab shell.

## Scope

- In scope:
  - Shared reference-inspired mobile design tokens and lightweight finance UI primitives
  - Home and Portfolio redesigns using existing portfolio, market-data, and agent data
  - Visual normalization for Board, Heartbeat, Settings, and the bottom tab bar
- Out of scope:
  - Backend/API changes
  - Portfolio model changes
  - Navigation IA changes away from the current five tabs

## Constraints

- Architectural: Keep mobile calling existing backend APIs only; keep route contracts intact.
- Reliability: Preserve holdings, watchlist, thread, heartbeat, settings, and detail navigation behavior.
- Security: Do not add secrets, external credentials, or new data-vendor access from mobile.

## Work Plan

1. Discovery
2. Implementation
3. Verification
4. Documentation updates

## Decision Log

- 2026-05-29: Keep five tabs and treat references as an inspired design system rather than a close clone.
- 2026-05-29: Add `react-native-svg` directly through Expo for rings and chart primitives.

## Progress Log

- 2026-05-29: Started plan.
- 2026-05-29: Added reference-inspired mobile tokens and shared finance primitives for header buttons, section headers, progress rings, sparklines, and investment cards.
- 2026-05-29: Redesigned Home around the provided references: greeting header, total investment summary, allocation ring, gain/loss panel, horizontal investment cards, top-listed row, and Finly forecast card.
- 2026-05-29: Redesigned Portfolio with a centered details header, violet featured holding card, analytics chart, compare callout, and preserved assets/watchlist behavior.
- 2026-05-29: Restyled the bottom tab shell and lightly normalized Board, Heartbeat, and Settings surfaces to the new visual direction.
- 2026-05-30: Fixed Portfolio analytics chart layout so the plot no longer runs under the right-side axis labels, and restored Home's draggable investment analyst team sheet with vertically scrollable agent cards.
- 2026-05-30: Tightened the reference visual system by centralizing type/radius/spacing tokens, reducing oversized text in shared finance widgets and holding rows, and making the Home investment summary responsive so allocation copy cannot wrap into vertical words on narrow screens.
- 2026-05-30: Raised the Home hero side-by-side breakpoint and replaced empty allocation copy with neutral placeholder bars so the purple allocation panel cannot collapse text vertically.
- 2026-05-30: Fixed Home hero overlap on iPhone-sized web/mobile viewports by removing `flex: 1` from the stacked summary card and hiding empty investment/top-listed sections until holdings exist.
- 2026-05-30: Tightened the Home investment summary against the reference by switching to an overlapping segmented donut, violet allocation panel, colored allocation percentages, and icon-led gain/loss panel while preserving portfolio-driven values.
- 2026-05-30: Aligned Board, Heartbeat, and Settings with the reference tab header pattern used elsewhere: circular left page icon, centered title, notification button, and divider.
- 2026-05-30: Tightened the Home investment analyst team sheet border radius and border edges so the bottom sheet reads cleaner against the page.

## Verification

- Commands run:
- `pnpm -C apps/mobile exec expo install react-native-svg`
- `pnpm -C apps/mobile exec prettier --write 'app/(tabs)/_layout.tsx' 'app/(tabs)/board.tsx' 'app/(tabs)/heartbeat.tsx' 'app/(tabs)/portfolio.tsx' 'app/(tabs)/settings.tsx' src/components/ReferenceFinanceWidgets.tsx src/features/home/screens/HomeTabScreen.tsx src/theme/uiTokens.ts`
- `pnpm -C apps/mobile exec eslint 'app/(tabs)/_layout.tsx' 'app/(tabs)/board.tsx' 'app/(tabs)/heartbeat.tsx' 'app/(tabs)/portfolio.tsx' 'app/(tabs)/settings.tsx' src/components/ReferenceFinanceWidgets.tsx src/features/home/screens/HomeTabScreen.tsx src/theme/uiTokens.ts`
- `pnpm -C apps/mobile exec eslint src/features/home/screens/HomeTabScreen.tsx 'app/(tabs)/portfolio.tsx'`
- `pnpm -C apps/mobile exec eslint 'app/(tabs)/_layout.tsx' 'app/(tabs)/board.tsx' 'app/(tabs)/heartbeat.tsx' 'app/(tabs)/portfolio.tsx' 'app/(tabs)/settings.tsx' src/components/ReferenceFinanceWidgets.tsx src/components/HoldingRow.tsx src/features/home/screens/HomeTabScreen.tsx src/theme/uiTokens.ts`
- `pnpm -C apps/mobile exec eslint src/features/home/screens/HomeTabScreen.tsx`
- `pnpm -C apps/mobile run compile` (fails on existing TypeScript errors outside this redesign slice)
- `python3 scripts/check_harness_readiness.py`
- `pnpm -C apps/mobile start -- --port 8082 --host localhost`
- `pnpm -C apps/mobile exec prettier --write src/features/home/screens/HomeTabScreen.tsx src/components/ReferenceFinanceWidgets.tsx`
- `pnpm -C apps/mobile exec eslint src/features/home/screens/HomeTabScreen.tsx src/components/ReferenceFinanceWidgets.tsx`
- `pnpm -C apps/mobile run compile` (still fails on existing TypeScript errors outside this Home summary slice; no remaining `HomeTabScreen.tsx` compile errors after the fix)
- `pnpm -C apps/mobile exec prettier --write 'app/(tabs)/board.tsx' 'app/(tabs)/heartbeat.tsx' 'app/(tabs)/settings.tsx'`
- `pnpm -C apps/mobile exec eslint 'app/(tabs)/board.tsx' 'app/(tabs)/heartbeat.tsx' 'app/(tabs)/settings.tsx'`
- `pnpm -C apps/mobile run compile` (still fails on existing TypeScript errors outside these header updates)
- `pnpm -C apps/mobile exec prettier --write src/features/home/screens/HomeTabScreen.tsx`
- `pnpm -C apps/mobile exec eslint src/features/home/screens/HomeTabScreen.tsx`
- Manual checks:
- Not run in simulator during this pass.
- Remaining risk:
- Device-level spacing and chart proportions may still need a visual QA pass on small and large iPhone viewports.
- Full mobile TypeScript compile is still blocked by existing errors in `app/thread/[id].tsx`, `index.tsx`, shared Ignite components/i18n exports, Tamagui primitives, navigation utilities, API event types, and agent stores.
