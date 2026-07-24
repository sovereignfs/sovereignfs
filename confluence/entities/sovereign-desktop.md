---
tags: [entity, runtime, desktop-shell]
repo: git@github.com:sovereignfs/sovereign-desktop.git
updated: 2026-07-24
---

# sovereign-desktop — Sovereign desktop shell

The native desktop shell client for [sovereign](sovereign.md). Intentionally
a "minimal shell": on first launch the user enters their self-hosted
Sovereign instance URL, the app validates it (`GET /api/health`) and
persists it (multiple instances supported), then loads that instance in
the OS-native WebView. It ships no product features itself — everything
user-facing lives in the user's own Sovereign instance. Follows the same
architectural pattern as the Nextcloud, Bitwarden, and Element desktop
clients.

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
package, no embedded runtime code. It's a thin wrapper that navigates its
WebView to a user-supplied remote Sovereign instance URL:

- Validates reachability via the instance's public `GET /api/health`
  (must NOT use the admin-gated `/api/admin/health`).
- Remote instance content never gets Tauri IPC/capability access — the
  only injected artifact is a frozen `window.__SOVEREIGN_DESKTOP__` marker
  (`{shell, os, version}`) that `sovereign`'s SDK (`sdk.device.*`, tracked
  as monorepo epic task 17.7) reads for desktop-environment detection.
- This shell's own spec (RFC 0038, epic 17, SRS §3.19) and roadmap/version
  tracking live centrally in [sovereign](sovereign.md)'s
  `docs/roadmap.md` ("Desktop" section) — not duplicated here.

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
- A sibling `sovereign-mobile` (Capacitor shell) is planned post-v1,
  consuming the same `sdk.device.*` abstraction — not yet built, not in
  `workbench.manifest.json`.
