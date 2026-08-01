---
tags: [concept, plugins]
updated: 2026-07-24
---

# Plugin development across repos

[sovereign](../entities/sovereign.md)'s plugin system is the product, not
an add-on, and plugin development spans several repos in the ecosystem:

- **Authoring a new plugin:**
  [sovereign-plugin-template](../entities/sovereign-plugin-template.md) is
  the GitHub template a developer starts from — a self-contained Next.js
  App Router module with a `manifest.json` (identity/routing/permissions)
  and an `app/` directory the runtime composes into its shell.
- **Learning by example:** the first-party reference set demonstrating
  each manifest capability (`shell: default/minimal/overlay`,
  `apiProvider`, permissions, monetization) used to live in a separate
  `sovereign-plugins-examples` repo, cloned in and copied to
  `plugins/<slug>` at build time. That repo has since been deleted and
  the example plugins folded directly into `sovereign`'s own `plugins/`
  workspace, alongside the built-in platform plugins
  (`plugins/console/`, `plugins/launcher/`, `plugins/account/`) — see
  [sovereign](../entities/sovereign.md) for current top-level structure.
- **Installing a plugin into a runtime checkout:** third-party/community
  plugins get cloned into `sovereign/plugins/<name>.local` (gitignored,
  matched via pnpm workspace glob); first-party bundled product plugins
  declared in `sovereign.plugins.json` are installed via
  `scripts/install-plugins.ts` / `pnpm sv plugin add <repo>`.
- **The workbench offers an optional convenience for the `.local` step:**
  `workbench plugins pull` reads a personal, gitignored
  `sovereign.plugins.local` file at this workbench repo's root (moved
  here from `sovereign`'s own retired `setup.sh`) and clones each listed
  repo into `sovereign/plugins/<name>.local`. This is not a hard
  dependency — manually cloning into `plugins/<name>.local` from a bare
  `sovereign` checkout still works with zero involvement from the
  workbench; the CLI command just saves re-typing the list. See this
  workbench's own
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
