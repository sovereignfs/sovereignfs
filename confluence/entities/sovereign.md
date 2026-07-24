---
tags: [entity, runtime, flagship]
repo: git@github.com:sovereignfs/sovereign.git
updated: 2026-07-24
---

# sovereign — Sovereign Workspace Runtime

The flagship product of the sovereignfs ecosystem: a modular,
self-hostable workspace runtime — one login, one database, one design
system, one shell — that hosts installable plugins as first-class
applications. The plugin system *is* the product, not a bolt-on. Positioned
as privacy-first, single-tenant/multi-user, AGPL-3.0-or-later, part of a
"digital self-determination" philosophy against Big Tech data extraction
(see its `MANIFESTO`, authored by Kasun Benthara, Oct 2025). Pre-v1 (0.44.x
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
- `registry/` — public plugin index (`plugins.json`) + submission process
- `scripts/` — install-plugins, generate-registry, dev orchestrator
- `bin/sv` — the `sv` CLI wrapping common tasks
- `docker/`, `Dockerfile`, `docker-compose*.yml` — self-host deployment
- `sovereign.plugins.json` — declares which product plugins to clone
  (e.g. sovereign-tasks, sovereign-plainwrite, plus examples)

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

`docs/repositories.md` (inside this repo) is the canonical repo map.
Summary as of this ingest:

- [sovereign-plugin-template](sovereign-plugin-template.md) — standalone
  starter for third-party plugins
- [sovereign-plugins-examples](sovereign-plugins-examples.md) — bundled
  first-party example plugins
- `sovereign-tasks`, `sovereign-plainwrite` — default bundled,
  independently-versioned product plugins (not yet mapped in this
  confluence — not in `workbench.manifest.json`)
- `storybook` — deployed UI docs site, source lives in this repo (not yet
  in the manifest)
- [sovereign-infra](sovereign-infra.md) — operator-owned VPS deployment
  template; see [two-repo-deploy-model](../concepts/two-repo-deploy-model.md)
- `sovereignfs.github.io` — deployed public VitePress docs site, source
  lives in this repo today (see the workbench's own
  [CONCEPT.md](../../CONCEPT.md) for the plan to move this to the
  workbench repo)
- Post-v1 plans reference a `sovereign-mobile` (Capacitor shell) repo not
  yet built, sibling to [sovereign-desktop](sovereign-desktop.md) — both
  consume the same `sdk.device.*` abstraction
- `sovereign-legacy` — archived prior codebase

## Notable architectural facts

- Plugins are cloned as `plugins/<name>.local` (gitignored, pnpm workspace
  glob) or declared in `sovereign.plugins.json` for the `install:plugins`
  script; `.local` plugin installs always break `--frozen-lockfile` by
  design. See [plugin-development](../concepts/plugin-development.md).
- Hard boundary: plugins cannot import `runtime/src`, only
  `@sovereignfs/sdk` (ESLint-enforced); the SDK itself must stay
  zero-dependency.
- Terminology split: "plugin" is the internal/technical term, "app" is the
  user-facing term — never leak "plugin" into end-user UI text.
- Single owned npm scope `@sovereignfs/*` ("fs" = "federated systems,"
  reflecting a long-term federation goal, explicitly deferred post-v1).
  Only `sdk`, `ui`, `create-plugin` are published to npm.
- Design tokens use a `--sv-*` prefix, two-tier (primitive/semantic),
  monochrome v1 identity.
- Multi-agent development model: both Claude Code and Codex work this
  repo, each from its own clone, with distinguishable commit trailers.
