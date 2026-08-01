import { defineConfig } from 'vitepress';
import {
  getRfcSidebarItems,
  getSovereignEdgeResearchSidebarItems,
  getSovereignOsAdrSidebarItems,
  getSovereignOsRfcSidebarItems,
  pagePath,
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

// Epics aren't numbered files (unlike RFCs/ADRs/research), so there's no
// filename-derived sort order to auto-discover from — hand-listed here in
// the same epic-ID order as sovereign-edge's own docs/epics/README.md.
const sovereignEdgeEpicsIndexItem = { text: 'Epics Overview', link: '/sovereign-edge/epics/README' };
const sovereignEdgeEpicSidebarItems = [
  sovereignEdgeEpicsIndexItem,
  { text: '0 — Infrastructure', link: '/sovereign-edge/epics/infrastructure' },
  { text: '1 — Core Inference & Chat', link: '/sovereign-edge/epics/core-inference-chat' },
  { text: '2 — Connector Framework', link: '/sovereign-edge/epics/connector-framework' },
  { text: '3 — Search Connector', link: '/sovereign-edge/epics/search-connector' },
  {
    text: '4 — Sovereign Tasks Connector',
    link: '/sovereign-edge/epics/sovereign-tasks-connector',
  },
  { text: '5 — Connector Store & SDK', link: '/sovereign-edge/epics/connector-store-sdk' },
  { text: '6 — Monetization', link: '/sovereign-edge/epics/monetization' },
  { text: '7 — Design System & Branding', link: '/sovereign-edge/epics/design-system' },
  { text: '8 — Mobile App Shell', link: '/sovereign-edge/epics/mobile-app-shell' },
  { text: '9 — Desktop App', link: '/sovereign-edge/epics/desktop-app' },
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
const socialPreviewImage = `${siteUrl}/social-preview.png`;

export default defineConfig({
  srcDir: '.fetched/docs',
  outDir: '.vitepress/dist',
  rewrites: publicGuideRewrites,
  // Every source repo's docs corpus is only partially mirrored, per
  // docs-sync.manifest.json's curated path list — each repo's own content
  // freely cross-links into directories/files we deliberately don't fetch
  // (workstreams/, epics/, example-plugins/, registry/, operations/,
  // update/, root CLAUDE.md, etc.), and numbered-doc collections assume a
  // "docs/" prefix or sibling nesting that doesn't survive our flattened
  // per-repo URL structure (/sovereign-os/*, /sovereign-edge/*). These are
  // genuinely unreachable in each curated subset, not a bug — but see the
  // "Docs" GitHub Actions workflow's push-to-main trigger (added after this
  // exact class of link went unnoticed until an actual deploy run): every
  // list below should have been verified against a real `vitepress build`
  // — as this comment's history was not — before assuming a pattern here
  // actually matches anything. `pnpm --filter @sovereignfs/docs build`
  // (after a `workbench docs fetch`) is the only reliable way to check.
  //
  // sovereign's own docs:
  ignoreDeadLinks: [
    /^\.\/docs\//,
    /^\.\/\.\.\/CLAUDE$/, // repositories.md -> root CLAUDE.md
    /^\.\/\.\.\/example-plugins\//, // plugin-development.md -> example-plugins/
    /^\.\/\.\.\/registry\//, // repositories.md -> registry/CONTRIBUTING.md
    /^\.\/workstreams\//, // development-workflow.md, repositories.md -> docs/workstreams/*
    /^\.\/\.\.\/workstreams\//, // rfcs/* -> docs/workstreams/*
    /^\.\/\.\.\/epics\//, // rfcs/* -> docs/epics/* (sovereign's own, unrelated to sovereign-edge's epics/)
    // sovereign-os's own docs — cross-links into directories/files outside
    // the curated product/rfcs/adrs/roadmap/concept subset:
    /^\.\/\.\.\/(roadmap|research|design|templates)\//,
    /^\.\/\.\.\/operations\//, // adrs/* -> docs/operations/*
    /^\.\/update\//, // roadmap.md (repo-root-level) -> sibling update/*
    /^\.\/\.\.\/\.\.\/update\//, // rfcs/* (nested one level deeper) -> update/*
    // sovereign-edge's own docs — epics/research link two levels up to root
    // CONCEPT.md/ROADMAP.md, which map here to differently-named
    // concept.md/roadmap.md, not a same-named file two directories up:
    /^\.\/\.\.\/\.\.\/CONCEPT/,
    /^\.\/\.\.\/\.\.\/ROADMAP/,
    /^\.\/CONCEPT$/, // roadmap.md -> sibling CONCEPT.md
  ],
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
      // VitePress local search emits one generated search-index chunk. Keep the
      // warning threshold aligned with that known docs-only artifact.
      chunkSizeWarningLimit: 1200,
    },
    resolve: {
      dedupe: ['vue'],
    },
    server: {
      port: 3002,
      strictPort: true,
    },
    preview: {
      port: 3002,
      strictPort: true,
    },
  },
  title: 'Sovereign',
  description:
    'Sovereign is an open-source workspace runtime for hosting private, multi-user apps on infrastructure you control.',

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
          items: sovereignEdgeEpicSidebarItems,
        },
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
          text: 'Core Plugins',
          items: [
            { text: 'Console', link: '/plugins/console' },
            { text: 'Launcher', link: '/plugins/launcher' },
            { text: 'Account', link: '/plugins/account' },
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
