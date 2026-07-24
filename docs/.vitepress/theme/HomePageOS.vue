<template>
  <main class="sv-home">
    <section class="sv-hero">
      <div class="sv-shell">
        <div class="sv-hero-copy">
          <p class="sv-eyebrow">Local-first Raspberry Pi appliance</p>
          <h1>Sovereign OS</h1>
          <p class="sv-hero-lead">
            A local-first, open-source operating system for Raspberry Pi.
          </p>
          <p class="sv-hero-detail">
            Sovereign OS brings proven open-source services together behind a
            coherent installation, runtime, update, and recovery experience —
            personal infrastructure without giving up ownership, privacy, or
            the ability to operate locally.
          </p>
          <p class="sv-hero-detail">
            <strong>Current status:</strong> early development, proving the
            appliance foundation on Raspberry Pi 5 — a reproducible ARM64
            image, persistent user data, containerized services, and a
            versioned release-candidate pipeline. Not yet a production
            release.
          </p>
          <div class="sv-actions" aria-label="Explore Sovereign OS">
            <a class="sv-action sv-action-primary" href="/sovereign-os/concept">Read the concept</a>
            <a class="sv-action sv-action-secondary" href="/sovereign-os/rfcs/README">Browse RFCs</a>
            <a class="sv-action sv-action-link" href="/">← Sovereign</a>
          </div>
        </div>
      </div>
    </section>

    <section class="sv-proof" aria-label="Sovereign OS principles">
      <div class="sv-shell sv-proof-grid">
        <p><strong>Local first</strong><span>Core capabilities work without a mandatory cloud dependency.</span></p>
        <p><strong>User owned</strong><span>You control your hardware, data, configuration, and service lifecycle.</span></p>
        <p><strong>Recoverable</strong><span>Installs and updates have clear backup, rollback, and recovery paths.</span></p>
      </div>
    </section>
  </main>
</template>
