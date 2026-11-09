// npm run publish:demo-server: put the bundle (npm run bundle:demo-server) on an Omniscope server.
//   OMNI_URL=https://public.omniscope.me OMNI_USER=... OMNI_PASS=... npm run publish:demo-server [-- --tree _bundle/tree]
//     [--dry-run] [--missing-only]
// Omniscope has no API to create folders, upload files into a folder or unpack an IOZ, so this drives the web UI in
// headless Chrome (one session, used in turn; the licence may count each browser session as a user):
//   - creates each missing folder (the web UI capitalises new folder names; URLs are case-insensitive);
//   - replaces each README.md, and uploads demo.ioz;
//   - opens demo.ioz?importioz, which unpacks it into the project demo.iox (an existing demo.iox is deleted first);
//   - deletes the uploaded demo.ioz.
// Signs in with HTTP basic authentication, sent with every request to the server. Afterwards, run npm run check:demo-links.
import { readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { chromium, type Page } from "playwright-core";
import { repoRoot } from "./lib/items.ts";

const args = process.argv.slice(2);
const opt = (name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const tree = opt("--tree") ?? join(repoRoot(), "_bundle", "tree");
const dryRun = args.includes("--dry-run");
// --missing-only: skip folders that already exist and demos whose project is already there (resume after failures).
const missingOnly = args.includes("--missing-only");
const verbose = args.includes("--verbose");
const step = (m: string) => { if (verbose) console.log("  " + m); };
const BASE = (process.env.OMNI_URL ?? "").replace(/\/$/, "");
const USER = process.env.OMNI_USER ?? "", PASS = process.env.OMNI_PASS ?? "";
if (!BASE || !USER || !PASS) throw new Error("set OMNI_URL, OMNI_USER and OMNI_PASS");
if (!existsSync(tree)) throw new Error(`no bundle at ${tree}: run npm run bundle:demo-server first`);
const AUTH = "Basic " + Buffer.from(`${USER}:${PASS}`).toString("base64");

const enc = (p: string) => p.split("/").filter(Boolean).map(encodeURIComponent).join("/");
const url = (p: string) => `${BASE}/${enc(p)}${p ? "/" : ""}`;

/** Folders in the tree, parents first, with the files directly in each. */
function folders(): { path: string; files: string[] }[] {
  const out: { path: string; files: string[] }[] = [];
  const walk = (dir: string) => {
    const entries = readdirSync(dir).sort();
    out.push({ path: relative(tree, dir).split(sep).join("/"), files: entries.filter((e) => statSync(join(dir, e)).isFile()) });
    for (const e of entries) if (statSync(join(dir, e)).isDirectory()) walk(join(dir, e));
  };
  walk(tree);
  return out;
}

async function exists(path: string): Promise<boolean> {
  // Follow redirects: the server redirects any path to its stored capitalisation ("JSON" to "Json"), even a path
  // that doesn't exist, so a 302 alone proves nothing.
  const r = await fetch(url(path), { headers: { Authorization: AUTH }, redirect: "follow" });
  return r.status === 200;
}

/** Poll until cond() holds: the web UI acts asynchronously, and a fixed wait is too short on a busy server. */
async function waitFor(cond: () => Promise<boolean>, ms: number): Promise<boolean> {
  for (const end = Date.now() + ms; Date.now() < end; ) {
    if (await cond()) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return cond();
}

async function openFolder(page: Page, path: string) {
  await page.goto(url(path), { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(3000);
  for (let i = 0; i < 3; i++) {
    const tour = page.locator('[data-aut-name^="App Tour"] [data-aut-name="Close"]:visible');
    if (!(await tour.count())) break;
    await tour.last().click({ force: true }).catch(() => {});
    await page.waitForTimeout(500);
  }
}

/** The listing shows names capitalised ("demo.ioz" as "Demo.ioz"); match without regard to case. */
async function row(page: Page, name: string) {
  const all = page.locator("[data-aut-name]");
  const n = await all.count();
  for (let i = 0; i < n; i++) {
    const el = all.nth(i);
    const a = await el.getAttribute("data-aut-name");
    if (a && a.toLowerCase() === name.toLowerCase() && (await el.locator('[data-aut-name="touch-to-edit"]').count())) return el;
  }
  return null;
}

async function remove(page: Page, folder: string, name: string): Promise<boolean> {
  step(`remove ${name} in ${folder}`);
  await openFolder(page, folder);
  const r = await row(page, name);
  if (!r) return false;
  await r.locator('[data-aut-name="touch-to-edit"]').first().click({ force: true });
  await page.waitForTimeout(800);
  await page.locator('[data-aut-name="Delete"]:visible').last().click({ force: true });
  await page.waitForTimeout(1000);
  const confirm = page.locator('[data-aut-name="Dialog"] [data-aut-name="Confirm delete"], [data-aut-name="Dialog"] [data-aut-name="Delete"]');
  if (await confirm.count()) { await confirm.last().click({ force: true }); await page.waitForTimeout(1500); }
  return true;
}

async function createFolder(page: Page, parent: string, name: string) {
  step(`create ${name} in ${parent}`);
  await openFolder(page, parent);
  await page.locator('[data-aut-name="Create"]').first().click({ force: true });
  await page.waitForTimeout(800);
  await page.locator('[data-aut-name="New folder"]:visible').first().click({ force: true });
  await page.waitForTimeout(1000);
  await page.keyboard.type(name);
  await page.keyboard.press("Enter");
  await waitFor(() => exists(parent ? `${parent}/${name}` : name), 30000);
}

async function upload(page: Page, folder: string, file: string) {
  step(`upload ${file}`);
  await openFolder(page, folder);
  await page.locator('[data-aut-name="Create"]').first().click({ force: true });
  await page.waitForTimeout(800);
  await page.locator('[data-aut-name="Upload"]:visible').first().click({ force: true });
  await page.waitForTimeout(1000);
  await page.locator("input.dz-hidden-input").setInputFiles(file);
  const name = file.split(/[\\/]/).pop()!;
  const arrived = await waitFor(() => exists(`${folder}/${name}`.replace(/^\//, "")), 120000);
  if (!arrived) throw new Error(`upload of ${name} did not arrive`);
  await page.waitForTimeout(1000);
}

const plan = folders();
console.log(`${plan.length} folders, ${plan.filter((f) => f.files.includes("demo.ioz")).length} demo projects, to ${BASE}`);
if (dryRun) { for (const f of plan) console.log(`${f.path || "(root)"}: ${f.files.join(", ")}`); process.exit(0); }

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/usr/bin/chromium" });
// Send the sign-in with every request to the server, not only when challenged: a server that lets anonymous
// visitors read (public.omniscope.me) never challenges, and the page would stay anonymous, without the Create menu.
// Routed so the credentials go to this server only, never to the CDNs the page loads from.
const context = await browser.newContext();
await context.route((u) => u.origin === new URL(BASE).origin, (route) =>
  route.continue({ headers: { ...route.request().headers(), authorization: AUTH } }));
const page = await context.newPage();
let failed = 0;
for (const f of plan) {
  if (missingOnly && f.path && (await exists(f.path)) &&
      (!f.files.includes("demo.ioz") || (await exists(`${f.path}/demo.iox`)))) continue;
  for (let attempt = 1; attempt <= 2; attempt++) try {
    if (f.path && !(await exists(f.path))) {
      const parts = f.path.split("/");
      await createFolder(page, parts.slice(0, -1).join("/"), parts.at(-1)!);
      if (!(await exists(f.path))) throw new Error("could not create the folder");
    }
    if (f.files.includes("README.md")) {
      await remove(page, f.path, "README.md");
      await upload(page, f.path, join(tree, f.path, "README.md"));
    }
    if (f.files.includes("demo.ioz")) {
      await remove(page, f.path, "demo");
      await remove(page, f.path, "demo.ioz");
      await upload(page, f.path, join(tree, f.path, "demo.ioz"));
      const r = await fetch(`${url(f.path)}demo.ioz?importioz`, { headers: { Authorization: AUTH } });
      const text = await r.text();
      if (!/File created/.test(text)) throw new Error("import failed: " + text.slice(0, 200));
      await remove(page, f.path, "demo.ioz");
    }
    console.log(`ok   ${f.path || "(root)"}`);
    break;
  } catch (e) {
    const msg = (e as Error).message.split("\n")[0];
    if (attempt < 2) { console.log(`retry ${f.path}: ${msg}`); continue; }
    failed++;
    console.log(`FAIL ${f.path}: ${msg}`);
  }
}
await browser.close();
process.exit(failed ? 1 : 0);
