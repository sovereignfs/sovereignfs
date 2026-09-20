# @sovereignfs/docs

The VitePress app behind [sovereignfs.github.io](https://sovereignfs.github.io).

## The one thing to understand first

**No page of this site is written in this directory.** Every page is fetched at
build time from another repo — `sovereign`, `sovereign-os`, `sovereign-edge`,
`sovereign-mobile`, `sovereign-desktop` — into `.fetched/`, which is gitignored
and wiped and rebuilt on every fetch. Editing anything under `.fetched/` is
editing a file that will be gone on the next build.

What lives here is the *machinery*: the VitePress config, the theme, and the
manifest that decides what gets published.

```bash
../workbench.sh docs fetch    # populate .fetched/ (pnpm dev/build run this for you)
pnpm dev                      # http://localhost:3333
pnpm build                    # what CI runs — the only reliable check
```

### Previewing a page you haven't pushed yet

`docs fetch` clones each repo's remote, so an edit sitting in your
`sovereign/docs/` working tree is invisible here — and `pnpm dev` re-fetches
before it starts, which silently reverts it. Use the local checkouts instead,
and start VitePress without the re-fetch:

```bash
../workbench.sh docs fetch --local && pnpm exec vitepress dev
```

Re-run `../workbench.sh docs fetch` without `--local` afterwards. Only the
remote is what a deploy publishes, and it's worth seeing the difference before
you tag one.

## Where a change actually belongs

| You want to…                          | Change                                                    |
| ------------------------------------- | --------------------------------------------------------- |
| Fix wording on a page                 | The source repo. Use the "View this page's source" link.  |
| Publish a page that isn't on the site | `docs-sync.manifest.json`                                 |
| Unpublish a page                      | `docs-sync.manifest.json`                                 |
| Change nav, sidebar, or routes        | `.vitepress/config.ts`                                    |
| Change how a sidebar is generated     | `.vitepress/publication.ts`                               |
| Change layout or styling              | `.vitepress/theme/`                                       |

`docs-sync.manifest.json` **is** the publication policy: only paths listed there
are ever fetched, so nothing else can reach the public site. There is no
separate allowlist, and no denylist to keep in sync.

## Conventions that bite

- **Every change in this directory needs a version bump in `package.json`, in
  the same commit.** `fix/` → patch, `feat/` → minor. The deploy workflow
  publishes on a `docs-vX.Y.Z` tag that should match that version.
- **Only a real build tells you the truth.** Content is fetched fresh and
  unpinned, so an upstream commit can break this site with no change here —
  that is how the site sat broken for six weeks in 2026-08/09. The daily
  scheduled run in `.github/workflows/docs.yml` exists to catch exactly that,
  and it only helps if someone reads it.
- **Prose here is authored against GitHub's renderer, not VitePress's.**
  Markdown that is fine on GitHub can fail Vue's SFC compiler and take down the
  whole build. `.vitepress/config.ts`'s `markdown.config` neutralizes the two
  known cases; add to it rather than asking five repos to write differently.
- **A nav/sidebar link is not checked by VitePress.** `assertThemeLinksResolve`
  checks them at build time instead. Prefer generating a sidebar from the
  fetched files (see `publication.ts`) over hand-listing one.
