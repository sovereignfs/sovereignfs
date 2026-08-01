---
tags: [concept, plugins]
updated: 2026-08-01
---

# Plugin development across repos

[sovereign](../entities/sovereign.md)'s plugin system is the product, not
an add-on, and plugin development spans several repos in the ecosystem:

- **Authoring a new plugin:**
  [sovereign-plugin-template](../entities/sovereign-plugin-template.md) is
  the GitHub template a developer starts from — a self-contained Next.js
  App Router module with a `manifest.json` (identity/routing/permissions)
  and an `app/` directory the runtime composes into its shell.
- **Learning by example:** eight first-party reference plugins
  demonstrating each manifest capability (`shell: default/minimal/overlay`,
  `apiProvider`, permissions, monetization, mobile layout) live in-repo
  under `sovereign`'s `example-plugins/` — a **sibling of `plugins/`, not
  a subdirectory**, git-tracked (not gitignored). They're composed into a
  build only when the `SOVEREIGN_EXAMPLES_ENABLED` env var is set (off by
  default; the published GHCR image never sets it). This directory used
  to be a separate `sovereign-plugins-examples` repo cloned at build time;
  that repo was deleted 2026-08-01 in favor of the in-repo, always-on-disk
  version — see `docs/adhoc/example-plugins-plan.md` and
  `docs/self-hosting.md`'s "Reference example plugins" section inside
  `sovereign`, and [sovereign](../entities/sovereign.md) for current
  top-level structure.
- **Installing a plugin into a runtime checkout:** third-party/community
  plugins get cloned into `sovereign/plugins/<name>.local` (gitignored,
  matched via pnpm workspace glob); first-party bundled product plugins
  declared in `sovereign.plugins.json` are installed via
  `scripts/install-plugins.ts` / `pnpm sv plugin add <repo>`. As of this
  ingest `sovereign.plugins.json` is empty by default and
  `registry/plugins.json` (the plugin submission registry —
  `registry/CONTRIBUTING.md`) has no entries yet, so no product/community
  plugin actually ships by default despite SRS mentions of "Tasks,
  Plainwrite" as default-bundled. See Gaps in [index.md](../index.md) for
  the individual plugin repos that exist and are cloned locally as
  personal `.local` dev checkouts, but aren't in this registry or
  confluence yet.
- **Plugin repo naming:** product plugin repos follow
  `sovereignfs/sovereign-plugin-<name>` (e.g. `sovereign-plugin-tasks`),
  renamed ecosystem-wide from the older `sovereign-<name>` form (see
  `log.md`'s 2026-08-01 entries). This is a repo-naming convention only —
  it doesn't affect a plugin's own `package.json` name or manifest `id`,
  which stay independent (per `sovereign`'s `docs/repositories.md` naming
  notes).
- **The workbench offers an optional convenience for the `.local` step:**
  `workbench plugins pull` reads a personal, gitignored
  `sovereign.plugins.local` file at this workbench repo's root (moved
  here from `sovereign`'s own retired `setup.sh`) and clones each listed
  repo into `sovereign/plugins/<name>.local`. Since 2026-08-01, when a
  URL-only entry's repo name matches `sovereign-plugin-<name>`, the
  derived local dir name drops the `plugin-` segment
  (`sovereign-plugin-tasks` → `sovereign-tasks.local`) — explicit
  `<name> <git-url>` entries are unaffected, since the name is already
  user-supplied. This is not a hard dependency — manually cloning into
  `plugins/<name>.local` from a bare `sovereign` checkout still works with
  zero involvement from the workbench; the CLI command just saves
  re-typing the list. See this workbench's own
  [CONCEPT.md](../../CONCEPT.md#plugin-development-is-mostly-unaffected).

## Shared contract

Every plugin — template-scaffolded, first-party example, or bundled
product plugin — talks to the runtime only through `@sovereignfs/sdk`
(auth, db, mailer, platform-config APIs). Plugins cannot import
`runtime/src` directly; this is ESLint-enforced in `sovereign`. The SDK
itself is zero-dependency and versioned independently under NFR-04 (no
breaking changes in patch releases) — see
[sovereign](../entities/sovereign.md) for its full architectural
boundary rules.
