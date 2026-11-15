# Concept: the Sovereign dev workbench

## What this repo is

`sovereignfs/sovereignfs` is an optional meta-repo for working across the
Sovereign ecosystem — currently two independent product workstreams,
**Sovereign Workspace Runtime** (`sovereignfs/sovereign`) and
**Sovereign OS** (`sovereignfs/sovereign-os`), plus supporting projects.
Cloning it is never required — either product repo can still be cloned and
worked on entirely standalone. The workbench exists for contributors who
want the whole ecosystem organized for them in one step, or who run multiple concurrent AI agent sessions and
need isolated checkouts to do that safely (see
[Pods](#pods-isolated-checkouts-for-parallel-work) below).

It owns one thing that doesn't belong to any single repo: a one-command way
to check out the ecosystem and keep it current (`init`, `pull`, `clear`),
plus isolated pods for parallel work. It does **not** own any project's
docs, RFCs, SRS, or workflow — those stay in each repo.

## Repo layout

```
sovereignfs/sovereignfs/
├── CONCEPT.md                # this document
├── README.md                 # human-facing entry point
├── workbench.sh               # thin shim invoking the workbench CLI
├── workbench.manifest.json   # source of truth: what repos exist, where they land
├── .gitignore                # ignores every dir the CLI spawns
└── (gitignored, spawned by the CLI:)
    ├── sovereign/             # main checkout of sovereignfs/sovereign
    ├── fjord/, tally/, ...    # one checkout per manifest repo, at its "path"
    └── pods/                  # isolated per-project checkouts, see below
```

## Bootstrapping: the manifest and the CLI

`workbench.manifest.json` is the single list of every repo in the
ecosystem — its clone URL, where it lands locally, and its type
(`launcher`, `os`, `mobile`, `desktop`, `sovereign-app`, `support`, ...),
plus two optional flags:

- `"skip": true` — `init` leaves the repo out. It stays in the manifest so
  it can still be cloned on demand (`workbench pull <repo> --reset`), pulled
  and pod-ed.
- `"legacy": true` — retired repos. Legacy repos get no pods. A legacy entry
  may reuse another entry's `id` (`sovereign-legacy` does), so the CLI
  addresses repos by their unique `path`; a bare `id` resolves to the
  non-legacy entry.

```json
{
  "repos": [
    { "id": "sovereign", "url": "...", "path": "sovereign", "type": "launcher" },
    { "id": "sovereign-os", "url": "...", "path": "sovereign-os", "type": "os", "skip": true },
    { "id": "fjord", "url": "...", "path": "fjord", "type": "sovereign-app" }
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

`workbench init` clones every repo in the manifest (except `skip` entries)
into its main checkout location. This is the one-time entry point for a new contributor: clone
`sovereignfs/sovereignfs`, run the init command, and every project in the
ecosystem is checked out and ready.

## Keeping checkouts current: `workbench pull`

`workbench pull --all` updates `main` in every cloned repo, fast-forward
only; `workbench pull <repo>` does one. On `main`, a dirty working tree is
stashed (untracked included), pulled, and restored with `git stash apply`
(the stash entry is kept as a safety net). On any other branch, local
`main` is fast-forwarded in place with the working tree untouched.
`workbench pull <repo> --reset` replaces a checkout with a fresh clone —
the way to clone a `skip` repo — and refuses to throw away unpushed or
uncommitted work without `--force`. This is distinct from `workbench clear`,
which stashes and resets every checkout to a clean `main`.

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
- **Local data.** SQLite files and other local state are shared unless
  the checkout is.

The fix is to remove the sharing: give each concurrent workstream its own
full, independent checkout.

### What a pod is

A **pod** is a complete, self-contained clone of a single project
(any non-legacy manifest repo) — its own `.git`, its own `node_modules`,
its own `.env`, its own local database files. Nothing
about a pod is shared with any other pod or with the main checkout except
the upstream git remote it was cloned from.

Pods are **per-project, not per-ecosystem**. A `sovereign` pod doesn't also
contain `sovereign-os`, and vice versa — each is self-contained on its own.

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

`p<n>` for `sovereign` pods, `os<n>` for `sovereign-os` pods, `<repo>-<n>`
for every other repo (e.g. `fjord-1`), numbered sequentially per project. The CLI scans existing pods and assigns the next
free number — there's no pre-reserved pool. Everything under `pods/` is
gitignored; a pod can be deleted and recreated at any time with no loss
beyond its own uncommitted work.

### Creating a pod

Pods are created lazily, one at a time, on demand — a fresh workbench
starts with zero pods. `workbench pod create <repo>...` handles:

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
