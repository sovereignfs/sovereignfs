#!/usr/bin/env node
// Ecosystem-level CLI for sovereignfs/sovereignfs. See ../../CONCEPT.md.

import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
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

// Like git(), but returns trimmed stdout instead of streaming it.
function gitOut(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

// Resolves a user-supplied repo name against the manifest. Matches on the
// local path first — it's unique, unlike `id` (the legacy checkout reuses
// "sovereign") — then falls back to the id of a non-legacy entry.
function findRepo(manifest, name) {
  return (
    manifest.repos.find((r) => r.path === name) ??
    manifest.repos.find((r) => r.id === name && !r.legacy)
  );
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
  const results = { ok: [], skipped: [], failed: [] };
  for (const repo of manifest.repos) {
    // Entries marked "skip": true are opt-in — `pull <name> --reset` clones one.
    if (repo.skip) {
      results.skipped.push(repo.path);
      continue;
    }
    try {
      cloneOrPull(repo, { https });
      results.ok.push(repo.path);
    } catch (err) {
      console.error(`[${repo.path}] failed: ${err.message}`);
      results.failed.push(repo.path);
    }
  }
  console.log(
    `\ndone: ${results.ok.length} ok, ${results.skipped.length} skipped, ${results.failed.length} failed` +
      (results.skipped.length ? ` (skipped: ${results.skipped.join(", ")})` : "") +
      (results.failed.length ? ` (failed: ${results.failed.join(", ")})` : "")
  );
  if (results.failed.length) process.exitCode = 1;
}

// Brings a checkout's local `main` up to date with origin, fast-forward only.
// - On main: stash anything in the working tree (untracked included), pull,
//   then `stash apply` so the changes come back. The stash entry is kept
//   (apply, not pop) so nothing is lost if the apply conflicts.
// - On another branch: fast-forward the local main ref directly with
//   `fetch origin main:main`. The working tree isn't touched, so there is
//   nothing to stash.
function pullMain(dir) {
  const branch = gitOut(["-C", dir, "rev-parse", "--abbrev-ref", "HEAD"]);
  if (branch !== "main") {
    git(["-C", dir, "fetch", "origin", "main:main"]);
    console.log(`  main updated; working tree left on "${branch}".`);
    return;
  }
  const dirty = gitOut(["-C", dir, "status", "--porcelain"]) !== "";
  if (dirty) {
    console.log("  working tree has changes — stashing...");
    git(["-C", dir, "stash", "push", "--include-untracked", "-m", "workbench pull"]);
  }
  try {
    git(["-C", dir, "pull", "--ff-only"]);
  } finally {
    if (dirty) {
      try {
        git(["-C", dir, "stash", "apply"]);
      } catch {
        throw new Error(
          'pulled, but "git stash apply" hit conflicts — your changes are still in the stash ("git stash list")'
        );
      }
    }
  }
}

// Replaces a checkout with a fresh clone. The new clone is made beside the
// old one first, so a failed clone never costs you the existing checkout.
// Refuses to discard local work (uncommitted changes, commits not on any
// remote, stashes) unless --force. The gitignored .env is carried over.
function resetRepo(repo, { https, force }) {
  const dest = join(ROOT, repo.path);
  const tmp = `${dest}.reset-tmp`;
  const url = https ? toHttps(repo.url) : repo.url;
  const exists = existsSync(dest);
  const isRepo = existsSync(join(dest, ".git"));

  if (exists && !isRepo) {
    throw new Error(`${repo.path}/ exists but is not a git checkout — refusing to replace it`);
  }
  if (isRepo && !force) {
    const problems = [];
    if (gitOut(["-C", dest, "status", "--porcelain"])) problems.push("uncommitted changes");
    if (gitOut(["-C", dest, "log", "--branches", "--not", "--remotes", "--oneline"]))
      problems.push("commits not on any remote");
    if (gitOut(["-C", dest, "stash", "list"])) problems.push("stashed changes");
    if (problems.length) {
      throw new Error(
        `${repo.path}/ has ${problems.join(", ")} that a fresh clone would discard — re-run with --force to proceed`
      );
    }
  }

  console.log(`[${repo.path}] cloning a fresh copy...`);
  rmSync(tmp, { recursive: true, force: true });
  git(["clone", url, tmp]);

  if (isRepo) {
    const env = join(dest, ".env");
    if (existsSync(env) && !existsSync(join(tmp, ".env"))) copyFileSync(env, join(tmp, ".env"));
    rmSync(dest, { recursive: true, force: true });
  }
  renameSync(tmp, dest);
  console.log(`[${repo.path}] fresh clone ready${isRepo ? " (.env carried over if present)" : ""}.`);
}

function cmdPull(args) {
  const flags = new Set(args.filter((a) => a.startsWith("--")));
  const names = args.filter((a) => !a.startsWith("--"));
  const all = flags.has("--all");
  const reset = flags.has("--reset");
  const https = flags.has("--https");
  const force = flags.has("--force");
  const manifest = readManifest();

  if (all === (names.length > 0) || names.length > 1 || (all && reset)) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  if (!all) {
    const repo = findRepo(manifest, names[0]);
    if (!repo) {
      console.error(
        `Unknown repo "${names[0]}" — expected one of: ${manifest.repos.map((r) => r.path).join(", ")}`
      );
      process.exitCode = 1;
      return;
    }
    try {
      if (reset) {
        resetRepo(repo, { https, force });
      } else if (existsSync(join(ROOT, repo.path, ".git"))) {
        console.log(`[${repo.path}] updating main...`);
        pullMain(join(ROOT, repo.path));
      } else {
        throw new Error(
          `${repo.path}/ is not cloned — run "workbench pull ${repo.path} --reset" to clone it` +
            (repo.skip ? ' (it is marked "skip" in the manifest, so init leaves it out)' : "")
        );
      }
    } catch (err) {
      console.error(`[${repo.path}] failed: ${err.message}`);
      process.exitCode = 1;
    }
    return;
  }

  const results = { ok: [], skipped: [], failed: [] };
  for (const repo of manifest.repos) {
    const dir = join(ROOT, repo.path);
    if (!existsSync(join(dir, ".git"))) {
      results.skipped.push(repo.path);
      continue;
    }
    try {
      console.log(`[${repo.path}] updating main...`);
      pullMain(dir);
      results.ok.push(repo.path);
    } catch (err) {
      console.error(`[${repo.path}] failed: ${err.message}`);
      results.failed.push(repo.path);
    }
  }
  console.log(
    `\ndone: ${results.ok.length} ok, ${results.skipped.length} not cloned, ${results.failed.length} failed` +
      (results.skipped.length ? ` (not cloned: ${results.skipped.join(", ")})` : "") +
      (results.failed.length ? ` (failed: ${results.failed.join(", ")})` : "")
  );
  if (results.failed.length) process.exitCode = 1;
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

// Every manifest repo except legacy ones can have pods — see
// CONCEPT.md#pods-isolated-checkouts-for-parallel-work. Pods are named
// <prefix><n>: p<n> for sovereign and os<n> for sovereign-os (kept for
// continuity), <id>-<n> for everything else (e.g. fjord-1).
const POD_PREFIX_OVERRIDES = {
  sovereign: "p",
  "sovereign-os": "os",
};

function podPrefix(id) {
  return POD_PREFIX_OVERRIDES[id] ?? `${id}-`;
}

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
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`^${escaped}(\\d+)$`);
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
  const repo = findRepo(manifest, project);
  const poddable = manifest.repos.filter((r) => !r.legacy).map((r) => r.path);
  if (!repo || repo.legacy) {
    console.error(
      repo
        ? `"${project}" is a legacy repo — pods aren't available for it.`
        : `Unknown pod project "${project}" — expected one of: ${poddable.join(", ")}`
    );
    process.exitCode = 1;
    return;
  }

  const prefix = podPrefix(repo.id);
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
    if (!POD_PORT_VARS[repo.id]) {
      console.log(
        `[${podName}] note: no port variables are registered for ${repo.id} (POD_PORT_VARS) — .env copied as-is.`
      );
    }
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
  const [sub, ...rest] = args;
  const https = rest.includes("--https");
  const projects = rest.filter((a) => !a.startsWith("--"));
  if (sub === "create" && projects.length) {
    for (const project of projects) {
      try {
        cmdPodCreate(project, { https });
      } catch (err) {
        console.error(`[${project}] pod create failed: ${err.message}`);
        process.exitCode = 1;
      }
    }
    return;
  }
  printUsage();
  process.exitCode = 1;
}

// "root" is this repo (sovereignfs/sovereignfs) itself, at ROOT — it's not
// in workbench.manifest.json since it's not something `workbench init`
// clones, but it's still a git checkout that can go stale mid-session.
function clearTargets() {
  const manifest = readManifest();
  return [
    { id: "root", path: ROOT },
    // r.path, not r.id: the legacy checkout reuses id "sovereign".
    ...manifest.repos.map((r) => ({ id: r.path, path: join(ROOT, r.path) })),
  ];
}

// Stashes any local changes (including untracked) for safety, then resets
// to a clean main. `git stash push` exits 0 with "No local changes to
// save" when there's nothing to stash — not an error.
function clearRepo(dir) {
  git(["-C", dir, "stash", "push", "--include-untracked", "-m", "workbench clear"]);
  git(["-C", dir, "checkout", "main"]);
  git(["-C", dir, "pull", "--ff-only"]);
}

function cmdClear(args) {
  const w = args.includes("--w") ? args[args.indexOf("--w") + 1] : undefined;
  const targets = clearTargets();

  if (w) {
    const target = targets.find((t) => t.id === w);
    if (!target) {
      console.error(
        `Unknown clear target "${w}" — expected one of: ${targets.map((t) => t.id).join(", ")}`
      );
      process.exitCode = 1;
      return;
    }
    if (!existsSync(join(target.path, ".git"))) {
      console.error(`[${target.id}] ${target.path} is not a git checkout — nothing to clear.`);
      process.exitCode = 1;
      return;
    }
    console.log(`[${target.id}] stashing local changes, switching to main, pulling...`);
    clearRepo(target.path);
    console.log(`\n[${target.id}] clean.`);
    return;
  }

  const results = { ok: [], skipped: [], failed: [] };
  for (const target of targets) {
    if (!existsSync(join(target.path, ".git"))) {
      results.skipped.push(target.id);
      continue;
    }
    try {
      console.log(`[${target.id}] stashing local changes, switching to main, pulling...`);
      clearRepo(target.path);
      results.ok.push(target.id);
    } catch (err) {
      console.error(`[${target.id}] failed: ${err.message}`);
      results.failed.push(target.id);
    }
  }
  console.log(
    `\ndone: ${results.ok.length} ok, ${results.skipped.length} skipped, ${results.failed.length} failed` +
      (results.skipped.length ? ` (skipped: ${results.skipped.join(", ")})` : "") +
      (results.failed.length ? ` (failed: ${results.failed.join(", ")})` : "")
  );
  if (results.failed.length) process.exitCode = 1;
}

function printUsage() {
  console.log(`workbench — manage the sovereignfs ecosystem checkout

Usage:
  workbench init [--https]          Clone/pull every repo in workbench.manifest.json
                                     except entries marked "skip": true
                                     (SSH by default; --https uses https://github.com/... instead)
  workbench pull --all              Update main in every cloned repo (fast-forward only).
                                     On main: stash working-tree changes, pull, stash apply.
                                     On another branch: main is fast-forwarded in place.
  workbench pull <repo>             Same, for a single repo (manifest path, e.g. "fjord")
  workbench pull <repo> --reset [--force] [--https]
                                     Replace <repo> with a fresh clone (also the way to clone a
                                     "skip" repo). Refuses to discard uncommitted/unpushed/stashed
                                     work unless --force; .env is carried over.
  workbench kill-port [spec...]     Kill whatever's listening on the given ports/ranges
                                     e.g. "kill-port 3000", "kill-port 3000-3002",
                                     "kill-port 3001 3002 4000"
                                     (default: 3000-3999, 4000-4999, 5000-5999)
  workbench pod create <repo>... [--https]
                                     Create an isolated pod checkout of any non-legacy repo
                                     (clone, .env port rewrite, pnpm install). Pods are named
                                     p<n> (sovereign), os<n> (sovereign-os), <repo>-<n> (others)
  workbench clear [--w <id>]        Reset checkout(s) to a clean main: stash local changes
                                     for safety, checkout main, pull --ff-only.
                                     No args clears root + every manifest repo; --w <id>
                                     clears just one ("root", or a manifest repo path).
`);
}

const [, , command, ...rest] = process.argv;

switch (command) {
  case "init":
    cmdInit(rest);
    break;
  case "pull":
    cmdPull(rest);
    break;
  case "kill-port":
    cmdKillPort(rest);
    break;
  case "pod":
    cmdPod(rest);
    break;
  case "clear":
    cmdClear(rest);
    break;
  default:
    printUsage();
    process.exitCode = command ? 1 : 0;
}
