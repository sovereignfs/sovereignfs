# AGENTS.md

Guidance for any AI agent (or human) working in this repo. `CLAUDE.md` points
here; this file is the canonical source.

## What this repo is

`sovereignfs/sovereignfs` is the optional dev workbench for the Sovereign
ecosystem. It is a manifest of repos, run by the `wb` CLI, which checks them
out, keeps them current and creates isolated "pods" for parallel work. It
owns nothing else. See [CONCEPT.md](CONCEPT.md) for the reasoning and
[README.md](README.md) for usage.

- Every repo in the ecosystem works standalone. The workbench is a
  convenience and must never become a requirement.
- Other projects' code, docs, RFCs and conventions live in their own repos.
  Don't copy them here.
- The CLI lives in its own repo and npm package:
  [`sovereignfs/workbench`](https://github.com/sovereignfs/workbench)
  (`@sovereignfs/workbench`). CLI changes, their tests and the CLI
  conventions all live there. That repo is generic: nothing Sovereign-specific
  goes into it. Sovereign specifics belong in this repo's manifest.

## Layout

```
workbench.manifest.json   # source of truth: which repos exist and how to work with them
workbench.sh              # shim → ./workbench checkout if present, else npx @sovereignfs/workbench
CONCEPT.md / README.md    # design rationale / usage
```

Everything the CLI spawns (`sovereign/`, `fjord/`, `workbench/`, `pods/`, …)
is gitignored and belongs to other repos. Never `git add` it, and never edit
files inside those checkouts as part of a workbench change. The exception is
a change to the CLI itself, which happens in the `workbench/` checkout and is
committed there.

## The manifest

The format is defined by the package. See its
[README](https://github.com/sovereignfs/workbench#the-manifest) and the
`$schema`. The parts this repo relies on:

- Each repo entry has `id`, `url`, `path` and `type`, plus optional flags:
  - `"skip": true`: `init` leaves the repo out. It can still be pulled,
    reset-cloned and pod-ed. `workbench` is a skip entry, so contributors run
    the published CLI by default.
  - `"legacy": true`: retired. It gets no pods, and may reuse another entry's
    `id` (`sovereign-legacy` reuses `sovereign`).
- `pod` settings:
  - `pod.prefix` keeps the historical pod names: `p<n>` for `sovereign`,
    `os<n>` for `sovereign-os`.
  - `pod.ports` lists the fixed-port env vars rewritten into each pod's port
    block (`sovereign`: `RUNTIME_PORT`, `AUTH_PORT`).
- `defaults.install: "pnpm"` runs `pnpm install` in new pods that have a
  `package.json`.

Because ids can repeat, address repos by `path`, which is unique.

When adding a repo, use `./workbench.sh add <url> --type <type>`. Or edit
the manifest and run `./workbench.sh gitignore`, which rewrites the managed
`.gitignore` block. Verify with `./workbench.sh gitignore --check`.

## Verifying changes here

- Manifest changes:
  - `./workbench.sh gitignore --check` validates the manifest and the
    `.gitignore` block.
  - `./workbench.sh status` shows that every entry resolves.
- Don't run `clear`, `pull --reset --force` or `kill-port` against the
  user's checkouts unprompted.

## Keeping docs in sync

Workbench behaviour is described in the package's docs. This repo's README
and CONCEPT cover the Sovereign setup and link to the package for
everything else. When the manifest or the shim changes, update both in the
same commit. If a feature is removed, remove its mentions everywhere rather
than leaving a history note.
