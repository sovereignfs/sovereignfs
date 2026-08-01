# AGENTS.md — sovereignfs/sovereignfs

Agent-facing guidance for working in the ecosystem workbench. See
[CONCEPT.md](CONCEPT.md) for the full explainer this summarizes.

## What this repo owns

Only ecosystem-level concerns: the manifest-driven CLI (`workbench.sh` +
`cli/`), cross-project knowledge (`confluence/`), and the shared public docs
site (`docs/`). It does **not** own any product repo's docs,
RFCs, SRS, or plugin workflow — those stay in `sovereign` and `sovereign-os`
respectively. If a task is about one product's architecture or feature
work, go read that product's own `AGENTS.md` inside its checkout
(`sovereign/AGENTS.md`, `sovereign-os/AGENTS.md`; `sovereign` also has a
`CLAUDE.md` mirroring it) — don't look for it here.

## Layout

- `workbench.manifest.json` — source of truth for every repo in the
  ecosystem: id, clone URL, local path, type.
- `workbench.sh` — thin shim into `cli/`, the actual CLI implementation.
- `confluence/` — the ecosystem wiki: entity pages per repo, cross-cutting
  concept pages, and decision history. See below.
- `sovereign/`, `sovereign-os/`, `sovereign-desktop/`, `support/`, `pods/`
  — gitignored, spawned by the CLI. Never assume these exist; always
  check before reading from them.
- `sovereign.plugins.local` — gitignored, personal list of plugin repos to
  clone into `sovereign/plugins/<name>.local` via `workbench plugins
  pull`. See `sovereign.plugins.local.example` for the format.
- `docs/` — the VitePress app behind `sovereignfs.github.io`.
  `docs/docs-sync.manifest.json` is the source-of-truth allowlist mapping
  paths in `sovereign`'s `docs/` to this site's routes; `docs/.fetched/`
  (gitignored, rebuilt by `workbench docs fetch`) is where that content
  actually lands before `vitepress build`/`dev` reads it as `srcDir`.
  Never edit anything under `.fetched/` — it's regenerated on every fetch.
  `.github/workflows/docs.yml` builds on PR and deploys to the external
  `sovereignfs/sovereignfs.github.io` repo on a `docs-vX.Y.Z` tag push or
  manual dispatch — same tag convention `sovereign`'s retired doc CI used.

## Using confluence/

Before answering any question about the ecosystem (what a repo does, how
two repos relate, what conventions a repo follows), read
[confluence/index.md](confluence/index.md) first — it catalogs every page
in the wiki. Don't re-derive facts about a repo from scratch if a
confluence page already covers it; read raw sources (a cloned repo's own
docs) only when confluence doesn't have the answer or looks stale.

If you learn something about the ecosystem worth keeping — a repo's
purpose changed, a new repo was added, a cross-repo relationship was
discovered — update the relevant confluence page(s), `index.md`, and
append a `log.md` entry, following the conventions in
[confluence/SCHEMA.md](confluence/SCHEMA.md). This is a wiki an agent
maintains over time, not a one-time snapshot — treat inaccurate or stale
pages as bugs to fix, not just facts to note.

Each product repo releases on its own schedule with no shared CI, so
nothing pings confluence automatically when a source repo changes. Before
leaning heavily on an entity page for a task, run
`./workbench.sh confluence lint` (or `confluence sync` to `git pull` the
repos first) to check whether its source has moved past the page's
`updated` date. If it finds stale pages, it prints a ready-made
"Re-ingest prompt" listing exactly which pages/repos need re-reading —
act on that prompt yourself (or paste it to another agent session)
rather than treating a stale report as informational only.

## Working here

- Changes to `workbench.manifest.json` are the primary way to add/move a
  repo in the ecosystem — update it rather than hardcoding paths in the CLI.
- Pods (`pods/p<n>` for `sovereign`, `pods/os<n>` for `sovereign-os`) are
  fully disposable — never assume state there persists, and never write
  ecosystem-wide knowledge into a pod.
- The docs site fetches product-repo content at build time via
  `docs/docs-sync.manifest.json`; it does not hold checked-in copies of
  another repo's prose. If asked to update site content, check whether the
  actual source of truth is in `sovereign/docs/` or `sovereign-os/docs/`
  instead of editing here. To add a page to the site, add an entry to
  `docs/docs-sync.manifest.json` (the manifest *is* the public/private
  policy — only listed paths are ever fetched, replacing what used to be
  `apps/docs/.vitepress/publication.ts`'s runtime allowlist/denylist logic
  in `sovereign`) rather than editing `sovereign`'s doc structure to "make
  something public."
- **Every change under `docs/` requires a version bump in `docs/package.json`,
  in the same commit** — theme/component edits (`docs/.vitepress/theme/`),
  config (`docs/.vitepress/config.ts`, `publication.ts`), the sync manifest,
  or anything else in `docs/`. This is the site's own release train,
  independent of the root workbench version and of `sovereign`'s/
  `sovereign-os`'s own versioning — the deploy workflow
  (`.github/workflows/docs.yml`) publishes to
  `sovereignfs/sovereignfs.github.io` on a `docs-vX.Y.Z` tag push (or
  manual dispatch), and that tag should match `docs/package.json`'s
  version. Follow the same `fix/`→patch, `feat/`→minor semver split
  `sovereign`'s own `CLAUDE.md` uses; bump first, then tag when actually
  ready to deploy — don't let commits accumulate against a stale version.
- `sovereign`'s own `setup.sh` is retired in favor of this repo's CLI. Its
  plugin-clone step moved here as `workbench plugins pull`, reading
  `sovereign.plugins.local` from this repo's root instead of `sovereign`'s.
  Plugin *authoring* itself is still entirely standalone — manually
  cloning a repo into `sovereign/plugins/<name>.local` always works
  without the workbench; this command is just a convenience for
  maintaining that list in one place.
- `workbench kill-port [spec...]` kills whatever's listening on the given
  ports — each spec is a single port (`3000`), a range (`3000-3002`), or
  several space-separated (`3001 3002 4000`). No args defaults to
  `3000-3999`, `4000-4999`, `5000-5999` (where dev servers and pod port
  blocks tend to land). It doesn't check ownership before killing, so
  don't run it against specs with unrelated work you
  want to keep alive.
- `workbench clear [--w <id>]` resets a checkout back to a clean main:
  `git stash push --include-untracked` (safety net, not a discard — nothing
  is lost), `git checkout main`, `git pull --ff-only`. With no args it runs
  across `root` (this repo) plus every repo in the manifest, including
  `support/*`; `--w <id>` scopes it to one (`--w sovereign`, `--w root`,
  etc). Reach for it to start a session from a known-clean slate — it
  won't touch anything not already committed or stashed, but a stash still
  needs an explicit `git stash pop` to bring the work back.
