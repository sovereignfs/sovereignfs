# Confluence index

Read this first — see [SCHEMA.md](SCHEMA.md) for how this wiki is
maintained and updated.

## Entities

One page per repo in [workbench.manifest.json](../workbench.manifest.json).

- [sovereign](entities/sovereign.md) — the flagship Sovereign Workspace
  Runtime: Next.js/TypeScript monorepo, plugin-hosting platform, one
  login/database/design-system.
- [sovereign-os](entities/sovereign-os.md) — Sovereign OS: a Raspberry-Pi
  appliance OS/image-builder project. A separate product workstream in
  the same ecosystem, deliberately independent of the runtime — no shared
  codebase or features.
- [sovereign-desktop](entities/sovereign-desktop.md) — Tauri-based native
  desktop shell that loads a user's Sovereign instance in a WebView.
- [sovereign-mobile](entities/sovereign-mobile.md) — Capacitor-based native
  mobile shell (iOS + Android), same pattern as sovereign-desktop, plus a
  device-bridge layer for `sdk.device.*`. Repo created and pushed to
  GitHub; shell scaffold (epic task 20.1) in progress, verified on iOS
  Simulator, Android not yet compile-verified.
- [sovereign-infra](entities/sovereign-infra.md) — operator-facing VPS
  deployment template (Caddy + Docker Compose + age-encrypted secrets)
  for self-hosting `sovereign`.
- [sovereign-plugin-template](entities/sovereign-plugin-template.md) —
  GitHub template for scaffolding a new third-party Sovereign plugin.

`sovereign-plugins-examples` (first-party reference plugins) used to have
its own entity page here; the repo was deleted 2026-08-01 and its plugins
moved in-repo to `sovereign`'s git-tracked `example-plugins/` directory
(a sibling of `plugins/`, composed only when `SOVEREIGN_EXAMPLES_ENABLED`
is set) — see [sovereign](entities/sovereign.md) and
[plugin-development](concepts/plugin-development.md).

## Concepts

Cross-cutting ideas that span more than one repo.

- [two-repo-deploy-model](concepts/two-repo-deploy-model.md) — how
  `sovereign` (Provider) and `sovereign-infra` (Operator) split
  build/release from deploy/operate.
- [plugin-development](concepts/plugin-development.md) — how plugin
  authoring, first-party reference examples (now inside `sovereign`
  itself), and installation into a runtime checkout fit together.
- [cross-repo-conventions](concepts/cross-repo-conventions.md) — why
  documentation numbering (RFCs, ADRs, SRS) and AI-agent commit
  conventions differ per repo, and don't transfer between them.

## Research

Numbered decision records, append-only history — see
[SCHEMA.md](SCHEMA.md#page-types).

- [0004-dev-workbench-bootstrap](research/0004-dev-workbench-bootstrap.md)
  — the research doc that decided this workbench repo's own shape (see
  root [CONCEPT.md](../CONCEPT.md) for the resulting design).

## Gaps (known, not yet mapped)

**Individual plugin repos** — not in `workbench.manifest.json` and not
given their own entity pages (per `sovereign`'s own `docs/repositories.md`,
these are tracked via `registry/plugins.json` there, not a repo-map table —
that registry is currently empty). Confirmed to exist as
`sovereignfs/sovereign-plugin-<name>` (one is `kasunben/`-owned, not
`sovereignfs/`) and cloned locally as personal `.local` dev checkouts
under `sovereign/plugins/` as of 2026-08-01: `docs`, `healthlog`, `ledger`,
`papertrail` (`kasunben/sovereign-plugin-papertrail`), `plainwrite`,
`sheets`, `shopper`, `tally`, `tasks`, `tritext`, `wallet`. Each plugin's
in-tree `package.json` `"name"` still reads `@sovereignfs/sovereign-<name>`
(pre-rename form) rather than `@sovereignfs/sovereign-plugin-<name>` —
per `sovereign`'s naming notes this is expected/harmless (repo name,
package name, and manifest `id` are independent), not drift to fix.
`sovereign-tritext`'s package name is the outlier, `@sovereignfs/plugin-tritext`
(no `sovereign-` at all) — unclear if intentional.
- `sovereign-plugin-tasks`, `sovereign-plugin-plainwrite` — referenced in
  the SRS as default-bundled product plugins, though `sovereign.plugins.json`
  is currently empty so neither actually ships by default
- The other nine (`docs`, `healthlog`, `ledger`, `papertrail`, `sheets`,
  `shopper`, `tally`, `tritext`, `wallet`) aren't referenced in any
  `sovereign` doc as bundled/default — apparently personal/in-development
  plugins, not yet part of any documented product line

**Other repos** — `storybook` (`sovereignfs/storybook`, GitHub Pages
deployment target for the `@sovereignfs/ui` Storybook site — confirmed
active per `docs/repositories.md`), `sovereignfs.github.io`
(`sovereignfs/sovereignfs.github.io`, GitHub Pages deployment target for
the public docs site, built from this workbench repo), `sovereign-legacy`
(`sovereignfs/sovereign-legacy`, confirmed archived — kept for historical/
migration reference only), `sovereign-edge` (React Native standalone AI
app — has an entity in the manifest but no confluence page yet; not to be
confused with `sovereign-mobile`, above). Add entity pages once any of
these become relevant to an ecosystem question.
