# AGENTS.md

Guidance for any AI agent (or human) working in this repo. `CLAUDE.md` points
here; this file is the canonical source.

## What this repo is

`sovereignfs/sovereignfs` is the optional dev workbench for the Sovereign
ecosystem: a manifest of repos plus a small CLI that checks them out, keeps
them current, and creates isolated "pods" for parallel work. It owns nothing
else. See [CONCEPT.md](CONCEPT.md) for the reasoning and
[README.md](README.md) for usage.

- Every repo in the ecosystem works standalone. The workbench is a
  convenience and must never become a requirement.
- Other projects' code, docs, RFCs and conventions live in their own repos.
  Don't copy them here.

## Layout

```
workbench.manifest.json   # source of truth: which repos exist and where they land
workbench.sh              # shim → node cli/bin/workbench.js
cli/bin/workbench.js      # the whole CLI (single file, ESM, no dependencies)
CONCEPT.md / README.md    # design rationale / usage
```

Everything the CLI spawns (`sovereign/`, `fjord/`, `pods/`, …) is gitignored
and belongs to other repos. Never `git add` it, and never edit files inside
those checkouts as part of a workbench change.

## The manifest

Each entry in `workbench.manifest.json` has `id`, `url`, `path` and `type`,
plus optional flags:

- `"skip": true` — `init` leaves it out; it can still be pulled, reset-cloned
  and pod-ed.
- `"legacy": true` — retired; gets no pods. May reuse another entry's `id`
  (`sovereign-legacy` reuses `sovereign`).

Because ids can repeat, **address repos by `path`** (unique). Use
`findRepo(manifest, name)` in the CLI; don't `find((r) => r.id === …)`
directly. A bare id resolves to the non-legacy entry.

When adding a repo, also add its `/<path>/` line to `.gitignore`.

## CLI conventions

- Node ≥ the version in `.node-version`. ESM, built-ins only. Don't add
  dependencies or a build step.
- One `cmdX(args)` function per command, wired in the `switch` at the bottom,
  with its usage text in `printUsage()`.
- Set `process.exitCode = 1` on failure rather than calling `process.exit`.
  Commands that loop over repos continue past a failure, then print a
  `done: N ok, N skipped, N failed` summary.
- Use `git()` (streams output) or `gitOut()` (returns stdout) with
  `execFileSync` and argument arrays. No shell strings.
- Repos are cloned over SSH by default; `--https` rewrites via `toHttps()`.

### Safety rules for destructive operations

The CLI operates on other repos' working trees, so protect user work:

- `pull` stashes before touching a dirty `main` and restores with
  `stash apply` (not `pop`). Keep it fast-forward only.
- `pull <repo> --reset` must clone first, swap second, and refuse to discard
  uncommitted changes, unpushed commits or stashes without `--force`.
- `clear` stashes before resetting. `kill-port` kills by port with no
  ownership check; don't run it on the user's machine unprompted.
- Don't add anything that deletes or overwrites a checkout without a guard
  like the above.

## Testing changes

There is no test suite. Verify CLI changes against throwaway repos, never the
real remotes:

1. In a scratch directory, create local bare repos (`git init --bare -b main`)
   and seed each with a commit.
2. Copy `cli/bin/workbench.js` next to a `workbench.manifest.json` whose
   `url`s point at those bare repos (the CLI resolves `ROOT` from its own
   location, three directories up).
3. Exercise the command, including the failure paths (dirty tree, feature
   branch, unpushed commits, legacy and unknown names).

Also run `node --check cli/bin/workbench.js`.

## Keeping docs in sync

Behavior is described in three places: `printUsage()`, README, and CONCEPT.
When a command's behavior changes, update all three in the same commit. If a
feature is removed, remove its mentions everywhere rather than leaving a
history note.
