# sovereignfs/sovereignfs

The optional dev workbench for the Sovereign ecosystem. See
[CONCEPT.md](CONCEPT.md) for the full explainer.

Cloning this repo is never required to work on either product repo
(`sovereign` or `sovereign-os`). Both stand on their own. Use this repo if
you want the whole ecosystem checked out and kept current in one step, or
want isolated "pod" checkouts for running concurrent AI agent sessions
safely.

The commands come from [`@sovereignfs/workbench`](https://github.com/sovereignfs/workbench)
(`wb`), a generic multi-repo workbench CLI. This repo holds the Sovereign
manifest and a shim. The package README documents every command and
manifest field.

## Getting started

```sh
git clone https://github.com/sovereignfs/sovereignfs.git
cd sovereignfs
./workbench.sh init
```

`./workbench.sh` runs the published CLI through `npx`, so the first run
needs Node ≥ 20 and network access. If you install it once with
`npm i -g @sovereignfs/workbench`, you can type `wb` instead of
`./workbench.sh` from anywhere inside this directory.

`init` clones every repo listed in [workbench.manifest.json](workbench.manifest.json)
into its place alongside this one:

```
sovereignfs/
├── sovereign/           # Sovereign Workspace Runtime (launcher)
├── fjord/ foundry/ haven/ ledger/ loom/ shopper/ tally/ tusk/ wallet/ waymark/   # Sovereign apps
├── sovereign-legacy/    # legacy
└── pods/                # created on demand, see below
```

Manifest entries marked `"skip": true` are left out of `init`:
`sovereign-os`, `sovereign-edge`, `sovereign-mobile`, `sovereign-desktop`,
`sovereign-infra` and `workbench`. Clone one explicitly with
`./workbench.sh pull <repo> --reset`. Once `workbench/` is cloned, the shim
runs the CLI from that checkout instead of from npm, which is how you work
on the CLI itself.

Re-running `init` is safe: it pulls existing checkouts instead of
re-cloning them.

## Seeing where things stand

```sh
./workbench.sh status            # branch, local changes, stashes, ahead/behind per repo
./workbench.sh status --fetch    # fetch first
./workbench.sh exec -- git log -1 --oneline   # run a command in every cloned repo
```

## Updating checkouts

```sh
./workbench.sh pull --all               # update main in every cloned repo
./workbench.sh pull fjord               # just one repo
./workbench.sh pull fjord --reset       # replace it with a fresh clone
```

`pull` is fast-forward only:
- **On `main` with local changes:** they are stashed (untracked files
  included), `main` is pulled, and the changes are restored with
  `git stash apply`. The stash entry is kept, so nothing is lost if the apply
  conflicts.
- **On another branch:** the local `main` is fast-forwarded in place and
  your working tree is left alone.

`--reset` clones a fresh copy beside the old checkout, then swaps it in, so
a failed clone loses nothing. Your `.env` comes along. It refuses to discard
uncommitted changes, commits not on any remote, or stashes unless you add
`--force`.

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
./workbench.sh pod list                  # what's there, and any unpushed work
./workbench.sh pod remove fjord-1        # refuses if the pod has local work, unless --force
```

Any manifest repo except legacy ones can have pods. Each pod is a fully
independent clone with its own `.git`, `node_modules`, `.env` and local
data.

The pod's `.env` is copied from the main checkout. Ports are rewritten only
for the env vars listed under `pod.ports` in the manifest, which today is
`sovereign`'s `RUNTIME_PORT` and `AUTH_PORT`. Those move into a block of 10
per pod, starting at 5000/5001 for `p1`. For other repos the `.env` is
copied unchanged. See
[CONCEPT.md](CONCEPT.md#pods-isolated-checkouts-for-parallel-work) for
details.

## Freeing up dev ports

Across the ecosystem, dev servers tend to land in three ranges:
- the 3000s: `sovereign`'s runtime and auth
- the 4000s
- the 5000s: pod port blocks start at 5000/5001 for `p1`

If something's stuck listening and you just want a clean slate:

```sh
./workbench.sh kill-port                    # kills 3000-3999, 4000-4999, 5000-5999
./workbench.sh kill-port 3000               # a single port
./workbench.sh kill-port 3000-3002          # a range
./workbench.sh kill-port 3001 3002 4000     # any mix, space-separated
```

This kills whatever process is listening, full stop. It doesn't check which
project owns it, so don't run it if you have unrelated work on those ports
you want to keep alive.

## Starting fresh

Coming back after a working session and want every checkout back on a
clean `main` before you start again?

```sh
./workbench.sh clear              # this repo + every cloned manifest repo
./workbench.sh clear sovereign    # just one: "root" or any manifest repo
```

Per repo, this:
1. stashes local changes with `git stash push --include-untracked`, so
   nothing's lost, just tucked away
2. checks out `main`
3. runs `git pull --ff-only`

Recover stashed work with `git stash pop` inside that repo.

## Adding a repo

```sh
./workbench.sh add git@github.com:sovereignfs/newapp.git --type sovereign-app
```

This adds the entry to the manifest and its directory to the managed block
in `.gitignore`. If you edit the manifest by hand, run
`./workbench.sh gitignore` afterwards.

## What lives here vs. elsewhere

- **This repo:** the Sovereign manifest and the shim, nothing else.
- **[sovereignfs/workbench](https://github.com/sovereignfs/workbench):** the
  generic CLI, its tests and its docs.
- **Each product repo:** its own docs, RFCs, SRS and workflow. Every repo
  still works entirely standalone.
