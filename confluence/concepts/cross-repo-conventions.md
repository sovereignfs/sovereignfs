---
tags: [concept, conventions, agents]
updated: 2026-07-24
---

# Conventions differ per repo — don't assume they transfer

Each product repo evolved its own documentation and agent-attribution
conventions independently. An agent moving between repos in this
ecosystem should re-check conventions per repo rather than assuming the
one it just left still applies.

## Documentation systems

| Repo | Decision docs | Spec docs | Status vocabulary |
|---|---|---|---|
| [sovereign](../entities/sovereign.md) | `docs/rfcs/` (numbered `0001-...`), `docs/research/` (pre-RFC, not all graduate) | `docs/sovereign-proposal-plan-srs.md` (numbered SRS sections, e.g. §3.12; NFRs like NFR-04); `docs/epics/` matched to `ROADMAP.md` task IDs | not formally enumerated beyond RFC status index |
| [sovereign-os](../entities/sovereign-os.md) | `docs/rfcs/` (RFC-NNNN, *different numbering series from `sovereign`'s RFCs — RFC-0010 in one repo is unrelated to any 0010 in the other*), `docs/adrs/` (ADR-NNNN, accepted decisions) | `docs/roadmap/` phase/milestone plans | explicit standardized vocabulary: Draft, Proposed, Accepted, Implemented, Superseded, Rejected, Archived |
| [sovereign-infra](../entities/sovereign-infra.md) | none — small `docs/` (`ports.md`, `sovereign-deploy-workflow.md`) | n/a | n/a |

Do not cross-reference an RFC number between `sovereign` and
`sovereign-os` as if they share a sequence — they don't.

## AI agent / commit attribution conventions

- **sovereign** — developed by both Claude Code and Codex, each from its
  own clone, with `docs/multi-agent.md` defining distinguishable commit
  trailers for each.
- **sovereign-os** — `AGENTS.md` defines Codex as the primary agent
  (branch prefixes `feat/`/`fix/`/`docs/`/`chore/`,
  `Co-Authored-By: Codex <noreply@openai.com>`). No Claude-Code-specific
  convention documented there as of this ingest.
- Check each repo's own `AGENTS.md`/`CLAUDE.md` before committing —
  don't carry a convention from one repo into another.

## Why this matters for confluence maintenance

When ingesting a new source doc from either product repo, note *which*
repo's numbering scheme a citation belongs to in the confluence page —
write "sovereign RFC 0038" or "sovereign-os RFC-0010", never a bare "RFC
0010", to avoid this cross-referencing exactly once it's been flagged.
