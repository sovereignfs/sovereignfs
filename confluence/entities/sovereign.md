---
tags: [entity, runtime, flagship]
repo: git@github.com:sovereignfs/sovereign.git
updated: 2026-08-01
---

# sovereign — Sovereign Workspace Runtime

The flagship product of the sovereignfs ecosystem: a modular,
self-hostable workspace runtime — one login, one database, one design
system, one shell — that hosts installable plugins as first-class
applications. The plugin system *is* the product, not a bolt-on. Positioned
as privacy-first, single-tenant/multi-user, AGPL-3.0-or-later, part of a
"digital self-determination" philosophy against Big Tech data extraction
(see its `MANIFESTO`, authored by Kasun Benthara, Oct 2025). Pre-v1 (0.53.x
at time of writing), targeting a v1.0.0 public release milestone.

## Tech stack

- TypeScript, Next.js 15 (App Router)
- Turborepo + pnpm workspaces (pnpm 11.5.2 pinned, Node ≥24)
- Auth: better-auth, run as its own app (`apps/auth`)
- Data: Drizzle ORM, SQLite by default / Postgres optional;
  `better-sqlite3-multiple-ciphers` for optional at-rest encryption
- Email: nodemailer abstraction (`packages/mailer`)
- UI: CSS Modules + CSS custom properties — no Tailwind, no CSS-in-JS —
  via the `@sovereignfs/ui` design system (Storybook-documented)
- Build: `tsup`; validation: Zod (manifest schema); CLI: `citty` + `consola`
  (`bin/sv`)
- Testing: Vitest + Testing Library/jsdom, Playwright (e2e)
- PWA via `@ducanh2912/next-pwa`; deploys via Docker Compose
  (dev/prod/Postgres variants)

## Top-level structure

- `apps/auth/` — better-auth identity server (the only separate Next.js app)
- `apps/docs/` — VitePress doc site source (private)
- `packages/sdk/` — published plugin↔platform contract (`@sovereignfs/sdk`,
  zero-deps)
- `packages/ui/` — published design system (`@sovereignfs/ui`)
- `packages/db/`, `packages/manifest/`, `packages/mailer/` — Drizzle
  client/schema, manifest validation, mail abstraction (all private)
- `packages/tsconfig/` — shared TS configs
- `packages/create-plugin/` — published scaffolder
  (`npm create @sovereignfs/plugin`)
- `runtime/` — "Sovereign Core": Next.js shell, middleware, plugin host, SDK
  bridge, generated route registry
- `plugins/console/`, `plugins/launcher/`, `plugins/account/` — built-in
  platform-type plugins (admin console, home screen, profile)
- `example-plugins/` — a **sibling of `plugins/`, not a subdirectory** —
  eight in-repo, git-tracked reference/teaching plugins (`example-basic`,
  `example-api`, `example-minimal`, `example-monetized`,
  `example-overlay-{small,medium,large}`, `example-mobile`). Composed into
  the build only when `SOVEREIGN_EXAMPLES_ENABLED` is set (off by
  default; the published GHCR image never enables it). Formerly lived in
  a separate `sovereign-plugins-examples` repo, cloned at build time; that
  repo was deleted 2026-08-01 and the examples moved in-repo instead — see
  `docs/adhoc/example-plugins-plan.md` in this repo and
  [plugin-development](../concepts/plugin-development.md).
- `registry/` — public plugin index (`plugins.json`) + submission process.
  Currently empty (`{"registryVersion": 1, "plugins": []}`) — no
  first-party/community plugin has been published through it yet, despite
  the SRS's "Tasks, Plainwrite" default-bundled framing; see Gaps in
  [index.md](../index.md).
- `scripts/` — install-plugins, generate-registry, dev orchestrator
- `bin/sv` — the `sv` CLI wrapping common tasks
- `docker/`, `Dockerfile`, `docker-compose*.yml` — self-host deployment
- `sovereign.plugins.json` — declares which external product plugins to
  clone at build time (empty by default — `sovereign.plugins.default.json`
  is `{"plugins": []}`)

## Documentation conventions

Rich, agent-oriented: `docs/rfcs/` (numbered `0001-...` proposals + status
index), `docs/epics/` (task-detail files matched to `ROADMAP.md` epic task
IDs like `9.9`), `docs/research/` (pre-RFC exploratory docs — not every
research doc graduates to an RFC), a Concept/Plan/**SRS** doc
(`docs/sovereign-proposal-plan-srs.md`, numbered sections e.g. §3.12, NFRs
like NFR-04), `architecture.md` / `architecture-rules.md`, `product/` /
`product-roadmap.md`, `development-workflow.md` (defines the
`CURRENT_TASK.md` mechanism), `multi-agent.md` (Claude Code + Codex
division of labor and commit attribution), plus operational docs
(self-hosting, security, upgrade, troubleshooting, plugin-development,
sdk-stability, design-system). `ROADMAP.md` is a chronological
version→epic-task-ID→status index; epic task IDs are permanent, roadmap
slot versions are volatile.

## Relationships to other sovereignfs repos

`docs/repositories.md` (inside this repo) is the canonical repo map —
re-read as of 2026-08-01, superseding this page's earlier summary:

- [sovereign-plugin-template](sovereign-plugin-template.md) — standalone
  starter for third-party plugins; the one plugin-shaped repo *without* a
  registry entry, since it isn't itself installable
- Individual product/community plugin repos (`sovereignfs/sovereign-plugin-tasks`,
  `sovereign-plugin-plainwrite`, etc.) are tracked in `registry/plugins.json`
  (submission process: `registry/CONTRIBUTING.md`), not on this repo-map page
  or as confluence entity pages — `registry/plugins.json` is currently
  **empty**, so none are actually registered yet despite being referenced in
  the SRS as default-bundled. See Gaps in [index.md](../index.md) for the
  plugin repos known to exist (cloned locally as `.local` dev checkouts)
  but still unmapped here.
- `storybook` — GitHub Pages deployment target for the built
  `@sovereignfs/ui` Storybook site; source stories live in this repo under
  `packages/ui` (not in `workbench.manifest.json`)
- [sovereign-infra](sovereign-infra.md) — operator-owned VPS deployment
  template; see [two-repo-deploy-model](../concepts/two-repo-deploy-model.md)
- `sovereignfs.github.io` — GitHub Pages deployment target for the public
  docs site; source prose lives in this repo under `docs/`, the VitePress
  app/build config lives in `sovereignfs/sovereignfs` (this workbench)
- [sovereign-mobile](sovereign-mobile.md) — Capacitor shell, sibling to
  [sovereign-desktop](sovereign-desktop.md), both consuming `sdk.device.*`.
  **Note:** as of this repo's own `docs/repositories.md`, that page still
  says "Not yet created" — stale; the repo was created and pushed 2026-07-31
  per this confluence's own [sovereign-mobile](sovereign-mobile.md) page and
  `log.md`. Flagged there as a known follow-up for `sovereign`'s own next
  docs pass, not something this confluence can fix directly.
- `sovereignfs/sovereign-legacy` — archived prior codebase, kept for
  historical/migration reference only

## Notable architectural facts

- Plugins are cloned as `plugins/<name>.local` (gitignored, pnpm workspace
  glob) or declared in `sovereign.plugins.json` for the `install:plugins`
  script; `.local` plugin installs always break `--frozen-lockfile` by
  design. See [plugin-development](../concepts/plugin-development.md).
- Hard boundary: plugins cannot import `runtime/src`, only
  `@sovereignfs/sdk` (ESLint-enforced); the SDK itself must stay
  zero-dependency.
- Product plugin repo names follow `sovereignfs/sovereign-plugin-<name>`
  (e.g. `sovereign-plugin-tasks`) per `docs/repositories.md`'s naming
  notes — deliberately doesn't affect a plugin's own `package.json` name
  or manifest `id`, which stay independent of repo naming.
- The `Dockerfile`'s app-builder plugin-staging `RUN` step
  (stages each `plugins/*/`'s `manifest.json` + optional `migrations/`
  into `/app/.deploy/plugins/`) had a latent bug fixed 2026-08-01: its
  per-plugin shell function ended on a bare `[ -d ... ] && cp ...` test,
  so a false test on the alphabetically-last plugin directory (`launcher`,
  which has no migrations) made the whole `RUN` fail with exit 1 even
  though nothing was actually wrong. Fixed by adding a trailing `true;`
  so the function always returns success.
- Terminology split: "plugin" is the internal/technical term, "app" is the
  user-facing term — never leak "plugin" into end-user UI text.
- Single owned npm scope `@sovereignfs/*` ("fs" = "federated systems,"
  reflecting a long-term federation goal, explicitly deferred post-v1).
  Only `sdk`, `ui`, `create-plugin` are published to npm.
- Design tokens use a `--sv-*` prefix, two-tier (primitive/semantic),
  monochrome v1 identity.
- Multi-agent development model: both Claude Code and Codex work this
  repo, each from its own clone, with distinguishable commit trailers.
