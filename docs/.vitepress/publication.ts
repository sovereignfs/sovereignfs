import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const fetchedRoot = fileURLToPath(new URL('../.fetched/docs/', import.meta.url));
const syncManifestPath = fileURLToPath(new URL('../docs-sync.manifest.json', import.meta.url));
const rfcsDir = path.join(fetchedRoot, 'rfcs');
const sovereignOsRfcsDir = path.join(fetchedRoot, 'sovereign-os', 'rfcs');
const sovereignOsAdrsDir = path.join(fetchedRoot, 'sovereign-os', 'adrs');
const sovereignEdgeResearchDir = path.join(fetchedRoot, 'sovereign-edge', 'research');
const sovereignEdgeEpicsDir = path.join(fetchedRoot, 'sovereign-edge', 'epics');
const sovereignMobileAdrsDir = path.join(fetchedRoot, 'apps', 'mobile', 'adrs');
const sovereignMobileResearchDir = path.join(fetchedRoot, 'apps', 'mobile', 'research');
const sovereignMobileEpicsDir = path.join(fetchedRoot, 'apps', 'mobile', 'epics');

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

/**
 * sovereign-edge's research headings read "# Research 0001 — Title", the
 * same bare-title shape as sovereign's own RFCs — re-derive the label
 * rather than using the heading verbatim (see this function's sibling
 * `getRfcSidebarItems` above for why).
 */
export function getSovereignEdgeResearchSidebarItems(): Array<{ text: string; link: string }> {
  return getNumberedDocSidebarItems(
    sovereignEdgeResearchDir,
    (number, title, name) => ({
      text: `Research ${number} — ${title}`,
      link: `/sovereign-edge/research/${name.replace(/\.md$/, '')}`,
    }),
    /^Research\s+\d+\s*[—-]\s*/,
  );
}

/**
 * sovereign-mobile's ADR headings already read well standalone
 * ("# ADR 0001 — Capacitor as the shell technology"), so the heading is the
 * label — same call as sovereign-os's ADRs, for the same reason.
 */
export function getSovereignMobileAdrSidebarItems(): Array<{ text: string; link: string }> {
  return getNumberedDocSidebarItems(sovereignMobileAdrsDir, (_number, title, name) => ({
    text: title,
    link: `/apps/mobile/adrs/${name.replace(/\.md$/, '')}`,
  }));
}

/** sovereign-mobile's research headings match sovereign-edge's shape exactly. */
export function getSovereignMobileResearchSidebarItems(): Array<{ text: string; link: string }> {
  return getNumberedDocSidebarItems(
    sovereignMobileResearchDir,
    (number, title, name) => ({
      text: `Research ${number} — ${title}`,
      link: `/apps/mobile/research/${name.replace(/\.md$/, '')}`,
    }),
    /^Research\s+\d+\s*[—-]\s*/,
  );
}

/**
 * sovereign-mobile's epics carry neither a number nor frontmatter — just an
 * "# Epic: Shell" heading — so there's nothing to sort on but the filename.
 * Alphabetical is arbitrary but stable, and (unlike a hand-written list) it
 * can't point at a file that no longer exists.
 */
export function getSovereignMobileEpicSidebarItems(): Array<{ text: string; link: string }> {
  if (!existsDir(sovereignMobileEpicsDir)) return [];
  return readdirSync(sovereignMobileEpicsDir)
    .filter((name) => name.endsWith('.md') && name !== 'README.md')
    .sort()
    .map((name) => ({
      text: extractDocTitle(path.join(sovereignMobileEpicsDir, name), /^Epic:\s*/),
      link: `/apps/mobile/epics/${name.replace(/\.md$/, '')}`,
    }));
}

/**
 * Not one page of this site is authored in this repo — every one is fetched
 * from sovereign, sovereign-os, sovereign-edge, sovereign-mobile or
 * sovereign-desktop. Without a source link a reader who spots a mistake has no
 * way to find the file that produced the page, and neither does a contributor.
 *
 * docs-sync.manifest.json already records exactly which repo and path each
 * route came from, so the mapping is read back out of it rather than restated
 * here — restating it is how the two would drift.
 */
type SourceMapping = { to: string; from: string; repo: string };

let sourceMappingsCache: SourceMapping[] | undefined;

function getSourceMappings(): SourceMapping[] {
  if (sourceMappingsCache) return sourceMappingsCache;
  const manifest = JSON.parse(readFileSync(syncManifestPath, 'utf8')) as {
    sources: Array<{ repo: string; paths: Array<{ from: string; to: string }> }>;
  };
  const mappings = manifest.sources.flatMap((source) =>
    source.paths.map((entry) => ({ to: entry.to, from: entry.from, repo: source.repo })),
  );
  // The two `layout: home` stubs are the exception: they're the only page
  // sources this repo owns, copied into .fetched/ after every fetch by
  // `workbench docs fetch`, so they aren't in the sync manifest at all.
  mappings.push(
    { to: 'sovereign-os/index.md', from: 'docs/sovereign-os-home.md', repo: 'sovereignfs' },
    { to: 'sovereign-edge/index.md', from: 'docs/sovereign-edge-home.md', repo: 'sovereignfs' },
  );
  // Longest destination first, so a file entry ("docs/index.md" -> "index.md")
  // always wins over a directory entry that happens to share a prefix.
  sourceMappingsCache = mappings.sort((a, b) => b.to.length - a.to.length);
  return sourceMappingsCache;
}

/**
 * GitHub URL for the file a page was built from, or '' when nothing in the
 * manifest claims it (VitePress renders no link for an empty pattern).
 *
 * `filePath` is the path VitePress read, before `rewrites` — so a /docs/users
 * page arrives here as its real source, guides/users.md, and maps cleanly.
 */
export function resolveSourceUrl(filePath: string): string {
  const mapping = getSourceMappings().find(
    (candidate) => filePath === candidate.to || filePath.startsWith(`${candidate.to}/`),
  );
  if (!mapping) return '';
  const remainder = filePath.slice(mapping.to.length).replace(/^\//, '');
  const sourcePath = remainder ? `${mapping.from}/${remainder}` : mapping.from;
  return `https://github.com/sovereignfs/${mapping.repo}/blob/main/${sourcePath}`;
}

/**
 * Sections of the site, in the order llms.txt should present them. A prefix of
 * '' is the sovereign runtime itself, which lives at the site root.
 */
const llmsSections = [
  { prefix: '', text: 'Sovereign — workspace runtime' },
  { prefix: 'sovereign-os/', text: 'Sovereign OS — Raspberry Pi appliance' },
  { prefix: 'sovereign-edge/', text: 'Sovereign Edge — offline AI companion' },
  { prefix: 'apps/desktop/', text: 'Sovereign for desktop — native shell for your own instance' },
  { prefix: 'apps/mobile/', text: 'Sovereign for mobile — native iOS/Android shell for your own instance' },
];

/**
 * Write an llms.txt index of the built site (https://llmstxt.org): one line per
 * page, grouped by product, so an agent can find its way around without
 * crawling 230 HTML pages or guessing URLs.
 *
 * This site mirrors five repos that between them publish an
 * "agent-first documentation" guide; shipping the index that convention asks
 * for costs one file and keeps the site honest about that.
 */
export function writeLlmsTxt(outDir: string, siteUrl: string, description: string): void {
  if (!existsDir(fetchedRoot)) return;

  const pages: string[] = [];
  const collect = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'public') collect(absolute);
      } else if (entry.name.endsWith('.md')) {
        pages.push(path.relative(fetchedRoot, absolute).split(path.sep).join('/'));
      }
    }
  };
  collect(fetchedRoot);

  const lines = [`# Sovereign`, '', `> ${description}`, ''];
  const claimed = new Set<string>();

  // Longest prefix first so a page under sovereign-os/ isn't claimed by the
  // root section, which matches everything.
  const sections = [...llmsSections].sort((a, b) => b.prefix.length - a.prefix.length);

  for (const section of llmsSections) {
    const inSection = pages
      .filter((page) => {
        if (claimed.has(page)) return false;
        const owner = sections.find((candidate) => page.startsWith(candidate.prefix));
        return owner?.prefix === section.prefix;
      })
      .sort();
    if (!inSection.length) continue;
    for (const page of inSection) claimed.add(page);

    lines.push(`## ${section.text}`, '');
    for (const page of inSection) {
      const title = extractDocTitle(path.join(fetchedRoot, page));
      lines.push(`- [${title}](${siteUrl}${pagePath(page)})`);
    }
    lines.push('');
  }

  writeFileSync(path.join(outDir, 'llms.txt'), lines.join('\n'), 'utf8');
  console.log(`[docs] wrote llms.txt (${claimed.size} pages)`);
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

/**
 * Flat, string-valued frontmatter fields — enough for the `epic:`/`title:`/
 * `scope:` keys sovereign-edge's epic files carry. Not a YAML parser; it
 * ignores anything nested, which none of these documents use.
 */
function readFrontmatter(absoluteFile: string): Record<string, string> {
  const block = /^---\n([\s\S]*?)\n---/.exec(readFileSync(absoluteFile, 'utf8'))?.[1];
  if (!block) return {};
  const fields: Record<string, string> = {};
  for (const line of block.split('\n')) {
    const [, key, value] = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line) ?? [];
    if (key) fields[key] = (value ?? '').trim().replace(/^['"]|['"]$/g, '');
  }
  return fields;
}

/**
 * Scope directories, in the order sovereign-edge's own epics/README.md
 * presents them. A scope that doesn't exist is skipped rather than failing —
 * that repo is free to add or retire one.
 */
const sovereignEdgeEpicScopes = [
  { dir: 'mobile', text: 'Mobile' },
  { dir: 'desktop', text: 'Desktop' },
  { dir: 'shared', text: 'Shared' },
] as const;

/**
 * Epics have no numeric filename to sort on (unlike RFCs/ADRs/research), but
 * every file carries `epic:` and `title:` frontmatter and sits in a scope
 * directory the repo treats as structural — enough to build the sidebar from.
 *
 * This replaced a hand-listed sidebar, and the reason is worth keeping: when
 * sovereign-edge regrouped a flat epics/ into epics/{mobile,desktop,shared}/,
 * every one of the ten hand-written links pointed at a file that no longer
 * existed, and the build stayed green the whole time — VitePress checks links
 * written in markdown, never links written in themeConfig. Discovery removes
 * the class of bug; `assertThemeLinksResolve` below catches whatever is still
 * hand-written.
 */
export function getSovereignEdgeEpicSidebarGroups(): Array<{
  text: string;
  items: Array<{ text: string; link: string }>;
}> {
  return sovereignEdgeEpicScopes.flatMap(({ dir, text }) => {
    const scopeDir = path.join(sovereignEdgeEpicsDir, dir);
    if (!existsDir(scopeDir)) return [];
    const items = readdirSync(scopeDir)
      .filter((name) => name.endsWith('.md') && name !== 'README.md')
      .map((name) => {
        const absoluteFile = path.join(scopeDir, name);
        const frontmatter = readFrontmatter(absoluteFile);
        const id = Number(frontmatter.epic);
        const title = frontmatter.title || extractDocTitle(absoluteFile, /^Epic:\s*/);
        return {
          order: Number.isFinite(id) ? id : Number.POSITIVE_INFINITY,
          text: Number.isFinite(id) ? `${id} — ${title}` : title,
          link: `/sovereign-edge/epics/${dir}/${name.replace(/\.md$/, '')}`,
        };
      })
      .sort((a, b) => a.order - b.order || a.text.localeCompare(b.text))
      .map(({ text: itemText, link }) => ({ text: itemText, link }));
    return items.length ? [{ text, items }] : [];
  });
}

/**
 * Fail the build when a hand-written nav or sidebar link points at a page
 * that isn't in the fetched corpus.
 *
 * Every such link is a hardcoded assertion about the directory layout of a
 * repo that has no idea this site exists, and VitePress will never check one:
 * its dead-link pass reads markdown, not themeConfig. That gap is how ten
 * broken sidebar links survived a green build and a daily scheduled rebuild
 * for weeks. Treat a themeConfig link with the same suspicion as a markdown
 * link, and find out at build time rather than from a reader.
 */
export function assertThemeLinksResolve(themeConfig: unknown): void {
  if (!existsDir(fetchedRoot)) {
    console.warn('[docs] skipped nav/sidebar link check: no .fetched/docs — run `workbench docs fetch`');
    return;
  }

  const routeRewrites = getDocsRouteRewrites();
  const checked = new Set<string>();
  const broken: string[] = [];

  const visit = (node: unknown): void => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== 'object') return;
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      // Only site-internal routes: http(s) links and #anchors aren't ours to verify.
      if (key === 'link' && typeof value === 'string' && value.startsWith('/')) {
        if (checked.has(value)) continue;
        checked.add(value);
        if (!routeResolvesToFetchedFile(value, routeRewrites)) broken.push(value);
        continue;
      }
      visit(value);
    }
  };
  visit(themeConfig);

  if (broken.length) {
    throw new Error(
      `${broken.length} nav/sidebar link(s) point at pages that aren't in the fetched corpus:\n` +
        broken.map((link) => `  ${link}`).join('\n') +
        '\nEither fix the link, or add its source path to docs/docs-sync.manifest.json.',
    );
  }
}

/** Does a site route have a backing file under .fetched/? Mirrors how VitePress resolves one. */
function routeResolvesToFetchedFile(route: string, routeRewrites: Record<string, string>): boolean {
  // A rewritten route (the /guides/* -> /docs/* shaping) is backed by its
  // source file, whose path getDocsRouteRewrites reports relative to .fetched/.
  const rewriteSource = routeRewrites[route];
  if (rewriteSource) return existsFile(path.join(fetchedRoot, '..', rewriteSource));

  const relative = route.replace(/^\//, '');
  const candidates = relative === '' || relative.endsWith('/')
    ? [`${relative}index.md`]
    : [`${relative}.md`, `${relative}/index.md`];
  return candidates.some((candidate) => existsFile(path.join(fetchedRoot, candidate)));
}

function existsFile(absoluteFile: string): boolean {
  try {
    return statSync(absoluteFile).isFile();
  } catch {
    return false;
  }
}
