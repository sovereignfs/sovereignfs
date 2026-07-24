# sovereignfs/sovereignfs

The optional dev workbench for the Sovereign ecosystem — see
[CONCEPT.md](CONCEPT.md) for the full explainer.

Cloning this repo is never required to work on either product repo
(`sovereign` or `sovereign-os`) — both stand on their own. Use this repo if
you want the whole ecosystem checked out and organized in one step, need
knowledge that spans all projects, or want isolated "pod" checkouts for
running concurrent AI agent sessions safely.

## Getting started

```sh
git clone https://github.com/sovereignfs/sovereignfs.git
cd sovereignfs
./workbench.sh init
```

This clones every repo listed in [workbench.manifest.json](workbench.manifest.json)
into its place alongside this one:

```
sovereignfs/
├── sovereign/           # Sovereign Workspace Runtime
├── sovereign-os/        # Sovereign OS
├── sovereign-desktop/   # Desktop app for Sovereign Workspace Runtime
├── support/             # sovereign-infra, sovereign-plugins-examples, sovereign-plugin-template
└── pods/                # created on demand, see below
```

Re-running `init` is safe — it pulls existing checkouts instead of
re-cloning them.

Repos are cloned over SSH (`git@github.com:...`) by default. If you don't
have SSH keys set up for GitHub, use HTTPS instead:

```sh
./workbench.sh init --https
```

## Pods: isolated checkouts for parallel work

Running a second concurrent session against a project you already have
checked out at the root? Create a pod instead of interrupting your main
checkout:

```sh
./workbench.sh pod create sovereign      # → pods/p1, p2, ...
./workbench.sh pod create sovereign-os   # → pods/os1, os2, ...
```

Each pod is a fully independent clone — its own `.git`, `node_modules`,
`.env` (with ports rewritten to a reserved block), and local data. See
[CONCEPT.md](CONCEPT.md#pods-isolated-checkouts-for-parallel-work) for
details.

## Freeing up dev ports

Across the ecosystem, dev servers tend to land in the 3000s (`sovereign`'s
runtime/auth), 4000s, and 5000s (pod port blocks start at 5000/5001 for
`p1`). If something's stuck listening and you just want a clean slate:

```sh
./workbench.sh kill-port                    # kills 3000-3999, 4000-4999, 5000-5999
./workbench.sh kill-port 3000               # a single port
./workbench.sh kill-port 3000-3002          # a range
./workbench.sh kill-port 3001 3002 4000     # any mix, space-separated
```

This kills whatever process is listening, full stop — it doesn't check
which project owns it, so don't run it if you have unrelated work on those
ports you want to keep alive.

## Local plugin development

`sovereign` composes plugins cloned into `sovereign/plugins/<name>.local`.
Which repos to clone is your own, git-ignored list — copy
[sovereign.plugins.local.example](sovereign.plugins.local.example) to
`sovereign.plugins.local` at this repo's root and edit it, then:

```sh
./workbench.sh plugins pull
```

This clones every listed repo into `sovereign/plugins/<name>.local`
(skipping ones that already exist). Run `pnpm install` inside `sovereign/`
afterward so pnpm links their workspace deps.

## What lives here vs. in the product repos

- **This repo:** ecosystem-wide bootstrap (the CLI + manifest), the
  optional plugin-pull convenience above, knowledge that spans both
  products (`confluence/`), and the public docs site (`docs/`).
- **Each product repo:** its own docs, RFCs, SRS, and plugin authoring
  workflow — none of that moves here. Plugin development still works
  entirely standalone from a bare `sovereign` checkout — manually cloning
  into `plugins/<name>.local` yourself always works — `workbench plugins
  pull` is just a convenience for maintaining that list in one place when
  you're already using the workbench.

## The public docs site

`docs/` is the VitePress app behind `sovereignfs.github.io` — the root site
sourced from `sovereign`, plus a `/sovereign-os/` section sourced from
`sovereign-os`. Neither product's content is checked in — it's fetched at
build time per [docs/docs-sync.manifest.json](docs/docs-sync.manifest.json),
so there's never a second copy of that prose to keep in sync by hand:

```sh
cd docs
pnpm install
pnpm dev     # fetches, then starts the dev server at http://localhost:3002
pnpm build   # fetches, then builds .vitepress/dist
```

`workbench docs fetch` (run automatically by both scripts above via
`predev`/`prebuild`) does a shallow sparse-checkout of just the manifest's
listed paths from `sovereign` into `docs/.fetched/` — nothing outside that
allowlist is ever pulled, so private docs (epics, research, the SRS) can't
leak even by future oversight in `sovereign`'s own repo structure.

### Publishing

[.github/workflows/docs.yml](.github/workflows/docs.yml) builds on every PR
touching `docs/**` (via `--https`, since CI has no SSH key), and deploys on
either a manual run or a `docs-vX.Y.Z` tag push — same tag convention
`sovereign`'s retired `apps/docs` CI used. Deploy publishes
`docs/.vitepress/dist` to the external `sovereignfs/sovereignfs.github.io`
repo via `peaceiris/actions-gh-pages`, authenticated with a
`DOCS_DEPLOY_TOKEN` repo secret (a PAT with push access to that repo) —
same mechanism as before, just triggered from this repo instead of
`sovereign`.

```sh
git tag docs-v0.1.0
git push origin docs-v0.1.0
```

## Ecosystem knowledge

- [AGENTS.md](AGENTS.md) — agent-facing guidance for working across the
  ecosystem (`CLAUDE.md` points here too, for Claude Code's auto-discovery).
- [confluence/](confluence/) — longer-form cross-project knowledge and
  decision history.

Each repo in the ecosystem releases independently with no shared CI, so
confluence doesn't update itself. Check for drift manually:

```sh
./workbench.sh confluence lint   # report pages older than their source repo's last commit
./workbench.sh confluence sync   # same, but "git pull"s each mapped repo first
```

Neither command edits page content — they report which pages need a
re-read against the source, and print a ready-to-paste prompt for
whichever agent does that re-read. See
[confluence/SCHEMA.md](confluence/SCHEMA.md#workflows) for the full
ingest/query/lint workflow.
