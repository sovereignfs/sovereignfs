import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const fetchedRoot = fileURLToPath(new URL('../.fetched/docs/', import.meta.url));
const rfcsDir = path.join(fetchedRoot, 'rfcs');
const sovereignOsRfcsDir = path.join(fetchedRoot, 'sovereign-os', 'rfcs');
const sovereignOsAdrsDir = path.join(fetchedRoot, 'sovereign-os', 'adrs');

/**
 * `guides/*` source pages (fetched from sovereign's docs/guides/) are served
 * under the `/docs/*` URL namespace instead of their natural `/guides/*`
 * route — this is a URL-shaping choice, not a public/private policy (that
 * policy now lives entirely in docs-sync.manifest.json: only fetched paths
 * ever reach this repo, so there's nothing left to filter here).
 */
export const publicGuideRewrites = {
  'guides/index.md': 'docs/index.md',
  'guides/users.md': 'docs/users.md',
  'guides/pwa.md': 'docs/pwa.md',
  'guides/operators.md': 'docs/operators.md',
  'guides/developers.md': 'docs/developers.md',
  'guides/architecture.md': 'docs/architecture.md',
  'guides/contributing.md': 'docs/contributing.md',
} as const;

/**
 * Local-doc-link routes that resolve through a rewrite rather than a direct
 * `docs/<path>.md` file. Derived from publicGuideRewrites (the rewrite VitePress
 * itself applies) so the link checker and the site can never drift apart.
 */
export function getDocsRouteRewrites(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(publicGuideRewrites).map(([source, destination]) => {
      const destinationWithoutExt = destination.replace(/\.md$/, '');
      const route = destinationWithoutExt.endsWith('/index')
        ? `/${destinationWithoutExt.slice(0, -'index'.length)}`
        : `/${destinationWithoutExt}`;
      return [route, `docs/${source}`];
    }),
  );
}

function extractDocTitle(absoluteFile: string, stripHeadingPrefix?: RegExp): string {
  const content = readFileSync(absoluteFile, 'utf8');
  const frontmatter = /^---\n([\s\S]*?)\n---/.exec(content)?.[1];
  const frontmatterTitle = frontmatter
    ? /^title:\s*(.+)$/m.exec(frontmatter)?.[1]?.trim()
    : undefined;
  if (frontmatterTitle) return frontmatterTitle.replace(/^['"]|['"]$/g, '');

  const heading = /^#\s+(.+)$/m.exec(content)?.[1]?.trim();
  if (heading) return stripHeadingPrefix ? heading.replace(stripHeadingPrefix, '') : heading;

  return path.basename(absoluteFile, '.md');
}

/**
 * Numbered docs (RFCs, ADRs) are added continuously; hand-maintaining a
 * sidebar entry per file drifts as soon as someone forgets to add one.
 * Discover them from the fetched dir instead — whatever `workbench docs
 * fetch` brought over is exactly the public set (docs-sync.manifest.json's
 * mapping is the entire policy, e.g. it already excludes rfcs/TEMPLATE.md).
 * `format` shapes the sidebar label per source — sovereign's RFC headings
 * are bare ("# Overlay Shell Variant") so the label rebuilds "RFC NNNN —
 * Title"; sovereign-os's headings already read well standalone
 * ("# RFC-0010: Title", "# ADR-0001: Title") so its callers use the
 * heading verbatim instead of re-deriving a label shape.
 */
function getNumberedDocSidebarItems(
  dir: string,
  format: (number: string, title: string, name: string) => { text: string; link: string },
  stripHeadingPrefix?: RegExp,
): Array<{ text: string; link: string }> {
  if (!existsDir(dir)) return [];
  return readdirSync(dir)
    .filter((name) => /^\d{4}-.+\.md$/.test(name))
    .sort()
    .map((name) => {
      const number = name.slice(0, 4);
      const title = extractDocTitle(path.join(dir, name), stripHeadingPrefix);
      return format(number, title, name);
    });
}

export function getRfcSidebarItems(): Array<{ text: string; link: string }> {
  return getNumberedDocSidebarItems(
    rfcsDir,
    (number, title, name) => ({
      text: `RFC ${number} — ${title}`,
      link: `/rfcs/${name.replace(/\.md$/, '')}`,
    }),
    /^RFC\s+\d+\s*[—-]\s*/,
  );
}

export function getSovereignOsRfcSidebarItems(): Array<{ text: string; link: string }> {
  return getNumberedDocSidebarItems(sovereignOsRfcsDir, (_number, title, name) => ({
    text: title,
    link: `/sovereign-os/rfcs/${name.replace(/\.md$/, '')}`,
  }));
}

export function getSovereignOsAdrSidebarItems(): Array<{ text: string; link: string }> {
  return getNumberedDocSidebarItems(sovereignOsAdrsDir, (_number, title, name) => ({
    text: title,
    link: `/sovereign-os/adrs/${name.replace(/\.md$/, '')}`,
  }));
}

function existsDir(dir: string): boolean {
  try {
    return readdirSync(dir) !== undefined;
  } catch {
    return false;
  }
}

/** Route a page's srcDir-relative path resolves to, for canonical/social URLs. */
export function pagePath(relativePath: string): string {
  const withoutExt = relativePath.replace(/\.md$/, '');
  if (withoutExt === 'index') return '/';
  return withoutExt.endsWith('/index')
    ? `/${withoutExt.slice(0, -'index'.length)}`
    : `/${withoutExt}`;
}
