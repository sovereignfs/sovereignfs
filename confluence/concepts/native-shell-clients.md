---
tags: [concept, architecture, desktop, mobile]
updated: 2026-08-06
---

# Native shell clients stay sibling repos, not monorepo packages

[sovereign-desktop](../entities/sovereign-desktop.md) and
[sovereign-mobile](../entities/sovereign-mobile.md) are both "minimal shell"
native wrappers: on first launch the user enters their self-hosted Sovereign
instance URL, the shell validates and persists it, then loads that instance
in a native WebView. Neither ships product features — everything user-facing
lives in the user's own `sovereign` instance. Same architectural pattern as
the Nextcloud, Bitwarden, and Element desktop/mobile clients.

## Why they aren't folded into `sovereign/apps/`

Raised and considered 2026-08-06: since both shells "have no existence"
without a running `sovereign` instance, why not move them into
`sovereign/apps/` alongside the `auth`/`relay` services that already live
there? Decided against it. The dependency is real but sits at a different
layer than the one monorepo-merging would fix:

- **Protocol coupling, not source coupling.** Each shell talks to *any*
  self-hosted `sovereign` instance over a stable HTTP contract (`GET
  /api/instance`, the `bridge_invoke` device-bridge command) — not to a
  specific build of the `sovereign` source tree. Neither shell imports any
  `@sovereignfs/*` package from `sovereign`; their only real dependencies
  are `@tauri-apps/*` and `@capacitor/*`. There is close to no shared code
  a monorepo merge would let them share.
- **Deliberately decoupled release cadence.** `sovereign/apps/{auth,relay}`
  deploy continuously with the runtime. The shells release via `v*` tags to
  signed/notarized platform installers (`.dmg`/`.msi`/`.exe`/`.AppImage`/
  `.deb`, App Store/Play Store down the line) and are explicitly designed to
  keep working against old *and* new `sovereign` instance versions — an
  installed desktop/mobile build shouldn't need to move in lockstep with
  the server it happens to point at. Merging repos would pull app-store
  review cycles and server deploys into one version stream.
- **Coordination already happens without merging code.** The shells'
  specs (RFC 0038/0058, RFC 0083 device bridge, epics 17/20) are owned
  centrally in `sovereign` and each shell repo's `docs/roadmap.md`/
  `ROADMAP.md` cross-references the same task IDs — see
  [cross-repo-conventions](cross-repo-conventions.md) for how numbering is
  kept consistent across repos without a shared codebase.

This mirrors the reasoning behind
[two-repo-deploy-model](two-repo-deploy-model.md) (`sovereign` /
`sovereign-infra`): splitting repos along a protocol/deploy boundary rather
than a "who depends on whom" boundary, specifically so the dependent side's
release cadence stays independent.

## The device bridge is the one real shared contract

Both shells implement the same capability-negotiated protocol
(`@sovereignfs/bridge` + `@sovereignfs/sdk/device-client`, RFC 0083) so
plugins can call `sdk.device.*` without either shell drifting from the
other:

- **sovereign-mobile** (Capacitor transport) — built first, task 20.1.
- **sovereign-desktop** (Tauri transport, `src-tauri/src/bridge.rs`,
  `capabilities/bridge.json` granting exactly the loaded instance's origin
  the single `bridge_invoke` command) — added later, workstream 0003 leg 3.
  This is a deliberate, narrowly-scoped exception to desktop's "remote
  content gets no IPC access" rule, not a loosening of it.

Even this shared contract is a spec both repos implement independently
against, not shared source — consistent with the protocol-coupling framing
above.

## Not to be confused with sovereign-edge

`sovereign-edge` also has `apps/desktop` and `apps/mobile` — but that's a
different, self-contained product (standalone on-device inference, no
dependency on a `sovereign` instance) that bundles its own two shippable
surfaces in one repo because *they* share real code
(`packages/desktop-ui`, `packages/mobile-ui`). It isn't evidence for or
against folding `sovereign-desktop`/`sovereign-mobile` into `sovereign` —
the two situations solve different problems.
