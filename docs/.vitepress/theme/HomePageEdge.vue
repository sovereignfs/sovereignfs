<template>
  <main class="sv-home">
    <section class="sv-hero">
      <div class="sv-shell">
        <div class="sv-hero-copy">
          <p class="sv-eyebrow">Fully offline AI companion</p>
          <h1>Sovereign Edge</h1>
          <p class="sv-hero-lead">
            A privacy-first, fully offline AI companion for phones.
          </p>
          <p class="sv-hero-detail">
            Download a small local language model straight to your own device
            and talk to it with zero network requests from the chat itself —
            not a promise, but true by construction, since the chat and
            inference path contains no network code. An optional,
            explicitly-permissioned connector layer lets it reach outside the
            device — to search the web, or talk to your own self-hosted
            software — but only once you've granted that specific connector
            that specific permission.
          </p>
          <p class="sv-hero-detail">
            <strong>Current status:</strong> early development — not usable
            yet, and not a release. The repo scaffold and CI pipeline are in
            place; on-device inference, the chat UI, and the connector layer
            are not built yet.
          </p>
          <div class="sv-actions" aria-label="Explore Sovereign Edge">
            <a class="sv-action sv-action-primary" href="/sovereign-edge/concept">Read the concept</a>
            <a class="sv-action sv-action-secondary" href="/sovereign-edge/research/README">Browse research</a>
            <a class="sv-action sv-action-link" href="/">← Sovereign</a>
          </div>
        </div>
      </div>
    </section>

    <section class="sv-proof" aria-label="Sovereign Edge principles">
      <div class="sv-shell sv-proof-grid">
        <p><strong>Offline by construction</strong><span>The chat and inference path has no network code — not a setting, a structural guarantee.</span></p>
        <p><strong>Explicit, scoped permission</strong><span>Anything that reaches outside the device is a separate connector, granted one permission at a time.</span></p>
        <p><strong>Free core, forever</strong><span>The chat app and a baseline set of connectors never require payment or an account.</span></p>
      </div>
    </section>
  </main>
</template>
