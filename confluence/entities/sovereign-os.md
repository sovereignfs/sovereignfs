---
tags: [entity, os, appliance]
repo: git@github.com:sovereignfs/sovereign-os.git
updated: 2026-07-24
---

# sovereign-os — Sovereign OS

A local-first, open-source, privacy-preserving operating system/appliance
platform targeted at Raspberry Pi (currently Pi 5, ARM64). Turns a
user-owned device into a personal, self-hosted digital hub for home
services (DNS filtering, home automation, documents, calendars, local AI)
behind one coherent install/runtime/update/recovery experience, with AI as
an orchestration interface rather than a replacement for underlying
services. Early-stage, not production; currently proving an "appliance
foundation" using Pi-hole as the first validation service.

Genuinely an OS-image/appliance-builder project, not application code —
distinct in kind from [sovereign](sovereign.md)'s Next.js runtime.

## Tech stack / build tooling

- Image build: `rpi-image-gen` (pinned upstream tool) driving a
  Debian/Raspberry Pi OS (trixie) ARM64 rootfs build, wrapped in Docker
  (`Dockerfile.proof`, `Dockerfile.sovereign`) as a macOS/Apple-Silicon
  engineering adapter — the qualified release environment is a native
  ARM64 Debian/Raspberry Pi OS host.
- Bash orchestrates builds (`scripts/build-sovereign-image.sh`,
  `build-rpi-image-gen-proof.sh`).
- Python (stdlib-style) handles release/update tooling: manifest creation,
  update bundle creation, signing, qualification prep
  (`scripts/create-*.py`, `sign-update-manifest.py`,
  `prepare-update-qualification.py`).
- Tests: Python/pytest (`tests/test_*.py`).
- Runtime services are containerized
  (`image-builder/sovereign/appliance/{nginx,pihole,console}`), fronted by
  nginx with namespaced HTTP routing, plus a "Sovereign Console" web UI and
  Pi-hole.
- Update system uses JSON-Schema-defined manifests (`update/schema/*.json`)
  for signed, staged, health-gated, rollback-capable updates without full
  reflashing.

## Top-level structure

- `image-builder/` — pinned Raspberry Pi image definition and appliance
  layer (Dockerfiles, patches, `sovereign/` appliance config split into
  `appliance/`, `config/`, `image/`, `layer/`)
- `scripts/` — local build/release tooling (bash + python) for image
  builds, release bundles, update bundles/manifests, signing,
  qualification
- `tests/` — pytest suite for the above
- `update/` — update-system design artifacts: `BACKUP_AND_JOURNAL.md`,
  JSON Schemas (`schema/`) and example payloads (`examples/`)
- Root: `AGENTS.md`, `CONCEPT.md`, `ROADMAP.md`, `README.md`, `LICENSE`
  (AGPLv3)

## Documentation conventions

Heavily specification-driven, multiple parallel numbered/typed doc systems
under `docs/`:

- `rfcs/` — numbered RFCs (RFC-0010, RFC-0014, ...) for proposals on
  significant interfaces/protocols/systems
- `adrs/` — numbered Architecture Decision Records (ADR-0001…0005) for
  accepted decisions
- `roadmap/` — phase/milestone plans (`00-master-plan.md`,
  `01-preview-poc.md`, `01-1-update-foundation.md`, etc.)
- Other areas: `product/`, `architecture/`, `research/`, `experiments/`,
  `design/`, `development/`, `operations/`, `security/`, `plugins/`,
  `governance/`, `templates/`
- Standardized status vocabulary: Draft, Proposed, Accepted, Implemented,
  Superseded, Rejected, Archived (plus Planned/In progress/Concluded/
  Abandoned for research/experiments)
- Explicit rule: separate current behavior from future intent — e.g.
  `system-overview.md` describes long-term platform direction while
  ADR-0001/RFC-0010 define what Phase 01 actually implements; don't
  conflate the two when reading this repo's docs

Developed primarily with OpenAI Codex per `AGENTS.md` (branch prefixes
`feat/`/`fix/`/`docs/`/`chore/`, `Co-Authored-By: Codex <noreply@openai.com>`)
— a different agent convention than [sovereign](sovereign.md)'s
Claude Code + Codex split.

## Relationships to other sovereignfs repos

Deliberately none. `sovereign-os` is a separate product workstream under
the same `sovereignfs` org/ecosystem, evolving independently of
[sovereign](sovereign.md) — no shared codebase, no shared runtime
features. Its README/AGENTS/CONCEPT/ROADMAP don't cross-link `sovereign`,
`sovereign-desktop`, or `sovereign-infra`, and that silence is confirmed
intentional (developer, 2026-07-24), not an oversight to fix. The only
thing the two products share is the workbench (`sovereignfs/sovereignfs`)
that checks them out side by side and the ecosystem-wide docs site — see
root [CONCEPT.md](../../CONCEPT.md).

## Notable architectural facts

- Phase 01 scope is intentionally narrow: reproducible ARM64 image,
  persistent user data, containerized services, local network discovery,
  namespaced HTTP routing, first-boot init, versioned release-candidate
  pipeline — Pi-hole is just the first proof service.
- Preview images support headless first-login over trusted Ethernet with a
  public default password (`sovereign`/`sovereign`) that must be rotated
  before continued SSH access — explicitly never to be exposed to the
  internet.
- Sovereign Console served at `/`, Pi-hole namespaced under `/dns/admin/`;
  HTTPS with automatic browser trust intentionally excluded from POC
  (public CAs can't issue for `.local` names).
- ADR-0004 commits to a provider-neutral local AI assistant plus opt-in
  web search via a self-hosted SearXNG instance — no cloud LLM dependency
  by default, aligned with "AI as interface, not the product."
