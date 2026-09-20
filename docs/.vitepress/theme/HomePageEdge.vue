<template>
  <main class="sv-home">
    <section class="sv-hero">
      <div class="sv-shell sv-edge-hero-grid">
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
          <!--
            Status prose, hand-written and therefore perishable. The version
            of this paragraph it replaced still said inference, chat, and
            connectors "are not built yet" long after all three shipped — the
            site was understating a working app by about two phases, because
            nothing here is derived from anything.

            Source of truth is sovereign-edge's own ROADMAP.md and
            docs/epics/README.md, both mirrored onto this site (/sovereign-edge/
            roadmap, /sovereign-edge/epics/README). Re-read them before editing
            this, and keep the claims to what those two documents mark done.
            Last checked against ROADMAP.md 0.2.12 (updated 2026-09-04).
          -->
          <p class="sv-hero-detail">
            <strong>Current status:</strong> the mobile app runs fully offline
            chat against a model you download onto the device, with writing
            assistance, and with Search, Calendar, and device connectors
            working under explicit per-connector permission. It isn't in the
            App Store or Play Store yet. A secondary desktop client publishes
            real macOS, Windows, and Linux builds (v0.1.5) with in-app
            updates; those installers aren't code-signed yet.
          </p>
          <div class="sv-actions" aria-label="Explore Sovereign Edge">
            <a class="sv-action sv-action-primary" href="/sovereign-edge/concept">Read the concept</a>
            <a class="sv-action sv-action-secondary" href="/sovereign-edge/research/README">Browse research</a>
            <a class="sv-action sv-action-link" href="/">← Sovereign</a>
          </div>
        </div>

        <figure class="sv-phone-figure">
          <div class="sv-phone-shell">
            <div class="sv-phone" aria-label="Sovereign Edge chat, mocked up for illustration">
              <div class="sv-phone-notch" aria-hidden="true"></div>
              <div class="sv-phone-screen">
                <header class="sv-phone-header" aria-hidden="true">
                  <span class="sv-brand-mark">E</span>
                  <strong>Sovereign Edge</strong>
                  <span class="sv-status-chip sv-status-chip-offline">On-device</span>
                </header>
                <div class="sv-chat-thread" aria-hidden="true">
                  <p class="sv-chat-bubble sv-chat-bubble-user">
                    Any good picnic spots near me this weekend?
                  </p>
                  <p class="sv-chat-bubble sv-chat-bubble-assistant">
                    A few parks nearby have decent forecasts this weekend —
                    here are the closest ones with details.
                  </p>
                  <span class="sv-chat-provenance">Answered via Search connector</span>
                  <p class="sv-chat-bubble sv-chat-bubble-assistant">
                    Want me to draft a short packing list too? That part I can
                    do fully offline.
                  </p>
                </div>
                <div class="sv-phone-input">
                  <span class="sv-phone-input-placeholder">Ask anything…</span>
                  <span class="sv-phone-send">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M4 12h14" />
                      <path d="M13 6l6 6-6 6" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <figcaption>
            A preview of the Sovereign Edge chat, shown with a sample offline conversation and a
            Search connector reply.
          </figcaption>
        </figure>
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
