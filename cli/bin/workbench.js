#!/usr/bin/env node
// Ecosystem-level CLI for sovereignfs/sovereignfs. See ../../CONCEPT.md.

import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

function readManifest() {
  const manifestPath = join(ROOT, "workbench.manifest.json");
  if (!existsSync(manifestPath)) {
    throw new Error(`Manifest not found at ${manifestPath}`);
  }
  return JSON.parse(readFileSync(manifestPath, "utf8"));
}

function git(args, cwd) {
  return execFileSync("git", args, { cwd, stdio: "inherit" });
}

// Manifest URLs are SSH by default (git@github.com:org/repo.git).
// --https rewrites them to https://github.com/org/repo.git for developers
// without SSH keys configured for GitHub.
function toHttps(url) {
  const match = url.match(/^git@github\.com:(.+?)(\.git)?$/);
  if (!match) return url;
  return `https://github.com/${match[1]}.git`;
}

function cloneOrPull(repo, { https }) {
  const dest = join(ROOT, repo.path);
  const url = https ? toHttps(repo.url) : repo.url;
  const label = `[${repo.id}]`;
  if (existsSync(join(dest, ".git"))) {
    console.log(`${label} already cloned at ${repo.path}, pulling...`);
    git(["-C", dest, "pull", "--ff-only"]);
  } else {
    console.log(`${label} cloning into ${repo.path}...`);
    mkdirSync(dirname(dest), { recursive: true });
    git(["clone", url, dest]);
  }
}

function cmdInit(args) {
  const https = args.includes("--https");
  const manifest = readManifest();
  const results = { ok: [], failed: [] };
  for (const repo of manifest.repos) {
    try {
      cloneOrPull(repo, { https });
      results.ok.push(repo.id);
    } catch (err) {
      console.error(`[${repo.id}] failed: ${err.message}`);
      results.failed.push(repo.id);
    }
  }
  console.log(
    `\ndone: ${results.ok.length} ok, ${results.failed.length} failed` +
      (results.failed.length ? ` (${results.failed.join(", ")})` : "")
  );
  if (results.failed.length) process.exitCode = 1;
}

// Parses sovereign.plugins.local: one entry per line, blank lines and
// "#" comments (whole-line or trailing) ignored. Each line is either
// "<git-url>" (name derived from the repo) or "<name> <git-url>".
function parsePluginsLocal(raw) {
  const entries = [];
  for (const rawLine of raw.split("\n")) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const parts = line.split(/\s+/);
    let name, url;
    if (parts.length >= 2) {
      [name, url] = parts;
    } else {
      url = parts[0];
      name = url.replace(/^.*\//, "").replace(/\.git$/, "");
    }
    entries.push({ name, url });
  }
  return entries;
}

function cmdPluginsPull() {
  const configPath = join(ROOT, "sovereign.plugins.local");
  if (!existsSync(configPath)) {
    console.log(
      `No sovereign.plugins.local found at ${configPath} — skipping. ` +
        `See sovereign.plugins.local.example to set one up.`
    );
    return;
  }
  const sovereignDir = join(ROOT, "sovereign");
  if (!existsSync(join(sovereignDir, ".git"))) {
    console.error(
      `sovereign/ is not cloned yet — run "workbench init" first.`
    );
    process.exitCode = 1;
    return;
  }
  const pluginsDir = join(sovereignDir, "plugins");
  mkdirSync(pluginsDir, { recursive: true });

  const entries = parsePluginsLocal(readFileSync(configPath, "utf8"));
  const results = { ok: [], failed: [] };
  for (const { name, url } of entries) {
    const target = join(pluginsDir, `${name}.local`);
    const label = `[${name}.local]`;
    try {
      if (existsSync(join(target, ".git"))) {
        console.log(`${label} already exists, skipping.`);
      } else if (existsSync(target)) {
        throw new Error(`${target} exists but is not a git checkout`);
      } else {
        console.log(`${label} cloning ${url}...`);
        git(["clone", url, target]);
      }
      results.ok.push(name);
    } catch (err) {
      console.error(`${label} failed: ${err.message}`);
      results.failed.push(name);
    }
  }
  console.log(
    `\ndone: ${results.ok.length} ok, ${results.failed.length} failed` +
      (results.failed.length ? ` (${results.failed.join(", ")})` : "") +
      (results.ok.length
        ? `\nRun "pnpm install" inside sovereign/ so pnpm links their workspace deps.`
        : "")
  );
  if (results.failed.length) process.exitCode = 1;
}

function cmdPlugins(args) {
  const [sub] = args;
  if (sub === "pull") {
    cmdPluginsPull();
    return;
  }
  printUsage();
  process.exitCode = 1;
}

// Extracts the "key: value" pairs from a page's leading YAML frontmatter
// block. Good enough for the flat, single-line values confluence pages
// use (tags/repo/updated) — not a general YAML parser.
function readFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm = {};
  for (const line of match[1].split("\n")) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (m) fm[m[1]] = m[2].trim();
  }
  return fm;
}

function gitLastCommitDate(dir) {
  return execFileSync(
    "git",
    ["-C", dir, "log", "-1", "--format=%cd", "--date=short"],
    { encoding: "utf8" }
  ).trim();
}

// Shared by `confluence lint` (report only) and `confluence sync` (pull
// each mapped repo first, then report against the refreshed state).
function cmdConfluenceCheck({ sync }) {
  const manifest = readManifest();
  const byUrl = new Map(manifest.repos.map((r) => [r.url, r]));
  const entitiesDir = join(ROOT, "confluence", "entities");
  if (!existsSync(entitiesDir)) {
    console.error(`No confluence/entities/ directory found at ${entitiesDir}.`);
    process.exitCode = 1;
    return;
  }

  const files = readdirSync(entitiesDir).filter((f) => f.endsWith(".md"));
  const ok = [];
  const stale = [];
  const skipped = [];

  for (const file of files) {
    const label = `[${file}]`;
    const fm = readFrontmatter(readFileSync(join(entitiesDir, file), "utf8"));
    const repo = fm.repo ? byUrl.get(fm.repo) : undefined;
    if (!repo) {
      skipped.push(`${label} no manifest entry matches repo "${fm.repo ?? "(missing)"}"`);
      continue;
    }
    const dest = join(ROOT, repo.path);
    if (!existsSync(join(dest, ".git"))) {
      skipped.push(`${label} ${repo.path} not cloned — run "workbench init"`);
      continue;
    }
    if (sync) {
      try {
        git(["-C", dest, "pull", "--ff-only"]);
      } catch (err) {
        skipped.push(`${label} pull failed: ${err.message}`);
        continue;
      }
    }
    if (!fm.updated) {
      stale.push({ file, repo, reason: `missing "updated" frontmatter` });
      continue;
    }
    const lastCommit = gitLastCommitDate(dest);
    if (lastCommit > fm.updated) {
      stale.push({
        file,
        repo,
        reason: `${repo.path} last committed ${lastCommit}, page last verified ${fm.updated}`,
      });
    } else {
      ok.push(file);
    }
  }

  console.log(`confluence ${sync ? "sync" : "lint"}:\n`);
  if (ok.length) console.log(`up to date:\n  ${ok.join("\n  ")}`);
  if (stale.length) {
    console.log(
      `\nstale — re-verify against the source and bump "updated":\n  ` +
        stale.map((s) => `[${s.file}] ${s.reason}`).join("\n  ")
    );
  }
  if (skipped.length) console.log(`\nskipped:\n  ${skipped.join("\n  ")}`);

  if (stale.length) {
    const list = stale
      .map((s) => `- confluence/entities/${s.file} (source: ${s.repo.path})`)
      .join("\n");
    console.log(`
Re-ingest prompt — paste this to an agent to update the stale pages:
---
Re-ingest these confluence entity pages against their current source repos,
following the Ingest workflow in confluence/SCHEMA.md: re-read each source
repo listed below, update the page's content and its "updated" date,
update confluence/index.md if the summary changed, and append a
confluence/log.md entry describing what changed.

${list}
---`);
  }

  if (stale.length) process.exitCode = 1;
}

function cmdConfluence(args) {
  const [sub] = args;
  if (sub === "lint") {
    cmdConfluenceCheck({ sync: false });
    return;
  }
  if (sub === "sync") {
    cmdConfluenceCheck({ sync: true });
    return;
  }
  printUsage();
  process.exitCode = 1;
}

// Sparse-checkouts just the paths a docs-sync source declares, into a
// scratch dir — doesn't require the repo to already be cloned at the
// workbench root (the docs build must also work in CI, which starts from
// nothing but this repo).
function sparseCheckout(url, paths, https) {
  const scratch = mkdtempSync(join(tmpdir(), "workbench-docs-fetch-"));
  const cloneUrl = https ? toHttps(url) : url;
  git(["clone", "--filter=blob:none", "--sparse", "--depth", "1", cloneUrl, scratch]);
  // --no-cone: the manifest mixes whole directories with individual files;
  // cone mode (the default) only supports directory patterns. A leading
  // "/" anchors each pattern at the repo root (otherwise git warns that an
  // unanchored file pattern like "docs/foo.md" could also match a
  // same-named directory anywhere in the tree).
  git([
    "-C",
    scratch,
    "sparse-checkout",
    "set",
    "--no-cone",
    ...paths.map((p) => `/${p}`),
  ]);
  return scratch;
}

function cmdDocsFetch(args) {
  const https = args.includes("--https");
  const manifestPath = join(ROOT, "docs", "docs-sync.manifest.json");
  if (!existsSync(manifestPath)) {
    console.error(`No docs/docs-sync.manifest.json found at ${manifestPath}.`);
    process.exitCode = 1;
    return;
  }
  const syncManifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const byId = new Map(readManifest().repos.map((r) => [r.id, r]));
  // The fetched content's own leaf directory must be literally named "docs":
  // sovereign's docs cross-reference each other with self-referential
  // "../docs/foo.md" relative links (the ".." cancels back into the same
  // directory, relying on that directory being called "docs"). Nest it one
  // level inside .fetched/ so the gitignore boundary stays at .fetched/.
  const fetchedRoot = join(ROOT, "docs", ".fetched");
  const fetchedDir = join(fetchedRoot, "docs");
  rmSync(fetchedRoot, { recursive: true, force: true });
  mkdirSync(fetchedDir, { recursive: true });

  const results = { ok: [], failed: [] };
  for (const source of syncManifest.sources) {
    const repo = byId.get(source.repo);
    const label = `[${source.id}]`;
    if (!repo) {
      console.error(`${label} no workbench.manifest.json entry for repo "${source.repo}"`);
      results.failed.push(source.id);
      continue;
    }
    let scratch;
    try {
      console.log(`${label} fetching ${source.paths.length} path(s) from ${repo.id}...`);
      scratch = sparseCheckout(
        repo.url,
        source.paths.map((p) => p.from),
        https
      );
      for (const { from, to, exclude } of source.paths) {
        const src = join(scratch, from);
        const dest = join(fetchedDir, to);
        mkdirSync(dirname(dest), { recursive: true });
        cpSync(src, dest, { recursive: true });
        for (const name of exclude ?? []) {
          rmSync(join(dest, name), { force: true });
        }
      }
      results.ok.push(source.id);
    } catch (err) {
      console.error(`${label} failed: ${err.message}`);
      results.failed.push(source.id);
    } finally {
      if (scratch) rmSync(scratch, { recursive: true, force: true });
    }
  }

  // sovereign-os has no `layout: home` stub of its own (unlike sovereign's
  // docs/index.md) — this repo commits one and copies it into place after
  // the fetch, since anything under .fetched/ itself gets wiped above.
  const osHomeStub = join(ROOT, "docs", "sovereign-os-home.md");
  if (existsSync(osHomeStub)) {
    const dest = join(fetchedDir, "sovereign-os", "index.md");
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(osHomeStub, dest);
  }

  console.log(
    `\ndone: ${results.ok.length} ok, ${results.failed.length} failed` +
      (results.failed.length ? ` (${results.failed.join(", ")})` : "")
  );
  if (results.failed.length) process.exitCode = 1;
}

function cmdDocs(args) {
  const [sub, ...rest] = args;
  if (sub === "fetch") {
    cmdDocsFetch(rest);
    return;
  }
  printUsage();
  process.exitCode = 1;
}

const DEFAULT_KILL_PORT_SPECS = ["3000-3999", "4000-4999", "5000-5999"];

// Ports listening on a single port ("3000") or a range ("3000-3002"), via
// `lsof`. Exit code 1 with empty output means "nothing found" — not an
// error.
function pidsForSpec(spec) {
  try {
    const out = execFileSync("lsof", ["-ti", `tcp:${spec}`], {
      encoding: "utf8",
    });
    return out.split("\n").filter(Boolean);
  } catch (err) {
    if (err.status === 1 && !err.stdout?.toString().trim()) return [];
    throw err;
  }
}

function cmdKillPort(args) {
  const specs = args.length ? args : DEFAULT_KILL_PORT_SPECS;
  const invalid = specs.filter((s) => !/^\d+(-\d+)?$/.test(s));
  if (invalid.length) {
    console.error(
      `Invalid port spec(s): ${invalid.join(", ")} — expected a port ("3000") or a range ("3000-3002").`
    );
    process.exitCode = 1;
    return;
  }

  const pids = new Set();
  for (const spec of specs) {
    for (const pid of pidsForSpec(spec)) pids.add(pid);
  }
  if (!pids.size) {
    console.log(`Nothing listening on: ${specs.join(", ")}`);
    return;
  }
  console.log(`Killing ${pids.size} process(es) listening on ${specs.join(", ")}: ${[...pids].join(", ")}`);
  const failed = [];
  for (const pid of pids) {
    try {
      execFileSync("kill", ["-9", pid]);
    } catch (err) {
      console.error(`pid ${pid} failed: ${err.message}`);
      failed.push(pid);
    }
  }
  if (failed.length) process.exitCode = 1;
}

// p<n> for sovereign pods, os<n> for sovereign-os pods — see
// CONCEPT.md#pods-isolated-checkouts-for-parallel-work. Only projects with a
// prefix here are poddable; sovereign-desktop/support repos are not.
const POD_PREFIXES = {
  sovereign: "p",
  "sovereign-os": "os",
};

// Fixed-port env vars this CLI knows how to rewrite into a pod's isolated
// port block, and the default port each falls back to in the main checkout
// (so literal "localhost:<default>" references elsewhere in the file can be
// rewritten too). Extend this per project id if it grows more fixed-port
// services.
const POD_PORT_VARS = {
  sovereign: [
    { key: "RUNTIME_PORT", default: 3000 },
    { key: "AUTH_PORT", default: 3001 },
  ],
};

function nextPodIndex(prefix) {
  const podsDir = join(ROOT, "pods");
  if (!existsSync(podsDir)) return 1;
  const re = new RegExp(`^${prefix}(\\d+)$`);
  let max = 0;
  for (const name of readdirSync(podsDir)) {
    const m = name.match(re);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max + 1;
}

// Sets "KEY=value" in .env content — replacing an existing line for KEY
// (commented or not, so defaulted-but-commented vars like RUNTIME_PORT get
// turned on) or appending a new one if the key isn't present at all.
function setEnvVar(content, key, value) {
  const re = new RegExp(`^#?\\s*${key}=.*$`, "m");
  const line = `${key}=${value}`;
  if (re.test(content)) return content.replace(re, line);
  return content.replace(/\n?$/, `\n${line}\n`);
}

// Reserves a block of 10 ports per pod index (room to grow beyond today's
// two fixed-port vars without colliding with the next pod's block) and
// rewrites both the KEY=value assignments and any literal "localhost:<port>"
// reference elsewhere in the file that pointed at the main checkout's port.
function rewritePodEnv(content, projectId, index) {
  const vars = POD_PORT_VARS[projectId];
  if (!vars?.length) return content;
  const base = 5000 + (index - 1) * 10;
  let out = content;
  vars.forEach(({ key, default: def }, i) => {
    const port = base + i;
    out = setEnvVar(out, key, port);
    if (def != null && def !== port) {
      out = out.replaceAll(`localhost:${def}`, `localhost:${port}`);
    }
  });
  return out;
}

function cmdPodCreate(project, { https }) {
  const manifest = readManifest();
  const repo = manifest.repos.find((r) => r.id === project);
  const prefix = POD_PREFIXES[project];
  if (!repo || !prefix) {
    console.error(
      `Unknown pod project "${project}" — expected one of: ${Object.keys(POD_PREFIXES).join(", ")}`
    );
    process.exitCode = 1;
    return;
  }

  const index = nextPodIndex(prefix);
  const podName = `${prefix}${index}`;
  const podDir = join(ROOT, "pods", podName);
  if (existsSync(podDir)) {
    console.error(`${podDir} already exists — refusing to overwrite.`);
    process.exitCode = 1;
    return;
  }

  const url = https ? toHttps(repo.url) : repo.url;
  console.log(`[${podName}] cloning ${repo.id} into pods/${podName}...`);
  mkdirSync(dirname(podDir), { recursive: true });
  git(["clone", url, podDir]);

  const mainEnv = join(ROOT, repo.path, ".env");
  const podEnv = join(podDir, ".env");
  if (existsSync(mainEnv)) {
    console.log(`[${podName}] copying .env from ${repo.path}/.env and rewriting ports...`);
    const rewritten = rewritePodEnv(readFileSync(mainEnv, "utf8"), repo.id, index);
    writeFileSync(podEnv, rewritten);
  } else {
    console.log(`[${podName}] no .env at ${repo.path}/.env — skipping .env setup.`);
  }

  if (existsSync(join(podDir, "package.json"))) {
    console.log(`[${podName}] installing dependencies (pnpm install)...`);
    execFileSync("pnpm", ["install"], { cwd: podDir, stdio: "inherit" });
  }

  console.log(`\n[${podName}] ready at pods/${podName}`);
}

function cmdPod(args) {
  const [sub, project, ...rest] = args;
  if (sub === "create" && project) {
    cmdPodCreate(project, { https: rest.includes("--https") });
    return;
  }
  printUsage();
  process.exitCode = 1;
}

function printUsage() {
  console.log(`workbench — manage the sovereignfs ecosystem checkout

Usage:
  workbench init [--https]          Clone/pull every repo in workbench.manifest.json
                                     (SSH by default; --https uses https://github.com/... instead)
  workbench plugins pull            Clone the repos listed in sovereign.plugins.local
                                     into sovereign/plugins/<name>.local
  workbench confluence lint         Report entity pages whose source repo has newer
                                     commits than the page's "updated" date
  workbench confluence sync         Same as lint, but "git pull"s each mapped repo first
  workbench docs fetch [--https]    Fetch the paths in docs/docs-sync.manifest.json into
                                     docs/.fetched/, for the docs site build
  workbench kill-port [spec...]     Kill whatever's listening on the given ports/ranges
                                     e.g. "kill-port 3000", "kill-port 3000-3002",
                                     "kill-port 3001 3002 4000"
                                     (default: 3000-3999, 4000-4999, 5000-5999)
  workbench pod create <project> [--https]
                                     Create an isolated pod checkout of "sovereign" or
                                     "sovereign-os" (clone, .env port rewrite, pnpm install)
`);
}

const [, , command, ...rest] = process.argv;

switch (command) {
  case "init":
    cmdInit(rest);
    break;
  case "plugins":
    cmdPlugins(rest);
    break;
  case "confluence":
    cmdConfluence(rest);
    break;
  case "docs":
    cmdDocs(rest);
    break;
  case "kill-port":
    cmdKillPort(rest);
    break;
  case "pod":
    cmdPod(rest);
    break;
  default:
    printUsage();
    process.exitCode = command ? 1 : 0;
}
