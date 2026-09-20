import { defineConfig } from 'vitepress';
import {
  assertThemeLinksResolve,
  getRfcSidebarItems,
  getSovereignEdgeEpicSidebarGroups,
  getSovereignEdgeResearchSidebarItems,
  getSovereignMobileAdrSidebarItems,
  getSovereignMobileEpicSidebarItems,
  getSovereignMobileResearchSidebarItems,
  getSovereignOsAdrSidebarItems,
  getSovereignOsRfcSidebarItems,
  pagePath,
  resolveSourceUrl,
  writeLlmsTxt,
  publicGuideRewrites,
} from './publication';

const rfcIndexItem = { text: 'RFC Index', link: '/rfcs/README' };
const rfcSidebarItems = [rfcIndexItem, ...getRfcSidebarItems()];

const sovereignOsRfcIndexItem = { text: 'RFC Index', link: '/sovereign-os/rfcs/README' };
const sovereignOsRfcSidebarItems = [sovereignOsRfcIndexItem, ...getSovereignOsRfcSidebarItems()];

const sovereignOsAdrIndexItem = { text: 'ADR Index', link: '/sovereign-os/adrs/README' };
const sovereignOsAdrSidebarItems = [sovereignOsAdrIndexItem, ...getSovereignOsAdrSidebarItems()];

const sovereignOsProductSidebarItems = [
  { text: 'Target User', link: '/sovereign-os/product/target-user' },
  { text: 'Core Use Cases', link: '/sovereign-os/product/core-use-cases' },
  { text: 'Preview Scope', link: '/sovereign-os/product/preview-scope' },
  { text: 'Terminology', link: '/sovereign-os/product/terminology' },
];

const sovereignEdgeResearchIndexItem = {
  text: 'Research Index',
  link: '/sovereign-edge/research/README',
};
const sovereignEdgeResearchSidebarItems = [
  sovereignEdgeResearchIndexItem,
  ...getSovereignEdgeResearchSidebarItems(),
];

const sovereignEdgeEpicsIndexItem = { text: 'Epics Overview', link: '/sovereign-edge/epics/README' };
const sovereignEdgeEpicSidebarGroups = getSovereignEdgeEpicSidebarGroups();

const sovereignMobileAdrIndexItem = { text: 'ADR Index', link: '/apps/mobile/adrs/README' };
const sovereignMobileAdrSidebarItems = [
  sovereignMobileAdrIndexItem,
  ...getSovereignMobileAdrSidebarItems(),
];

const sovereignMobileResearchIndexItem = {
  text: 'Research Index',
  link: '/apps/mobile/research/README',
};
const sovereignMobileResearchSidebarItems = [
  sovereignMobileResearchIndexItem,
  ...getSovereignMobileResearchSidebarItems(),
];

const sovereignMobileEpicsIndexItem = {
  text: 'Epics Overview',
  link: '/apps/mobile/epics/README',
};
const sovereignMobileEpicSidebarItems = [
  sovereignMobileEpicsIndexItem,
  ...getSovereignMobileEpicSidebarItems(),
];

const backToSovereign = { text: '← Sovereign', link: '/' };

const productSidebarItems = [
  { text: 'What is Sovereign?', link: '/product/' },
  { text: 'Why Sovereign?', link: '/product/why-sovereign' },
  { text: 'How It Works', link: '/product/how-it-works' },
  { text: 'Features', link: '/product/features' },
  { text: 'Apps', link: '/product/apps' },
];

const gettingStartedSidebarItems = [
  { text: 'Choose a Path', link: '/get-started/' },
  { text: 'Use Sovereign', link: '/get-started/users' },
  { text: 'Host Sovereign', link: '/get-started/operators' },
  { text: 'Build an App', link: '/get-started/developers' },
];

// Desktop and Mobile are native shells that load a user's own Sovereign
// instance in a WebView — clients of the runtime, not products beside it (see
// confluence/concepts/native-shell-clients.md). Shown inside Sovereign's own
// documentation rather than in the Product menu, which is for Sovereign,
// Sovereign OS and Sovereign Edge: three things that genuinely stand alone.
const nativeAppsSidebarItems = [
  { text: 'Desktop', link: '/apps/desktop/' },
  { text: 'Mobile', link: '/apps/mobile/' },
];

const docsHubSidebarItems = [
  { text: 'Documentation Home', link: '/docs/' },
  { text: 'Use Sovereign', link: '/docs/users' },
  { text: 'Install as an App', link: '/docs/pwa' },
  { text: 'Operate Sovereign', link: '/docs/operators' },
  { text: 'Build Apps', link: '/docs/developers' },
  { text: 'Architecture & Security', link: '/docs/architecture' },
  { text: 'Contribute', link: '/docs/contributing' },
];

// Live GitHub Pages URL (RFC 0037) — used to build absolute canonical/social
// preview URLs, since og: tags and <link rel="canonical"> require one.
const siteUrl = 'https://sovereignfs.github.io';
const siteDescription =
  'Sovereign is an open-source workspace runtime for hosting private, multi-user apps on infrastructure you control.';
const socialPreviewImage = `${siteUrl}/social-preview.png`;

/**
 * A dead-link pattern that matches at any nesting depth: `./x`, `./../x`,
 * `./../../x`, and so on. Source repos reorganize directories without knowing
 * this site mirrors them, and a depth-pinned pattern silently stops matching
 * when they do — see ignoreDeadLinks below for the incident that motivated it.
 */
const upward = (pattern: string) => new RegExp(String.raw`^\.\/(?:\.\.\/)*` + pattern);

const config = defineConfig({
  srcDir: '.fetched/docs',
  outDir: '.vitepress/dist',
  // The site already emits canonical and og: URLs off siteUrl; a sitemap is
  // the same information in the form a crawler actually asks for.
  sitemap: { hostname: siteUrl },
  rewrites: publicGuideRewrites,
  // Every source repo's docs corpus is only partially mirrored, per
  // docs-sync.manifest.json's curated path list — each repo's own content
  // freely cross-links into directories and files we deliberately don't fetch
  // (workstreams/, epics/, operations/, incidents/, source trees like
  // runtime/ and packages/, root CLAUDE.md, etc.), and numbered-doc
  // collections assume a "docs/" prefix or sibling nesting that doesn't
  // survive our flattened per-repo URL structure (/sovereign-os/*,
  // /sovereign-edge/*). Those are genuinely unreachable in each curated
  // subset, not a bug.
  //
  // Patterns are depth-agnostic (`upward()`) on purpose. The depth-pinned
  // versions they replace all stopped matching at once when sovereign-edge
  // regrouped docs/epics/ into epics/{mobile,desktop,shared}/: every
  // "../../CONCEPT" became "../../../CONCEPT", and 12 already-known links
  // came back as build failures because a repo that has no idea this site
  // exists moved a directory. Matching any number of leading "../" segments
  // keeps a source-side move from re-breaking a build that was green.
  //
  // Worth keeping in mind when adding to this list: an ignored link still
  // renders, and still 404s for whoever clicks it. Ignoring is the right
  // answer for links into source trees and internal-only docs — nobody could
  // follow those from a public site anyway. It is the wrong answer for a link
  // whose target we could simply publish; that belongs in
  // docs-sync.manifest.json instead.
  //
  // Verify every change here against a real `workbench docs fetch` +
  // `pnpm --filter @sovereignfs/docs build`. A pattern that matches nothing
  // looks exactly like one that works, until a deploy proves otherwise.
  ignoreDeadLinks: [
    // Repo-root files and source trees, across every mirrored repo.
    upward(String.raw`CLAUDE$`), // repositories.md -> root CLAUDE.md
    upward(String.raw`AGENTS`), // sovereign-edge research/0006 -> root AGENTS.md
    upward(String.raw`CONTRIBUTING`), // sovereign-edge development-workflow.md, epics/README.md
    upward(String.raw`CONCEPT`), // sovereign-edge epics/* -> root CONCEPT.md (published here as concept.md)
    upward(String.raw`ROADMAP`), // sovereign-edge research/* -> root ROADMAP.md (published here as roadmap.md)
    upward(String.raw`(?:android|ios|packages|registry|runtime|example-plugins)\/`),
    // `apps/` is deliberately NOT in the group above: /apps/desktop and
    // /apps/mobile are real sections of this site now, and a blanket ignore
    // would hide a genuinely broken link into them. sovereign-edge's own
    // source tree also has an apps/ directory, and its development-workflow
    // page links into it — that one link, named exactly. If more appear the
    // build will say so, which is the point.
    /^\.\/\.\.\/apps\/mobile\/AGENTS$/,
    upward(String.raw`LICENSE`), // sovereign-desktop's README -> its own LICENSE file
    upward(String.raw`resources`), // sovereign-mobile store-listing.md -> its app-asset resources/
    // sovereign-mobile's ADR index cites this workbench's confluence/ wiki,
    // which is agent-facing internal knowledge and deliberately unpublished.
    upward(String.raw`confluence\/`),

    // Doc directories deliberately outside the published subset.
    upward(String.raw`docs\/`), // sovereign's self-referential "../docs/foo" links
    upward(String.raw`workstreams\/`),
    upward(String.raw`epics\/`), // sovereign's and sovereign-os's own epics/ — not sovereign-edge's, which is published
    upward(String.raw`incidents\/`),
    upward(String.raw`update\/`),
    upward(String.raw`(?:roadmap|design|templates|operations)\/`),
    upward(String.raw`(?:desktop-)?network-audit`),

    // Publication decisions, not structural gaps. Each of these is a
    // PUBLISHED page linking at content we could publish and haven't, so the
    // reader's 404 is real — ignoring only keeps the build green. Resolve by
    // adding the target to docs-sync.manifest.json or fixing the link at the
    // source, then delete the pattern.
    upward(String.raw`research\/`), // self-hosting.md -> sovereign docs/research/{0003,0015}
    upward(String.raw`legal\/`), // security.md -> docs/legal/operator-template-breach-response

    // Upstream bug, not a subset artifact: sovereign-os's RFC 0002 cites
    // "[ADR-0007](0007-console-authentication.md)" — correctly an ADR, but
    // linked as a sibling of rfcs/, where no such file exists (that repo's
    // rfcs/ jumps 0006 -> 0010). The target is published here, at
    // /sovereign-os/adrs/0007-console-authentication; the link just needs
    // "../adrs/" in front of it. Fix belongs in sovereign-os, not here.
    /^\.\/0007-console-authentication$/,
  ],
  // Every page on this site is prose authored in another repo, against
  // GitHub's renderer — not against VitePress's markdown-to-Vue-SFC
  // pipeline. Two constructs that are harmless on GitHub reach Vue's
  // compiler here and fail the whole build (not the page — the build), and
  // this repo can't fix them at the source fast enough to keep the site
  // deployable. Both are neutralized here instead:
  markdown: {
    config(md) {
      // 1. `{{ ... }}` inside INLINE code. VitePress wraps fenced blocks in
      //    v-pre but not inline code, so `--format '{{.Config.Entrypoint}}'`
      //    (architecture-rules.md) is handed to Vue as an expression and
      //    dies with "Error parsing JavaScript expression".
      const renderCodeInline = md.renderer.rules.code_inline;
      md.renderer.rules.code_inline = (tokens, idx, options, env, self) => {
        tokens[idx]?.attrSet('v-pre', '');
        return renderCodeInline
          ? renderCodeInline(tokens, idx, options, env, self)
          : self.renderToken(tokens, idx, options);
      };

      // 2. A wrapped line that BEGINS with a `<placeholder>` — e.g. an
      //    inline code span broken across lines as `` `Bearer ⏎ <key>` ``
      //    (sovereign-edge epics/desktop/app-shell.md). markdown-it's
      //    html_block rule opens an HTML block there, which ends the
      //    paragraph before the code span can pair, and `<key>` reaches Vue
      //    as an unclosed element ("Element is missing end tag"). Disabling
      //    the block rule lets the span pair and escape normally; inline
      //    HTML still works, so deliberate markup (design-system.md's
      //    `<a id="...">` anchors) is unaffected. The mirrored corpus uses
      //    no block-level HTML at all — every `<thing>` in it is a
      //    placeholder like <key>, <udid>, <image>, <pluginId>.
      md.block.ruler.disable('html_block');
    },
  },

  buildEnd(siteConfig) {
    writeLlmsTxt(siteConfig.outDir, siteUrl, siteDescription);
  },
  transformPageData(pageData) {
    // Every page on this site was authored in another repo, so a reader who
    // spots a mistake has nowhere to go and a contributor can't find the file.
    // Resolved here rather than through themeConfig.editLink: themeConfig is
    // serialized to the client, so a pattern function there is re-evaluated in
    // the browser and can't call back into this module (it throws
    // "resolveSourceUrl is not defined" at render time) — and one URL pattern
    // couldn't cover five different repos regardless.
    //
    // filePath is the path before `rewrites`, which is what we want: a
    // /docs/users page resolves through its real source, guides/users.md.
    const sourceUrl = resolveSourceUrl(pageData.filePath || pageData.relativePath);
    if (sourceUrl) pageData.frontmatter.sourceUrl = sourceUrl;
  },
  transformHead({ pageData, title, description }) {
    const canonicalUrl = `${siteUrl}${pagePath(pageData.relativePath)}`;
    return [
      ['link', { rel: 'canonical', href: canonicalUrl }],
      ['meta', { property: 'og:type', content: 'website' }],
      ['meta', { property: 'og:site_name', content: 'Sovereign' }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { property: 'og:url', content: canonicalUrl }],
      ['meta', { property: 'og:image', content: socialPreviewImage }],
      ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
      ['meta', { name: 'twitter:title', content: title }],
      ['meta', { name: 'twitter:description', content: description }],
      ['meta', { name: 'twitter:image', content: socialPreviewImage }],
    ];
  },
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['link', { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }],
  ],
  vite: {
    plugins: [
      {
        name: 'sovereign-canonical-guide-routes',
        configureServer(server) {
          server.middlewares.use((request, response, next) => {
            const requestUrl = request.url ?? '/';
            const [pathname = '/', query] = requestUrl.split('?', 2);
            const acceptsHtml = request.headers.accept?.includes('text/html');

            if (acceptsHtml && (pathname === '/guides' || pathname.startsWith('/guides/'))) {
              const canonicalPath = pathname.replace(/^\/guides/, '/docs');
              response.statusCode = 308;
              response.setHeader('Location', `${canonicalPath}${query ? `?${query}` : ''}`);
              response.end();
              return;
            }

            next();
          });
        },
      },
    ],
    build: {
      // VitePress local search emits one generated search-index chunk, and it
      // is the only thing here that trips the size warning. The threshold has
      // to track the corpus: 1200 against a 3.7 MB index meant the warning
      // fired on every single build, which is how a size warning stops being
      // read at all.
      // It's lazily fetched on first search, not part of page load.
      chunkSizeWarningLimit: 4500,
    },
    resolve: {
      dedupe: ['vue'],
    },
    server: {
      port: 3333,
      strictPort: true,
    },
    preview: {
      port: 3333,
      strictPort: true,
    },
  },
  title: 'Sovereign',
  description: siteDescription,

  themeConfig: {
    // Layout.vue swaps this down to just [Product, GitHub] on /sovereign-os/
    // and /sovereign-edge/ pages (filtered from this same array, single
    // source of truth) — the rest of these items are sovereign-runtime-specific.
    nav: [
      {
        text: 'Product',
        items: [
          { text: 'Sovereign', link: '/' },
          { text: 'Sovereign OS', link: '/sovereign-os/' },
          { text: 'Sovereign Edge', link: '/sovereign-edge/' },
        ],
      },
      { text: 'Instances', link: '/instances' },
      {
        text: 'Docs',
        items: [
          { text: 'Get Started', link: '/get-started/' },
          { text: 'Full Documentation', link: '/docs/' },
        ],
      },
      { text: 'Roadmap', link: '/product-roadmap' },
      { text: 'GitHub', link: 'https://github.com/sovereignfs/sovereign' },
    ],

    sidebar: {
      '/product/': [
        {
          text: 'Product',
          items: productSidebarItems,
        },
      ],
      '/get-started/': [
        {
          text: 'Get Started',
          items: gettingStartedSidebarItems,
        },
      ],
      '/docs/': [
        {
          text: 'Documentation',
          items: docsHubSidebarItems,
        },
        // Next to "Install as an App" (the PWA route), because that's the
        // question these answer: how do I get Sovereign onto this device?
        {
          text: 'Native Apps',
          items: nativeAppsSidebarItems,
        },
      ],
      '/rfcs/': [
        {
          text: 'RFCs',
          items: rfcSidebarItems,
        },
      ],
      '/sovereign-os/product/': [
        backToSovereign,
        {
          text: 'Product',
          items: sovereignOsProductSidebarItems,
        },
      ],
      '/sovereign-os/rfcs/': [
        backToSovereign,
        {
          text: 'RFCs',
          items: sovereignOsRfcSidebarItems,
        },
      ],
      '/sovereign-os/adrs/': [
        backToSovereign,
        {
          text: 'ADRs',
          items: sovereignOsAdrSidebarItems,
        },
      ],
      '/sovereign-os/': [
        backToSovereign,
        {
          text: 'Sovereign OS',
          items: [
            { text: 'Concept', link: '/sovereign-os/concept' },
            { text: 'Product', link: '/sovereign-os/product/target-user' },
            { text: 'Roadmap', link: '/sovereign-os/roadmap' },
          ],
        },
        // Until these were published, every Sovereign OS page on this site was
        // a planning document — concept, product, roadmap, RFCs, ADRs — and
        // someone holding the actual hardware had nowhere to go. These are the
        // owner-facing subset of sovereign-os's docs/operations/; the rest of
        // that directory is release-engineering and qualification procedure,
        // deliberately left out of the manifest.
        {
          text: 'Set Up Your Device',
          items: [
            {
              text: 'First Login & Network Setup',
              link: '/sovereign-os/guides/first-login-and-network-setup',
            },
            {
              text: 'Raspberry Pi Imager Provisioning',
              link: '/sovereign-os/guides/raspberry-pi-imager-provisioning',
            },
            {
              text: 'Updates, Rollback & Recovery',
              link: '/sovereign-os/guides/update-recovery-and-compatibility',
            },
          ],
        },
        {
          text: 'Architecture & Security',
          items: [
            { text: 'System Overview', link: '/sovereign-os/architecture/system-overview' },
            { text: 'Threat Model', link: '/sovereign-os/security/threat-model' },
            { text: 'Data Inventory', link: '/sovereign-os/security/data-inventory' },
          ],
        },
        {
          text: 'Contributing',
          items: [
            { text: 'Development Workflow', link: '/sovereign-os/development/workflow' },
            { text: 'RFCs', link: '/sovereign-os/rfcs/README' },
            { text: 'ADRs', link: '/sovereign-os/adrs/README' },
          ],
        },
      ],
      '/sovereign-edge/research/': [
        backToSovereign,
        {
          text: 'Research',
          items: sovereignEdgeResearchSidebarItems,
        },
      ],
      '/sovereign-edge/epics/': [
        backToSovereign,
        {
          text: 'Epics',
          items: [sovereignEdgeEpicsIndexItem],
        },
        // Discovered per scope directory (Mobile/Desktop/Shared) — see
        // getSovereignEdgeEpicSidebarGroups for why this isn't hand-listed.
        ...sovereignEdgeEpicSidebarGroups,
      ],
      '/sovereign-edge/': [
        backToSovereign,
        {
          text: 'Sovereign Edge',
          items: [
            { text: 'Concept', link: '/sovereign-edge/concept' },
            { text: 'Roadmap', link: '/sovereign-edge/roadmap' },
            { text: 'Development Workflow', link: '/sovereign-edge/development-workflow' },
            { text: 'Research', link: '/sovereign-edge/research/README' },
            { text: 'Epics', link: '/sovereign-edge/epics/README' },
          ],
        },
      ],
      '/apps/mobile/adrs/': [
        backToSovereign,
        {
          text: 'ADRs',
          items: sovereignMobileAdrSidebarItems,
        },
      ],
      '/apps/mobile/epics/': [
        backToSovereign,
        {
          text: 'Epics',
          items: sovereignMobileEpicSidebarItems,
        },
      ],
      '/apps/mobile/research/': [
        backToSovereign,
        {
          text: 'Research',
          items: sovereignMobileResearchSidebarItems,
        },
      ],
      '/apps/mobile/': [
        backToSovereign,
        {
          text: 'Sovereign Mobile',
          items: [
            { text: 'Concept', link: '/apps/mobile/' },
            { text: 'Roadmap', link: '/apps/mobile/roadmap' },
            { text: 'Development Workflow', link: '/apps/mobile/development-workflow' },
            { text: 'ADRs', link: '/apps/mobile/adrs/README' },
            { text: 'Epics', link: '/apps/mobile/epics/README' },
            { text: 'Research', link: '/apps/mobile/research/README' },
          ],
        },
      ],
      // sovereign-desktop keeps no docs/ of its own — its README is the
      // public overview, and its task tracking lives in sovereign's epic 17.
      '/apps/desktop/': [
        backToSovereign,
        {
          text: 'Sovereign Desktop',
          items: [{ text: 'Overview', link: '/apps/desktop/' }],
        },
      ],
      '/': [
        {
          text: 'Operator Guides',
          items: [
            { text: 'Self-Hosting', link: '/self-hosting' },
            { text: 'Upgrade Guide', link: '/upgrade' },
            { text: 'Troubleshooting', link: '/troubleshooting' },
          ],
        },
        {
          text: 'App Developer Guides',
          items: [
            { text: 'Overview', link: '/plugin-development' },
            { text: 'SDK Stability', link: '/sdk-stability' },
            { text: 'Plugin Database', link: '/plugin-database' },
            { text: 'Design System', link: '/design-system' },
          ],
        },
        {
          text: 'Architecture & Security',
          items: [
            { text: 'Architecture', link: '/architecture' },
            { text: 'Security', link: '/security' },
            { text: 'Repository Map', link: '/repositories' },
          ],
        },
        {
          text: 'Native Apps',
          items: nativeAppsSidebarItems,
        },
        // Every plugin that ships inside the platform repository. Inbox and
        // Warden were published all along — docs/plugins is fetched whole —
        // but nothing linked to them, so the only way to reach either was
        // search or a direct URL.
        {
          text: 'Built-in Apps',
          items: [
            { text: 'Launcher', link: '/plugins/launcher' },
            { text: 'Account', link: '/plugins/account' },
            { text: 'Inbox', link: '/plugins/inbox' },
            { text: 'Console', link: '/plugins/console' },
            { text: 'Warden', link: '/plugins/warden' },
          ],
        },
        {
          text: 'Contributor Guides',
          items: [
            { text: 'Documentation Structure', link: '/documentation-structure' },
            { text: 'Development Workflow', link: '/development-workflow' },
            { text: 'Agent-First Documentation', link: '/agent-first-documentation' },
            { text: 'Architecture Rules', link: '/architecture-rules' },
            { text: 'Testing E2E', link: '/testing-e2e' },
            { text: 'Visual Regression Testing', link: '/testing-visual' },
            { text: 'PWA Device Testing', link: '/pwa-real-device-testing' },
          ],
        },
        {
          text: 'RFCs',
          collapsed: true,
          items: [rfcIndexItem],
        },
      ],
    },

    search: { provider: 'local' },

    socialLinks: [{ icon: 'github', link: 'https://github.com/sovereignfs/sovereign' }],

    footer: {
      message: 'Open source under AGPL-3.0. Each Sovereign instance is independently operated.',
      copyright: 'Sovereign',
    },
  },
});

// VitePress's dead-link pass reads markdown and never looks at themeConfig, so
// a hand-written nav/sidebar link can 404 for readers through any number of
// green builds. Check them here instead — see assertThemeLinksResolve.
assertThemeLinksResolve(config.themeConfig);

export default config;
