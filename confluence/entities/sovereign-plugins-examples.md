---
tags: [entity, support, plugin-development]
repo: git@github.com:sovereignfs/sovereign-plugins-examples.git
updated: 2026-07-24
---

# sovereign-plugins-examples — reference plugins

A collection of capability-demo plugins for [sovereign](sovereign.md),
each a self-contained plugin illustrating one facet of the plugin runtime.
Not a standalone build target — `package.json` files use
`workspace:*`/`catalog:` deps that only resolve once cloned into the
platform monorepo's `plugins/` workspace. The platform bundles these at
build time by cloning this repo and copying each `<slug>` dir into
`plugins/<slug>` (per `sovereign.plugins.json` /
`scripts/install-plugins.ts`); operators can disable them per-instance
from the Console.

## Examples

Each has its own `manifest.json`, `package.json`, `app/`, `icon.svg`:

- `example-basic` — default shell, `sdk.auth.getSession()`, UI components
  + design tokens
- `example-api` — `apiProvider` pattern (has an `app/serve` route for the
  public `/api/*` namespace)
- `example-minimal` — chrome-less `shell: "minimal"` layout
- `example-monetized` — monetization paywall via entitlement tokens
- `example-overlay-small` / `-medium` / `-large` — `shell: "overlay"`
  modal dialogs at `overlaySize: "sm"/"md"/"lg"`

## Relationship to sovereign

First-party (`sovereign`-owned) reference set showing the range of
manifest options (`shell`, `apiProvider`, permissions, monetization) that
a template-based plugin can also adopt — see
[sovereign-plugin-template](sovereign-plugin-template.md), which shares
the identical file shape because both are built to be dropped into
`sovereign/plugins/`. See
[plugin-development](../concepts/plugin-development.md) for the shared
workflow.
