---
tags: [entity, support, plugin-development]
repo: git@github.com:sovereignfs/sovereign-plugin-template.git
updated: 2026-07-24
---

# sovereign-plugin-template — plugin starter

A GitHub template repo ("Use this template") for scaffolding a new
[sovereign](sovereign.md) plugin — a self-contained Next.js App Router
module the runtime composes into its shell at a chosen `routePrefix`. No
standalone `next dev`; you develop it live against a running Sovereign
instance after cloning it in as `sovereign/plugins/<slug>` (or
`pnpm sv plugin add <repo>`). See
[plugin-development](../concepts/plugin-development.md) for the full
cross-repo workflow.

## Key files

- `manifest.json` — identity/routing/capabilities, validated at build
  time. Fields: `schemaVersion`, `id` (reverse-DNS), `name`, `version`,
  `description`, `type` (`sovereign`|`community`), `runtime` (`native`),
  `routePrefix`, `shell` (`default`|`overlay`, +
  `shellConfig.overlaySize`), `icon`, `adminOnly`, `apiProvider`,
  `permissions` (e.g. `auth:session`, `db:readOnly`/`readWrite`,
  `mailer:send`, `data:provide`/`consume`, `activity:write`),
  `repository`, `compatibility.minPlatformVersion`, `data` (RFC 0002
  cross-plugin sharing)
- `package.json` — deps `@sovereignfs/sdk`, `@sovereignfs/ui`, `next`,
  `react`/`react-dom`; devDep `@sovereignfs/tsconfig`; only script is
  `typecheck`
- `tsconfig.json` extends `@sovereignfs/tsconfig/nextjs.json`;
  `icon.svg` (24×24 stroke); `.env.example`
- `app/` — `page.tsx` (root route), `my-plugin.module.css` (slug-named,
  must be renamed), optional `layout.tsx`, `settings/page.tsx`,
  underscore-prefixed `_components/`/`_lib/` (never routed). Optional
  `db/schema.ts` for Drizzle tables (must slug-prefix table names and
  include `tenant_id`)

## Tech stack

Next.js App Router + React + TypeScript, `@sovereignfs/sdk`
(auth/db/mailer/platform-config APIs, runtime-injected), `@sovereignfs/ui`
component library with CSS-variable design tokens (`--sv-*`), Drizzle ORM
for optional persistence.

## Relationship to sovereign

Consumed by `sovereign`'s plugin-installation mechanism
(`pnpm sv plugin add`, `sovereign.plugins.json`,
`scripts/install-plugins.ts`), which clones a plugin repo to
`sovereign/plugins/<name>.local`. This repo is the starting point a
developer clones/uses-as-template to author a brand-new third-party
(`community`) plugin. Shares the identical file shape (`manifest.json` +
`app/` + `package.json` + `icon.svg`) with the first-party example
plugins now living directly in `sovereign`'s own `plugins/` workspace
(formerly a separate `sovereign-plugins-examples` repo, since deleted —
see [sovereign](sovereign.md) and
[plugin-development](../concepts/plugin-development.md)), since both
are built to be dropped into `sovereign/plugins/`.
