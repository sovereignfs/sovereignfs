# Confluence schema

`confluence/` is a wiki, not a docs mirror. It's a light adaptation of
[Karpathy's LLM-wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f):
a persistent, compounding artifact that an AI agent maintains across
sessions, so the ecosystem doesn't get re-discovered from scratch on every
question. This doc is the schema layer — read it before writing to
`confluence/`.

## Three layers

1. **Raw sources — immutable, never edited from here.** The actual product
   repos (`sovereign/`, `sovereign-os/`, `sovereign-desktop/`,
   `support/*`) once `workbench init` has cloned them, plus this repo's own
   [CONCEPT.md](../CONCEPT.md) and [AGENTS.md](../AGENTS.md). Confluence
   pages summarize and cite these; they don't replace them, and a page is
   wrong the moment it drifts from what the source actually says.
2. **Wiki layer — this directory.** Fully owned by whichever agent is
   maintaining it. Every page here is generated/curated content, safe to
   regenerate from the raw sources if it ever goes stale beyond repair.
3. **Schema layer — this file.** Conventions, page types, and the
   ingest/query/lint workflows below.

## Directory layout

```
confluence/
├── SCHEMA.md          # this file
├── index.md           # catalog of every page, read first
├── log.md             # append-only ingest history
├── entities/          # one page per repo in the ecosystem
│   ├── sovereign.md
│   ├── sovereign-os.md
│   ├── sovereign-desktop.md
│   ├── sovereign-infra.md
│   ├── sovereign-plugin-template.md
│   └── sovereign-plugins-examples.md
├── concepts/           # cross-cutting ideas that span multiple repos
│   ├── two-repo-deploy-model.md
│   ├── plugin-development.md
│   └── ...
└── research/           # numbered decision docs (e.g. 0004-*), append-only history
```

## Page types

- **Entity page** (`entities/<repo-id>.md`) — one per repo in
  `workbench.manifest.json`, named by its `id`. Covers: what it is, tech
  stack, top-level structure, and how it relates to other repos in the
  ecosystem. Frontmatter: `tags`, `repo` (clone URL), `updated` (date the
  page was last verified against the source).
- **Concept page** (`concepts/<slug>.md`) — a cross-cutting idea that
  doesn't belong to one repo (a shared architecture pattern, a workflow
  that spans two repos, a naming convention used ecosystem-wide).
  Frontmatter: `tags`, `updated`.
- **Research doc** (`research/NNNN-slug.md`) — a decision record, numbered
  sequentially, append-only once written. Not rewritten during lint —
  these are history, not living pages.

Wikilink cross-references use plain relative markdown links
(`[sovereign](../entities/sovereign.md)`) — no special syntax needed at
this scale.

## `index.md`

A content-oriented catalog, not an auto-generated file listing: every page
grouped under `## Entities`, `## Concepts`, `## Research`, each line a link
plus a one-sentence summary. Read this first when answering any ecosystem
question — it's the map. Update it whenever a page is added, renamed, or
its summary changes.

## `log.md`

Append-only, newest entry last is fine (or newest-first — pick one and
stay consistent; this repo uses newest-last so `tail` shows recent
activity). One line per entry:

```
## [2026-07-24] ingest | Ecosystem mapping pass
Explored all 6 repos in workbench.manifest.json, wrote entity pages,
seeded index.md.
```

Grep-able by design — don't bury the date/type/title line in prose.

## Workflows

**Ingest** — when a repo in the manifest changes meaningfully (new
architecture, new repo added, major refactor): re-read the relevant raw
source, update the affected entity/concept pages, update `index.md`, and
append a `log.md` entry. A single ingest can touch several pages — that's
expected, not a scope violation.

**Query** — when asked a question about the ecosystem, read `index.md`
first, then the specific pages it points to, before falling back to
reading raw sources directly. If an answer required synthesis across pages
that isn't captured anywhere yet, consider filing it back as a new or
updated page rather than re-deriving it next time.

**Lint** — periodically (or when something looks off): check for pages
that contradict each other, claims that a raw source has since outgrown
(e.g. a repo's structure changed since the page's `updated` date), pages
with no inbound link from `index.md` or any other page, and gaps — repos
in `workbench.manifest.json` with no entity page yet.

The `updated`-vs-source-drift half of this is automated:
`./workbench.sh confluence lint` compares each entity page's `updated`
frontmatter date against its source repo's last commit date (from the
local checkout) and reports which pages are behind. `./workbench.sh
confluence sync` does the same after `git pull`-ing each mapped repo
first, so it catches drift the local checkout hadn't fetched yet. Neither
command edits page content — a stale report means "re-read the source and
update this page," not "the tool fixed it." There's no automatic trigger:
each repo in the ecosystem releases on its own schedule with no shared
CI, so run this manually — before answering something that leans heavily
on one repo's page, or just periodically — rather than expecting it to
fire on its own.

Detecting drift is mechanical, but *fixing* it isn't — updating a page's
prose to reflect what actually changed in the source requires reading and
judgment, not just a date comparison. So when either command finds stale
pages, it also prints a ready-to-paste "Re-ingest prompt" listing exactly
which pages and which source repos need re-reading. Hand that block to an
agent (or act on it yourself) to close the loop — lint/sync tell you
*what's* stale, the Ingest workflow above is *how* it gets fixed.

## What NOT to put here

- Anything that duplicates a product repo's own docs/RFCs/SRS wholesale —
  link to them, don't copy them in.
- Ecosystem-workbench mechanics (how the CLI works, pod layout) — that's
  [CONCEPT.md](../CONCEPT.md)'s job, confluence is about the *products*,
  not the workbench tool itself.
- Anything that goes stale fast (current sprint status, who's working on
  what right now) — this is a wiki of durable facts, not a status board.
