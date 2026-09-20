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
  mobile shell (iOS + Android), same pattern as sovereign-desktop; first to
  implement the shared device-bridge layer for `sdk.device.*` (RFC 0083),
  which sovereign-desktop has since also picked up. Repo created and
  pushed to GitHub; shell scaffold (epic task 20.1) in progress, verified
  on iOS Simulator, Android not yet compile-verified.
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
- [native-shell-clients](concepts/native-shell-clients.md) — why
  `sovereign-desktop`/`sovereign-mobile` stay protocol-coupled sibling
  repos instead of `sovereign/apps/` packages, and their shared device-
  bridge contract (RFC 0083).

## Research

Numbered decision records, append-only history — see
[SCHEMA.md](SCHEMA.md#page-types).

- [0004-dev-workbench-bootstrap](research/0004-dev-workbench-bootstrap.md)
  — the research doc that decided this workbench repo's own shape (see
  root [CONCEPT.md](../CONCEPT.md) for the resulting design).

## Gaps (known, not yet mapped)

**Individual plugin repos** — not in `workbench.manifest.json` and not given
their own entity pages. They're tracked in `sovereign`'s own
`registry/plugins.json`, which as of 2026-09-18 holds ten entries, matching
exactly what `support/openfs-infra/sovereign.plugins.json` deploys to the
openfs instance: `fs.sovereign.{docs,kanban,ledger,plainwrite,sheets,shopper,tally,tasks,travellog,wallet}`.
These are no longer an undocumented set — `sovereign`'s
`docs/product/apps.md` now describes each one as a first-party app, so the
public product line and the registry agree.

Each plugin's in-tree `package.json` `"name"` is inconsistent
(`@sovereignfs/sovereign-<name>`, `sovereign-plugin-<name>`, and
`@sovereignfs/plugin-tritext` all appear) — per `sovereign`'s naming notes
this is expected and harmless, since repo name, package name, and manifest
`id` are independent, not drift to fix.

Three repos in the personal clone list (`sovereign.plugins.local`) are in
neither the registry nor the openfs deployment: `healthlog`, `tritext`, and
`papertrail` (`kasunben/`-owned, not `sovereignfs/`). That list has also not
kept up in the other direction — `kanban` and `travellog` are checked out
locally and shipping, but absent from it. Treat `sovereign.plugins.local` as
one developer's scratch list, not a source of truth about the product line;
the registry and the deploy manifest are.

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
