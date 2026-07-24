# Concept: the Sovereign dev workbench

## What this repo is

`sovereignfs/sovereignfs` is an optional meta-repo for working across the
Sovereign ecosystem — currently two independent product workstreams,
**Sovereign Workspace Runtime** (`sovereignfs/sovereign`) and
**Sovereign OS** (`sovereignfs/sovereign-os`), plus supporting projects.
Cloning it is never required — either product repo can still be cloned and
worked on entirely standalone. The workbench exists for contributors who
want the whole ecosystem organized for them in one step, who need
cross-project context, or who run multiple concurrent AI agent sessions and
need isolated checkouts to do that safely (see
[Pods](#pods-isolated-checkouts-for-parallel-work) below).

It owns three things that don't belong to either product repo individually:
a one-command way to check out the ecosystem, knowledge that spans both
projects, and the public docs site that covers both. It does **not** own
either project's docs, RFCs, SRS, or plugin workflow — those stay exactly
where they are today, in each product repo.

## Repo layout

```
sovereignfs/sovereignfs/
├── AGENTS.md                  # agent-facing guidance for the whole ecosystem
├── CLAUDE.md                  # thin pointer to AGENTS.md, for Claude Code auto-discovery
├── CONCEPT.md                # this document
├── README.md                 # human-facing entry point
├── workbench.sh               # thin shim invoking the workbench CLI
├── workbench.manifest.json   # source of truth: what repos exist, where they land
├── sovereign.plugins.local.example  # template for the personal plugin-clone list
├── confluence/                # ecosystem knowledge base (human + agent readable)
├── docs/                     # the sovereignfs.github.io site (VitePress)
│   ├── .vitepress/
│   ├── docs-sync.manifest.json  # curation manifest: source paths → site paths
│   └── ...
├── .gitignore                # ignores every dir the CLI spawns
└── (gitignored, spawned by the CLI:)
    ├── sovereign/             # main checkout of sovereignfs/sovereign
    ├── sovereign-os/          # main checkout of sovereignfs/sovereign-os
    ├── support/                # sovereign-infra, plugin-templates, etc.
    └── pods/                  # isolated per-project checkouts, see below
```

## Bootstrapping: the manifest and the CLI

`workbench.manifest.json` is the single list of every repo in the
ecosystem — its clone URL, where it lands locally, and its type
(`runtime` / `os` / `support`):

```json
{
  "repos": [
    { "id": "sovereign", "url": "...", "path": "sovereign", "type": "runtime" },
    { "id": "sovereign-os", "url": "...", "path": "sovereign-os", "type": "os" },
    { "id": "sovereign-infra", "url": "...", "path": "support/sovereign-infra", "type": "support" }
  ]
}
```

A single CLI (invoked via the root `workbench.sh` shim) reads this manifest
and handles everything ecosystem-level: initial checkout, and pod lifecycle
(below). It's a real CLI (not a pile of shell scripts) so it can grow
subcommands over time without becoming unmaintainable — the same reasoning
behind `sovereign`'s own `sv` CLI, which this deliberately doesn't try to
replace or extend; `sv` stays scoped to "manage one Sovereign instance,"
the workbench CLI is scoped to "manage my ecosystem checkout."

`workbench init` clones every repo in the manifest into its main checkout
location. This is the one-time entry point for a new contributor: clone
`sovereignfs/sovereignfs`, run the init command, and every project in the
ecosystem is checked out and ready.

## Ecosystem-wide knowledge: `AGENTS.md` and `confluence/`

Each product repo keeps its own agent-facing guidance (`AGENTS.md`, and
for `sovereign` also a `CLAUDE.md` mirroring it) with conventions specific
to that codebase — those aren't duplicated here. The workbench's root
`AGENTS.md` covers only what spans the ecosystem: how the repos relate,
how to run the CLI, and where to find each project's own conventions.
It's the canonical file — agent-agnostic, not tied to any one AI tool's
naming convention. A root `CLAUDE.md` exists purely so Claude Code's
auto-discovery finds guidance without a config step; it holds no content
of its own, just a pointer to `AGENTS.md`, so the two can never drift out
of sync. `confluence/` — named for the coming-together of the two
workstreams it documents — holds the same kind of knowledge in longer
form — how `sovereign` and `sovereign-os` relate to each other, org-wide
conventions, contributor onboarding that isn't specific to one repo. All
three are written to be equally useful to a human contributor and an AI
agent picking up ecosystem-level work, regardless of which agent tool
they're using.

## The public docs site

`sovereignfs.github.io` used to build out of `sovereignfs/sovereign`, even
though it's the org's front door, not just that one product's. The workbench
now owns serving it (`docs/`, this repo), without becoming a second source
of truth for either project's documentation:

- **Each product repo keeps owning its own `docs/`** — SRS, RFCs, epics,
  research, everything. Nothing moved.
- **The site fetches content at build time** rather than holding checked-in
  copies. `docs/docs-sync.manifest.json` maps source paths in `sovereign`'s
  `docs/` to this site's paths; `workbench docs fetch` does a shallow,
  sparse-checkout-based fetch of exactly those paths into `docs/.fetched/`
  (gitignored) before every `dev`/`build`. This is a deliberate choice over
  syncing checked-in copies — with a corpus this size (most of `sovereign`'s
  `docs/`, RFCs included), checked-in copies would need a second commit
  every time source docs change, recreating the exact duplication problem
  this setup exists to avoid. It also replaces `sovereign`'s former
  `apps/docs/.vitepress/publication.ts` runtime allow/deny-list logic
  entirely — the manifest itself *is* the public/private policy now: only
  paths it lists are ever fetched, so nothing private can leak even by a
  future oversight in `sovereign`'s own repo structure.
- **URL structure:** the root site (`sovereignfs.github.io/`, unprefixed —
  Product / Instances / Get Started / Roadmap / Docs) stays exactly as it
  was, sourced from `sovereign`. A parallel `/sovereign-os/` section now
  exists too — one VitePress instance, shared theme, added once
  `sovereign-os` had real publishable content to mirror. Its nav is
  intentionally lighter than the root's (Sovereign OS home / Product /
  Roadmap / RFCs / ADRs, no Instances or Get Started) because `sovereign-os`
  is pre-release with no self-hosting flow to document yet — the section
  matches what its docs actually support rather than force-fitting
  `sovereign`'s nav shape. One link in the root nav ("Sovereign OS") leads
  in; every page inside the section carries a "← Sovereign" link back out.
  `sovereign-os`'s own home page needed a hand-authored stub
  (`docs/sovereign-os-home.md`, copied into place by `workbench docs fetch`)
  since — unlike `sovereign` — it has no `layout: home` convention of its
  own to fetch verbatim.
- **CI/deploy**: `sovereign`'s old `docs.yml` built and deployed to the
  external `sovereignfs/sovereignfs.github.io` repo on a `docs-v*` tag via
  `peaceiris/actions-gh-pages`. This repo's own `.github/workflows/docs.yml`
  now does the same — builds on every PR touching `docs/**` (fetching over
  `--https`, since CI has no SSH key for `sovereign`), and deploys to the
  same external repo on a `docs-vX.Y.Z` tag push or manual dispatch, using
  a `DOCS_DEPLOY_TOKEN` secret held by this repo instead of `sovereign`.

## Plugin development is (mostly) unaffected

Plugins for `sovereign` continue to clone into
`sovereignfs/sovereign/plugins/<name>.local`, exactly as today. A
contributor who only wants to build a plugin never needs to touch this
repo — manually cloning a repo into `plugins/<name>.local` always works
standalone. `sovereign`'s own `setup.sh` — which previously handled both
ecosystem-wide cloning and this personal plugin-clone step — is retired in
favor of the workbench CLI. The ecosystem-cloning half is superseded by
`workbench init`; the plugin-clone half moves here too, as
`workbench plugins pull`, reading a `sovereign.plugins.local` file at
*this* repo's root (see `sovereign.plugins.local.example`) instead of
`sovereign`'s. This is the one place plugin development now optionally
touches the workbench — purely a convenience for contributors already
using it to keep their personal plugin list in one place, not a
requirement.

## Pods: isolated checkouts for parallel work

### The problem

Running multiple AI agent sessions (or multiple humans) against the same
project at the same time creates conflicts that aren't really about git
merge conflicts — they're about **shared local state that assumes only one
active workstream**:

- **Git internals.** Even `git worktree`, designed for exactly this use
  case, shares one `.git` directory across all worktrees — refs, the
  reflog, hooks, and (for some operations) index locks. Two agents doing
  concurrent git operations can still contend with each other in ways
  that are hard to predict and harder to debug mid-task.
- **Dev servers and ports.** `sovereign`'s dev server binds fixed ports.
  Two concurrent sessions running `pnpm dev` collide immediately.
- **Installed dependencies and build output.** `node_modules`, `.next`,
  and generated files are shared per checkout. One agent's install or
  build can invalidate what another agent is relying on mid-session.
- **Local data.** SQLite files and local plugin state are shared unless
  the checkout is.

The fix is to remove the sharing: give each concurrent workstream its own
full, independent checkout.

### What a pod is

A **pod** is a complete, self-contained clone of a single project
(`sovereign` or `sovereign-os`) — its own `.git`, its own `node_modules`,
its own `.env`, its own plugins, its own local database files. Nothing
about a pod is shared with any other pod or with the main checkout except
the upstream git remote it was cloned from.

Pods are **per-project, not per-ecosystem**. A `sovereign` pod doesn't also
contain `sovereign-os`, and vice versa — each is self-contained on its own,
including its own plugin checkouts (`plugins/` is per-clone by design
already, so this falls out naturally).

### When to use the main checkout vs. a pod

The workbench's main checkouts (`sovereign/`, `sovereign-os/`, from
`workbench init`) remain the default single-session working copies —
including for work that spans both projects, since having them side by
side at the workbench root is exactly what that's for. Reach for a pod when
running an **additional, concurrent** session against a project you're
already working on at the root — a second agent, a parallel experiment, a
task you don't want to interrupt your main checkout's branch/state to run.

### Layout and naming

```
sovereignfs/sovereignfs/
├── sovereign/            # main checkout
├── sovereign-os/         # main checkout
└── pods/                 # gitignored — everything here is disposable
    ├── p1/                # sovereign pod 1
    ├── p2/                # sovereign pod 2
    ├── os1/               # sovereign-os pod 1
    └── ...
```

`p<n>` for `sovereign` pods, `os<n>` for `sovereign-os` pods, numbered
sequentially per project. The CLI scans existing pods and assigns the next
free number — there's no pre-reserved pool. Everything under `pods/` is
gitignored; a pod can be deleted and recreated at any time with no loss
beyond its own uncommitted work.

### Creating a pod

Pods are created lazily, one at a time, on demand — a fresh workbench
starts with zero pods. `workbench pod create sovereign` (or
`sovereign-os`) handles:

1. Cloning the project fresh into the next free pod slot.
2. Copying `.env` from that project's main checkout as a starting point.
3. Rewriting every port-bearing value in that copied `.env` — not just a
   single `PORT` variable, but every service the project runs on a fixed
   port and every absolute URL that embeds one (`sovereign` runs a runtime
   and an auth service on separate fixed ports; both need rewriting
   consistently). Each pod gets a reserved port block computed from its
   index, starting at `5000`/`5001` for `p1`.
4. Installing dependencies inside the pod, independent of the main
   checkout's `node_modules`.

`pnpm kill-port` is extended to accept a target port/range rather than
assuming the main checkout's fixed ports, so a pod's dev server can be
stopped without touching another pod's or the main checkout's process.

### What's deliberately not shared

By design, nothing about a pod is shared with another pod or the main
checkout — no `.git`, no `node_modules`, no running process, no local
database. That's the entire point: isolation is what makes concurrent agent
sessions safe. A shared read-only optimization (e.g. a shared pnpm store to
cut install time) could be added later without reintroducing the conflicts
pods exist to avoid, since a shared read-only cache doesn't create the kind
of contention that shared mutable state does.
