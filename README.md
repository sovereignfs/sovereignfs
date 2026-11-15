# sovereignfs/sovereignfs

The optional dev workbench for the Sovereign ecosystem — see
[CONCEPT.md](CONCEPT.md) for the full explainer.

Cloning this repo is never required to work on either product repo
(`sovereign` or `sovereign-os`) — both stand on their own. Use this repo if
you want the whole ecosystem checked out and kept current in one step, or
want isolated "pod" checkouts for running concurrent AI agent sessions
safely.

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
├── sovereign/           # Sovereign Workspace Runtime (launcher)
├── fjord/ ledger/ shopper/ tally/ tusk/ wallet/ waymark/   # Sovereign apps
├── sovereign-infra/     # legacy
└── pods/                # created on demand, see below
```

Manifest entries marked `"skip": true` (`sovereign-os`, `sovereign-edge`,
`sovereign-mobile`, `sovereign-desktop`, `sovereign-legacy`) are left out
of `init`. Clone one explicitly with `./workbench.sh pull <repo> --reset`.

Re-running `init` is safe — it pulls existing checkouts instead of
re-cloning them.

## Updating checkouts

```sh
./workbench.sh pull --all               # update main in every cloned repo
./workbench.sh pull fjord               # just one repo
./workbench.sh pull fjord --reset       # replace it with a fresh clone
```

`pull` is fast-forward only. If a repo is on `main` with local changes, they
are stashed (untracked files included), `main` is pulled, and the changes
are restored with `git stash apply` — the stash entry is kept, so nothing is
lost if the apply conflicts. If a repo is on another branch, its local
`main` is fast-forwarded in place and your working tree is left alone.

`--reset` clones fresh beside the old checkout, then swaps it in (so a
failed clone loses nothing) and carries your `.env` over. It refuses to
discard uncommitted changes, commits not on any remote, or stashes unless
you add `--force`. Add `--https` to clone over HTTPS.

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
./workbench.sh pod create fjord tally    # → pods/fjord-1, pods/tally-1
```

Any manifest repo except legacy ones can have pods. Port rewriting only
happens for repos registered in `POD_PORT_VARS` in the CLI (currently
`sovereign`); for the rest the `.env` is copied unchanged.

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

## Starting fresh

Coming back after a working session and want every checkout back on a
clean `main` before you start again?

```sh
./workbench.sh clear                # root + every repo in the manifest (incl. support/*)
./workbench.sh clear --w sovereign   # just one — "root" or any manifest repo id
```

Per repo this stashes local changes (`git stash push --include-untracked`,
so nothing's lost — just tucked away), checks out `main`, and
`git pull --ff-only`s. Recover stashed work with `git stash pop` inside
that repo.

## What lives here vs. in the product repos

- **This repo:** ecosystem-wide bootstrap and upkeep — the CLI and the
  manifest, nothing else.
- **Each product repo:** its own docs, RFCs, SRS, and workflow. Every repo
  still works entirely standalone.
