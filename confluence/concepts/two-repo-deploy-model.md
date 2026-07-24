---
tags: [concept, deployment]
updated: 2026-07-24
---

# The two-repo deploy model

[sovereign](../entities/sovereign.md) and
[sovereign-infra](../entities/sovereign-infra.md) split "build" from
"operate" across two repos, each owned and released independently:

- **Provider — `sovereign`.** Owns all application code. Publishes
  versioned Docker images to GHCR whenever a `v*` tag is pushed. Has no
  knowledge of any particular operator's VPS, domains, or secrets.
- **Operator — `sovereign-infra`.** Owns nothing but deployment concerns:
  Caddy reverse-proxy config, age-encrypted `.env` secrets, VPS
  bootstrap/hardening, and backups. Contains no application code at all —
  it fetches `sovereign`'s docker-compose files and images from GHCR at
  deploy time rather than vendoring them.

Pushing a matching `v*` tag to `sovereign-infra` verifies the corresponding
GHCR image exists and deploys it to the operator's VPS. The two release
cadences are decoupled by design: `sovereign` can ship a version without
any operator being forced to upgrade immediately, and an operator's
infra/secrets changes never require a `sovereign` code change.

This mirrors a common self-hosted-software pattern (app repo + deploy
repo), chosen explicitly over folding deployment into the app repo so that
operators don't need write access to application code, and app releases
aren't coupled to any one operator's infrastructure choices.
