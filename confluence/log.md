# Confluence log

Append-only, newest entry last. See [SCHEMA.md](SCHEMA.md#logmd).

## [2026-07-24] ingest | Ecosystem mapping pass

Explored all 6 repos in `workbench.manifest.json`
(sovereign, sovereign-os, sovereign-desktop, sovereign-infra,
sovereign-plugin-template, sovereign-plugins-examples) after
`workbench init` cloned them. Wrote one entity page per repo, three
concept pages (two-repo-deploy-model, plugin-development,
cross-repo-conventions), and seeded `index.md`. Moved the pre-existing
`0004-dev-workbench-bootstrap.md` research doc into `research/`.

Noted gaps: `sovereign-tasks`, `sovereign-plainwrite`, `storybook`,
`sovereign-legacy`, `sovereign-mobile` are referenced by entity pages but
not yet in the manifest or confluence — see index.md's Gaps section.

## [2026-07-24] correction | sovereign-os independence is intentional

`sovereign-os`'s lack of cross-references to `sovereign`/`sovereign-desktop`/
`sovereign-infra` was initially logged as an unverified gap ("silence
might mean not-written-yet"). Developer confirmed it's deliberate:
`sovereign-os` is a separate product workstream in the ecosystem, no
shared codebase or features with the runtime line. Updated
`entities/sovereign-os.md` and `index.md` to state this as fact rather
than an open question.

## [2026-07-24] ingest | workbench plugins pull

`sovereign`'s retired `setup.sh` had a second, previously-unmapped
responsibility: cloning a personal, gitignored `sovereign.plugins.local`
list into `sovereign/plugins/<name>.local`. That config file and the CLI
step now live in this workbench repo (`sovereign.plugins.local` at this
repo's root, `workbench plugins pull`), not in `sovereign`. Updated
`concepts/plugin-development.md` to describe this as an optional
workbench convenience, not a hard dependency — manual `.local` cloning
from a bare `sovereign` checkout is unaffected.

## [2026-07-24] tooling | workbench confluence lint/sync

Added `workbench confluence lint` and `workbench confluence sync` to
address staleness: each product repo releases independently with no
shared CI, so nothing was pinging confluence when a source repo moved.
Both commands compare each entity page's `updated` frontmatter against
its source repo's last local commit date and report drift; `sync`
additionally `git pull`s each mapped repo first. Deliberately manual —
no automatic trigger — since wiring push notifications across
independently-released repos would couple them to this workbench's CI in
a way the ecosystem is designed to avoid. See
`SCHEMA.md#workflows` for the reasoning.

## [2026-07-24] tooling | lint/sync now print a re-ingest prompt

Detecting drift is mechanical (date comparison) but fixing it isn't —
rewriting a page to reflect what actually changed needs an agent's
judgment. `workbench confluence lint`/`sync` now print a ready-to-paste
"Re-ingest prompt" whenever they find stale pages, listing exactly which
pages and source repos need re-reading, so the loop from "detected stale"
to "an agent updates it" doesn't require reconstructing the instruction
by hand each time.

## [2026-07-25] tooling | pod create implemented

`workbench pod create <project>` (previously a stub erroring "not
implemented yet") now does the full flow from
`CONCEPT.md#pods-isolated-checkouts-for-parallel-work`: scans `pods/` for
the next free `p<n>`/`os<n>` slot per project, clones fresh, copies the
main checkout's `.env` and rewrites its fixed-port vars (currently
`RUNTIME_PORT`/`AUTH_PORT` for `sovereign`, a 10-port block per pod index
starting at 5000/5001 for `p1`) plus any `localhost:<default-port>`
reference elsewhere in the file, then runs `pnpm install` if the pod has
a `package.json`. Verified end-to-end against the real `sovereign`
checkout: `p1` got 5000/5001, a second pod correctly got `p2` at
5010/5011. `sovereign-os` has no `.env`/`package.json` today, so its pods
just clone — the port-var map (`POD_PORT_VARS` in `cli/bin/workbench.js`)
is keyed per project id so that's a one-line addition if that changes.

## [2026-07-31] ingest | sovereign-mobile planning docs + entity page

`sovereign-mobile/` went from an empty placeholder directory to a full
docs-only checkout: `CONCEPT.md`, `ROADMAP.md`, `AGENTS.md`/`CLAUDE.md`,
`CONTRIBUTING.md`, `docs/development-workflow.md`, and
`docs/{epics,adrs,research}/`, built from `sovereign`'s RFC 0058 (shell),
RFC 0083 (device bridge), RFC 0080 (surface model), epic 20, and workstream
0002 — plus the developer's own restated requirement (bridge layer for
`sdk.device.*`, native-only PWA features, self-hosting instance-URL
support), cross-checked against those sources and found consistent, not
contradictory. Wrote `entities/sovereign-mobile.md` and added it to
`index.md`.

Deliberately did **not** add `sovereign-mobile` to
`workbench.manifest.json` — the checkout has content but no `.git` and no
GitHub remote yet, so `workbench init`'s `cloneOrPull` would fail on it
(non-empty destination, then no remote to clone from). Add it once the
repo is `git init`-ed and pushed. Noted `sovereign-edge` as a fresh gap in
the opposite direction: it's already in the manifest (added in a separate,
earlier change) but still has no confluence entity page.

## [2026-07-31] ingest | sovereign-mobile: task 20.1 scaffold, repo pushed, manifest entry

Same day, follow-on to the entry above. `sovereign-mobile` gained a real
Capacitor shell scaffold (epic task 20.1): onboarding/instance-persistence/
boot-flow logic ported from `sovereign-desktop`, committed iOS and Android
native projects, and two new ADRs (0006, 0007) for the mobile-specific
pieces desktop's OS-menu model doesn't cover (history-based instance
switching, native navigation-policy enforcement). Verified building,
installing, and launching on iOS Simulator (screenshot-confirmed, two
device instances) — catching and fixing two real native bugs along the way
(an unregistered Xcode source file, an ambiguous `WKNavigationDelegate`
overload). Android is written against real Capacitor Android sources but
not compile-verified: this build environment has JDK 17, Capacitor Android
8 requires JDK 21+.

The repo was then `git init`-ed, committed directly to `main`, and pushed
to `sovereignfs/sovereign-mobile` on GitHub — the precondition the previous
entry's manifest exception was waiting on. Added it to
`workbench.manifest.json` (fixing a copy-paste bug found in the process:
the entry had been drafted with `"id": "sovereign-edge"`, duplicating the
existing entry instead of reading `"sovereign-mobile"` — id collisions like
this would break anything keying off `id`, e.g. `POD_PORT_VARS` lookups).
Added the matching `/sovereign-mobile/` line to root `.gitignore`,
consistent with the other nested-repo entries. Updated
`entities/sovereign-mobile.md` and `index.md` to drop the now-stale
"docs-only, not in manifest" framing rather than leave it contradicting the
manifest change in the same commit.

Left as a known follow-up, not fixed here: `sovereign` monorepo's
`docs/repositories.md` still lists `sovereign-mobile` as "Not yet created"
— that's now stale and needs correcting on `sovereign`'s own next ingest
pass, not this one.
