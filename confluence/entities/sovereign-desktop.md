---
tags: [entity, runtime, desktop-shell]
repo: git@github.com:sovereignfs/sovereign-desktop.git
updated: 2026-08-06
---

# sovereign-desktop — Sovereign desktop shell

The native desktop shell client for [sovereign](sovereign.md). Intentionally
a "minimal shell": on first launch the user enters their self-hosted
Sovereign instance URL, the app validates it and persists it (multiple
instances supported), then loads that instance in the OS-native WebView. It
ships no product features itself — everything user-facing lives in the
user's own Sovereign instance. Follows the same architectural pattern as
the Nextcloud, Bitwarden, and Element desktop clients. See
[native-shell-clients](../concepts/native-shell-clients.md) for why this
stays a sibling repo instead of a `sovereign/apps/` package.

Validation targets the public `GET /api/instance` endpoint (sovereign epic
task 20.2; `200` + `{status, product, instanceName, platformVersion}`) —
this supersedes the bare `/api/health` liveness probe the shell used
before that endpoint existed, which couldn't reliably distinguish a
genuine Sovereign instance from any other server answering `{"status":
"ok"}`. Never uses the admin-gated `/api/admin/health`.

## Tech stack

- **Tauri 2.x** (`src-tauri/`: `Cargo.toml`, `tauri.conf.json`, `lib.rs` +
  `main.rs`, `capabilities/`, `icons/`, `build.rs`). Uses the system
  WebView per platform (WKWebView / WebView2 / WebKitGTK) — ~5 MB binary.
- Frontend: plain TypeScript, no framework — a small bundled
  onboarding/instance-manager page, Vite 6,
  `@tauri-apps/api` + `@tauri-apps/plugin-http` (shell→instance requests,
  bypasses CORS) + `@tauri-apps/plugin-store` (persistence).
- Build/tooling: pnpm (workspace), TypeScript 5.9 strict
  (`noUncheckedIndexedAccess`), ESLint 9 flat + typescript-eslint strict,
  Prettier, Vitest, Rust stable/cargo.
- CI: format/lint/typecheck/test/`cargo check`; tag-triggered releases
  produce `.dmg`/`.msi`/`.exe`/`.AppImage`/`.deb`.

## Top-level structure

- `src/` — bundled onboarding/instance-manager page: `main.ts` (boot logic
  — loads stored instance or shows onboarding), `onboarding.ts`
  (add/switch/remove instances, health validation), `store.ts`
  (persistence via plugin-store, `instances.json`), `validate.ts` (pure,
  unit-tested URL/health helpers)
- `src-tauri/` — the native app: `lib.rs` (plugin setup, programmatic
  window creation, "Instances → Switch Instance…" menu, injects the
  `window.__SOVEREIGN_DESKTOP__` init script), `tauri.conf.json` (CSP,
  bundle targets, macOS 13 min), `capabilities/default.json` (IPC perms
  for the local page only)
- `index.html`, `vite.config.ts` (fixed port 1420), `tsconfig.json`

## Relationship to sovereign

Explicit **sibling repo** to the `sovereign` monorepo — not a monorepo
package, no embedded runtime code (see
[native-shell-clients](../concepts/native-shell-clients.md) for the
reasoning). It's a thin wrapper that navigates its WebView to a
user-supplied remote Sovereign instance URL:

- Validates reachability via the instance's public `GET /api/instance`
  (see above; must NOT use the admin-gated `/api/admin/health`).
- Remote instance content gets no Tauri IPC/capability access beyond one
  narrow, deliberate exception: the device bridge (below). The
  `window.__SOVEREIGN_DESKTOP__` marker (`{shell, os, version}`) is a
  separate, non-IPC injected artifact — a frozen data object only — that
  `sovereign`'s SDK (`sdk.device.*`, tracked as monorepo epic task 17.7)
  reads for desktop-environment detection.
- This shell's own spec (RFC 0038, epic 17, SRS §3.19) and roadmap/version
  tracking live centrally in [sovereign](sovereign.md)'s
  `docs/roadmap.md` ("Desktop" section) — not duplicated here.

### Device bridge (RFC 0083, workstream 0003 leg 3)

A second `initialization_script`, chained after the marker script above,
defines `window.__SOVEREIGN_BRIDGE__` on every page load — the Tauri
transport of the same `@sovereignfs/bridge` protocol
[sovereign-mobile](sovereign-mobile.md) implements over Capacitor, so
plugins can call `sdk.device.*` from either shell without drifting apart.
Unlike the marker, this **is** real IPC, by deliberate narrow exception to
the "no remote IPC access" rule above: `src-tauri/capabilities/bridge.json`
grants the loaded instance's origin exactly one command,
`bridge_invoke` (`src-tauri/src/bridge.rs`), and nothing else. Currently
dispatches `notifications.native` (real native delivery via
`tauri-plugin-notification`, not the WKWebView `Notification` API);
`haptics.impact` is a deliberate no-op (falls through to `unavailable`) per
RFC 0083 §7 — not a gap to fill casually.

## Notable architectural facts

- Local page acts as a splash: if an active instance is stored it
  immediately `location.replace()`s to it; after that only Rust-side
  handlers (e.g. the menu) keep working.
- Window is created programmatically in Rust (not declared in
  `tauri.conf.json`) specifically to attach the `initialization_script`
  for the device marker.
- Versions are kept in lockstep across `package.json`, `Cargo.toml`, and
  `tauri.conf.json`.
- Hard rule: TypeScript-first, Rust only for native glue that must survive
  WebView navigation to remote content.
- Sibling repo [sovereign-mobile](sovereign-mobile.md) (Capacitor shell)
  now exists — pushed to GitHub, in `workbench.manifest.json`, shell
  scaffold in progress — and shares the device bridge contract above.
