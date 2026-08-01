<template>
  <main class="sv-home">
    <section class="sv-hero">
      <div class="sv-shell sv-os-hero-grid">
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

        <figure class="sv-workspace-figure">
          <div class="sv-console" aria-label="Sovereign OS local system overview">
            <div class="sv-console-topbar">
              <span class="sv-brand-mark">OS</span>
              <strong>Sovereign OS</strong>
              <span class="sv-console-version">0.1.0-preview.18</span>
            </div>
            <div class="sv-console-main">
              <header class="sv-console-header">
                <div class="sv-console-header-copy">
                  <span class="sv-console-eyebrow">Local system overview</span>
                  <strong>Your Sovereign system</strong>
                  <span>Private services, running on hardware you control.</span>
                </div>
                <div class="sv-status-chip sv-status-chip-online">All systems healthy</div>
              </header>

              <div class="sv-stat-grid">
                <div class="sv-stat-tile">
                  <span class="sv-stat-label">Data storage</span>
                  <strong>2.3% used</strong>
                  <span class="sv-stat-caption">118.3 GB available</span>
                </div>
                <div class="sv-stat-tile">
                  <span class="sv-stat-label">Memory</span>
                  <strong>2.6% used</strong>
                  <span class="sv-stat-caption">16.6 GB available</span>
                </div>
                <div class="sv-stat-tile">
                  <span class="sv-stat-label">Temperature</span>
                  <strong>54°C</strong>
                  <span class="sv-stat-caption">Current device temperature</span>
                </div>
                <div class="sv-stat-tile">
                  <span class="sv-stat-label">Uptime</span>
                  <strong>6h 12m</strong>
                  <span class="sv-stat-caption">Since last reboot</span>
                </div>
              </div>

              <div class="sv-workspace-label">
                <span>SYSTEM HEALTH</span>
                <span>5 checks</span>
              </div>
              <div class="sv-check-list">
                <div class="sv-check-row">
                  <span class="sv-check-dot" aria-hidden="true"></span>
                  <strong>Persistent storage</strong>
                  <span>Persistent storage available</span>
                </div>
                <div class="sv-check-row">
                  <span class="sv-check-dot" aria-hidden="true"></span>
                  <strong>DNS resolution</strong>
                  <span>Resolving normally</span>
                </div>
                <div class="sv-check-row">
                  <span class="sv-check-dot" aria-hidden="true"></span>
                  <strong>Appliance updates</strong>
                  <span>Update prepared</span>
                </div>
                <div class="sv-check-row">
                  <span class="sv-check-dot" aria-hidden="true"></span>
                  <strong>Network protection</strong>
                  <span>Pi-hole is available</span>
                </div>
                <div class="sv-check-row">
                  <span class="sv-check-dot" aria-hidden="true"></span>
                  <strong>Local access</strong>
                  <span>Console is reachable</span>
                </div>
              </div>
            </div>
          </div>
          <figcaption>
            A preview of the Sovereign OS console, shown with sample system status and health checks.
          </figcaption>
        </figure>
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
