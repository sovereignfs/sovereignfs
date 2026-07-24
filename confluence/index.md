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
- [sovereign-infra](entities/sovereign-infra.md) — operator-facing VPS
  deployment template (Caddy + Docker Compose + age-encrypted secrets)
  for self-hosting `sovereign`.
- [sovereign-plugin-template](entities/sovereign-plugin-template.md) —
  GitHub template for scaffolding a new third-party Sovereign plugin.
- [sovereign-plugins-examples](entities/sovereign-plugins-examples.md) —
  first-party reference plugins covering each manifest capability.

## Concepts

Cross-cutting ideas that span more than one repo.

- [two-repo-deploy-model](concepts/two-repo-deploy-model.md) — how
  `sovereign` (Provider) and `sovereign-infra` (Operator) split
  build/release from deploy/operate.
- [plugin-development](concepts/plugin-development.md) — how plugin
  authoring, reference examples, and installation into a runtime checkout
  fit together across repos.
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

Repos mentioned in entity pages but not in
[workbench.manifest.json](../workbench.manifest.json) or this confluence
yet: `sovereign-tasks`, `sovereign-plainwrite` (default bundled product
plugins), `storybook` (UI docs site), `sovereign-legacy` (archived),
`sovereign-mobile` (planned, not yet built). Add entity pages once they're
either added to the manifest or become relevant to an ecosystem question.
