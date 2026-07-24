# Research 0004 — Ecosystem dev workbench (`sovereignfs/sovereignfs`) bootstrap

**Status:** Decided direction, not yet built\
**Date:** July 2026\
**Author:** Claude Code (in conversation with the developer)\
**Scope:** New repo `sovereignfs/sovereignfs`; touches this repo's
`apps/docs`/`docs/public` (site source moves out), `setup.sh`, `local/`, and
plugin-development docs\
**Related:** [../../CONCEPT.md](../../CONCEPT.md) — companion plain-language
explainer covering the whole workbench setup, migrated to this repo's root
`CONCEPT.md`

---

## Question

The `sovereignfs` GitHub org has ~20 repos across two independent product
workstreams — **Sovereign Workspace Runtime** (this repo,
`sovereignfs/sovereign`) and **Sovereign OS** (`sovereignfs/sovereign-os`) —
plus plugins and support projects (`sovereign-infra`, `plugin-templates`,
etc). There's no single place to clone/organize the whole ecosystem for local
development, no home for knowledge that spans both workstreams, and the
public docs site (`sovereignfs.github.io`) is built out of this repo even
though it conceptually covers more than this one product. Should a dedicated
"dev workbench" repo exist, and if so, what does it own vs. defer to the
per-project repos?

## Findings

- This repo's `apps/docs` (VitePress) currently builds `sovereignfs.github.io`,
  served from `docs/public`. Verified live on 2026-07-24:
  - Top nav: `Product` (`/product/`) · `Instances` (`/instances.html`) ·
    `Get Started` (`/get-started/`) · `Roadmap` (`/product-roadmap.html`) ·
    `Docs` (`/docs/`) · a GitHub link hardcoded to `sovereignfs/sovereign`.
  - `/docs/` has its own sidebar (Overview, Users, PWA, Operators,
    Developers, Architecture, Contributing) whose pages are mostly **index
    pages linking to full deep content already published at root paths** —
    e.g. `/docs/developers.html` links to `/plugin-development.html`,
    `/sdk-stability.html`, `/architecture-rules.html`,
    `/rfcs/0024-plugin-compatibility.html`. In practice the site already
    publishes close to the full `docs/` corpus of this repo, RFCs included —
    not a small hand-picked subset.
- Plugin development already has a `.local`-clone convention
  (`plugins/<name>.local`, gitignored) that works independently of any
  workbench tooling — see `docs/plugin-development.md`.
- This repo's `CLAUDE.md` treats `docs/` (SRS, RFCs, epics, research) as the
  authoritative source of project state; nothing here proposes changing that
  for this repo or for `sovereign-os`.
- Open, unverified at research time: what `sovereign/local` actually contains
  today beyond `.local` plugin clones. Needs a check against the current repo
  before any removal work begins.

## Options considered

**A — No dedicated repo; ad hoc per-developer scripts.** Lowest effort, but
leaves onboarding and docs-site ownership exactly as fragmented as today, and
doesn't scale as more workstreams/repos are added.

**B — Dedicated `sovereignfs/sovereignfs` workbench repo, optional to use.**
Owns ecosystem-wide bootstrap (`setup.sh` + manifest), ecosystem-wide
knowledge (`CLAUDE.md` + `confluence/`), and the public docs site — while each
product repo keeps owning its own docs/RFCs/SRS as sole source of truth, and
plugin development keeps working with zero dependency on the workbench.
Chosen. Main cost: introduces a second place (`docs/docs-sync.manifest.json`
below) that has to be kept in sync with each repo's doc structure, and a
docs-site build that's no longer self-contained within one repo.

**C — Fold ecosystem docs into one of the product repos (e.g. this one)
rather than a separate repo.** Rejected — this repo's `docs/` is explicitly
scoped to the runtime product per its own `CLAUDE.md`; overloading it with
`sovereign-os` content or ecosystem-wide onboarding would blur that scope and
contradicts the "each repo owns its own docs" principle the developer wants
to preserve.

## Recommendation

Build option B. Decided by the developer in conversation; the shape below is
the agreed bootstrap spec, ready to hand to whoever (human or agent) spawns
`sovereignfs/sovereignfs`.

### Repo layout

```
sovereignfs/sovereignfs/
├── CLAUDE.md                 # agent-facing guidance for the whole ecosystem
├── AGENTS.md                 # (later) same content, agent-agnostic format
├── README.md                 # human-facing entry point, points to setup.sh
├── setup.sh                  # clones/organizes everything per manifest
├── workbench.manifest.json   # source of truth: what repos exist, where they land
├── confluence/                # ecosystem knowledge base (human + agent readable)
│   └── ...                   # cross-cutting docs: how sovereign & sovereign-os relate,
│                              # org conventions, this doc's eventual mirror
├── docs/                     # the sovereignfs.github.io site (VitePress)
│   ├── .vitepress/
│   ├── docs-sync.manifest.json  # curation manifest: source paths → site paths
│   └── ...                   # site content assembled at build time
├── .gitignore                # ignores every dir setup.sh spawns
└── (gitignored, spawned by setup.sh:)
    ├── sovereign/             # clone of sovereignfs/sovereign
    ├── sovereign-os/          # clone of sovereignfs/sovereign-os
    └── support/                # sovereign-infra, plugin-templates, etc.
```

### `workbench.manifest.json`

JSON (matches this ecosystem's existing tooling conventions — `sv` CLI,
`sovereign.plugins.json`), one entry per repo:

```json
{
  "repos": [
    {
      "id": "sovereign",
      "url": "https://github.com/sovereignfs/sovereign.git",
      "path": "sovereign",
      "type": "runtime"
    },
    {
      "id": "sovereign-os",
      "url": "https://github.com/sovereignfs/sovereign-os.git",
      "path": "sovereign-os",
      "type": "os"
    },
    {
      "id": "sovereign-infra",
      "url": "https://github.com/sovereignfs/sovereign-infra.git",
      "path": "support/sovereign-infra",
      "type": "support"
    }
  ]
}
```

`setup.sh`: reads the manifest, `git clone`/`git pull`s each entry into its
`path`, idempotent, all spawned paths gitignored at root. Does **not** clone
plugins — that stays this repo's job (see below). Plugin repos likely don't
belong in this manifest at all (leaning no, not fully decided).

### Docs site target state

- **Root (`sovereignfs.github.io/`) stays exactly as-is** — same URLs, same
  content, same "flagship" role as the org's main entry point. Sourced from
  this repo.
- **New parallel section at `/sovereign-os/`** — full mirrored page set
  (Product / Instances / Get Started / Roadmap / Docs), sourced from
  `sovereign-os`'s own `docs/`. Full page set chosen over docs-only because
  `sovereign-os` has an independent growth trajectory.
- **One VitePress instance, two top-level sections**, shared theme/config.
- Each source repo keeps owning its own `docs/` as sole source of truth —
  this repo's `docs/` does not change scope or move its RFCs/SRS/epics
  anywhere.
- **Sync mechanism: build-time fetch, not checked-in copies.** Given the
  corpus is most of `docs/` per repo including RFCs, checked-in synced
  copies would recreate the "duplicate documents to maintain" problem this
  whole plan exists to avoid. The site build instead fetches source content
  live (sparse-checkout / targeted fetch at build time) driven by
  `docs/docs-sync.manifest.json`; `sovereignfs/sovereignfs` holds site
  config + nav + the curation manifest, never a second copy of prose.
  Trade-off accepted: the build is no longer self-contained within one repo.
- **Nav / discoverability:** today's header has no "which project am I
  looking at" concept. Minimum needed: a link from the flagship to
  `/sovereign-os/` (nav item, footer, or homepage callout), and the
  currently-hardcoded GitHub link needs to become section-aware.

### Plugins & this repo's `setup.sh`

- Plugin repos continue to clone into `sovereignfs/sovereign/plugins/`,
  unchanged — deliberate, so plugin development never depends on the
  workbench repo.
- This repo's own `setup.sh` is retired; its "clone the whole ecosystem"
  role moves to the workbench's root `setup.sh`.
- `docs/plugin-development.md` (and any other doc pointing at the
  now-retired `sovereign/setup.sh`) needs updating to document the
  `.local`-clone-by-hand path explicitly, since that path already works and
  becomes the only path once `setup.sh` here is gone.

### `sovereign/local` removal

Direction: the workbench absorbs whatever role `local/` plays today.
**Unverified** — confirm what `local/` actually contains beyond `.local`
plugin clones before treating this as a clean 1:1 replacement.

## Open questions

1. **Docs sync trigger** — push-based (`repository_dispatch` from source
   repos on merge to `main`), scheduled rebuild, or manual/tag-based publish?
   Needs a spike against GitHub Actions/Pages constraints.
2. **Nav switcher** — one shared nav component parameterized by section, or
   two independently-configured `VPNavBar`s that share a theme? Affects how
   much of the current VitePress theme is reusable as-is.
3. **`local/` contents** — audit before assuming removal is clean.
4. **Manifest `ref`/`branch` pinning** — always track each repo's default
   branch, or allow pinning a ref per entry?
5. **Support-repo placement** — `support/<name>` as sketched above, or flat
   at workbench root? Not discussed in depth; using a reasonable default.
6. **Whether plugin repos belong in `workbench.manifest.json` at all** —
   leaning no (plugins stay this repo's concern), not fully decided.

## Next steps

Doesn't need to graduate to a formal RFC before implementation starts — this
is scaffolding/tooling work, not a platform architecture change requiring
plugin-developer-facing design review. Suggested build order for whoever
spawns `sovereignfs/sovereignfs`:

1. Scaffold repo: `README.md`, `CLAUDE.md`, `.gitignore`, license (match this
   repo's).
2. `workbench.manifest.json` + `setup.sh` (clone-only, no docs work yet).
   Verify it stands up `sovereign` + `sovereign-os` side by side.
3. `confluence/` skeleton, this doc as its first entry (or a copy of it).
4. Docs site: start by lifting `apps/docs` into `sovereignfs/sovereignfs/docs`
   with zero content changes (still pointing at a local `sovereign/docs/`
   checkout) — get root parity working before adding `/sovereign-os/`.
5. Convert the docs build to fetch from a cloned/sparse-checked-out
   `sovereign/` instead of assuming a sibling checkout, so the site also
   builds correctly in CI without the whole ecosystem cloned (resolves open
   question 1 first).
6. Add `/sovereign-os/` section mirroring root's page set, sourced from
   `sovereign-os/docs/`.
7. Wire nav discoverability between the two sections (open question 2).
8. In a follow-up PR to **this repo**: update `plugin-development.md` and any
   doc referencing `sovereign/setup.sh`, and resolve the `local/` audit
   (open question 3) before removing it.
