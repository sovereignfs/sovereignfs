---
tags: [entity, runtime, mobile-shell]
repo: git@github.com:sovereignfs/sovereign-mobile.git
updated: 2026-07-31
---

# sovereign-mobile — Sovereign mobile shell

The native mobile shell client for [sovereign](sovereign.md). Same
architectural pattern as [sovereign-desktop](sovereign-desktop.md): on first
launch the user enters their self-hosted Sovereign instance URL, the app
validates and persists it (multiple instances supported), then loads that
instance in a native WebView. It ships no product features itself —
everything user-facing lives in the user's own Sovereign instance. Built
with Capacitor (iOS + Android from one codebase), the same pattern as the
Nextcloud, Bitwarden, and Element mobile clients. See
[native-shell-clients](../concepts/native-shell-clients.md) for why this
stays a sibling repo instead of a `sovereign/apps/` package.

Was first to implement the **device bridge** (RFC 0083) — a
capability-negotiated channel that lets plugins running inside the WebView
call `sdk.device.*` and reach real device hardware (geolocation, camera,
calendar, NFC, haptics, push — whatever a plugin legitimately needs)
without ever importing Capacitor directly. `sovereign-desktop` has since
added its own Tauri transport of the same protocol (workstream 0003 leg
3), so both shells now implement it — see
[sovereign-desktop](sovereign-desktop.md#device-bridge-rfc-0083-workstream-0003-leg-3).

## Status — repo created, shell scaffold in progress

`sovereign-mobile` is now a real git repository, pushed to
`sovereignfs/sovereign-mobile` on GitHub (`main` branch), and present in
[workbench.manifest.json](../../workbench.manifest.json) — the earlier
"docs-only, not yet clonable" caveat no longer applies. [sovereign's
`docs/repositories.md`](sovereign.md) still says "Not yet created" as of
its last ingest; that line is now stale and should be corrected on the next
`sovereign` ingest pass.

Beyond the planning docs (`CONCEPT.md`, `ROADMAP.md`, `AGENTS.md`/
`CLAUDE.md`, `CONTRIBUTING.md`, `docs/{epics,adrs,research}/`), task 20.1's
Capacitor scaffold itself now exists: onboarding/instance-persistence/boot
logic ported from `sovereign-desktop`, committed iOS and Android native
projects, and the two mobile-specific native pieces recorded as ADRs 0006
(history-based instance switcher) and 0007 (navigation-policy enforcement).
Verified building and running on iOS Simulator; Android is written but not
compile-verified (this needs JDK 21+, unavailable in the environment that
built it — see `docs/epics/shell.md` in this repo for the exact review-
checklist status). Epic task 20.1 is tracked ⏳ In Progress, not ✅, in this
repo's own `ROADMAP.md`.

## Governing design (owned centrally in `sovereign`)

This repo does not design its own device-bridge protocol or shell
architecture from scratch — those decisions live in the `sovereign`
monorepo and this repo implements/consumes them:

- **sovereign RFC 0058** (`docs/rfcs/0058-native-mobile-app-shell.md`) —
  the shell's design: distribution model, onboarding flow, device API
  tiering.
- **sovereign RFC 0083** (`docs/rfcs/0083-device-bridge-capability-contract.md`)
  — the device bridge protocol (`@sovereignfs/bridge` +
  `@sovereignfs/sdk/device-client`), shared with `sovereign-desktop` so the
  two shells cannot drift. This repo implements only the Capacitor
  transport of that contract.
- **sovereign RFC 0080** (`docs/rfcs/0080-plugin-surface-model.md`) —
  `sdk.device.getSurface()` and the manifest `surfaces` field; this shell
  is one of the two native surfaces (`mobile`, alongside `desktop`) that
  model answers.
- **sovereign epic 20** (`docs/epics/mobile.md`) and **[workstream
  0002](https://github.com/sovereignfs/sovereign/blob/main/docs/workstreams/0002-native-mobile-app-release.md)**
  — the task breakdown (task IDs 20.1–20.12, shared verbatim by this repo's
  own `ROADMAP.md`) and release sequencing that will create this
  repository's code.

This repo's own docs (`CONCEPT.md`, `docs/adrs/`, `docs/research/`) restate
and localize those decisions rather than re-deciding them — see
`docs/adrs/README.md` in this repo for the five `Accepted` ADRs already
recorded (Capacitor as the shell tech, one universal binary, cookie-in-
WebView auth for v1, the shared bridge contract, `server.url` over bundled
`capacitor://` assets).

## Relationship to sovereign

Explicit **sibling repo** to the `sovereign` monorepo, same relationship
[sovereign-desktop](sovereign-desktop.md) has — not a monorepo package, no
embedded runtime code.

## Distinct from sovereign-edge

**Not the same thing as [sovereign-edge](sovereign-edge.md)** (once that
entity page exists — currently still a confluence gap, see `index.md`).
`sovereign-edge` is a standalone React Native app with its own on-device
inference and connector framework — genuinely native UI, not a WebView
wrapper, and shares no code or product surface with this repo. Both being
"the mobile app" in casual conversation is the exact confusion both repos'
own docs go out of their way to call out.

## Notable planning facts

- Task IDs (`20.1`–`20.12`) are shared verbatim with `sovereign`'s epic 20
  — this repo does not mint a competing numbering scheme for tasks that are
  already cross-referenced centrally.
- Roadmap **slot** versions (e.g. `0.1.1`) are this repo's own and
  volatile — do not confuse them with the epic task IDs.
- Real-device verification (a physical iPhone and Android device) is called
  out repeatedly as a required human handoff before any store-track
  release — an agent cannot complete this repo's release tasks alone.
