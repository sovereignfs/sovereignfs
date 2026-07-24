import { defineConfig } from 'vitepress';
import {
  getRfcSidebarItems,
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
  // sovereign-os's docs corpus is only partially mirrored (product/rfcs/adrs/
  // roadmap, per docs-sync.manifest.json) — its own content cross-links into
  // directories we deliberately don't fetch (roadmap/, research/, design/,
  // templates/, update/), and ROADMAP.md's relative links assume a "docs/"
  // prefix that doesn't apply to our flattened /sovereign-os/ URL structure.
  // These are genuinely unreachable in this curated subset, not a bug.
  ignoreDeadLinks: [
    /^\.\/\.\.\/(roadmap|research|design|templates)\//,
    /^\.\/\.\.\/\.\.\/update\//,
    /^\.\/docs\//,
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
    // pages (filtered from this same array, single source of truth) — the
    // rest of these items are sovereign-runtime-specific.
    nav: [
      {
        text: 'Product',
        items: [
          { text: 'Sovereign', link: '/' },
          { text: 'Sovereign OS', link: '/sovereign-os/' },
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
