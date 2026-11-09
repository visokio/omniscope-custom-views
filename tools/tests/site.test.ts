import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { buildSite, lastUpdated } from "../site/build-site.ts";
import type { Item } from "../site/model.ts";
import { CONFIG, loadItems } from "../repo.ts";
import { libraries } from "../lib/live-demo.ts";
import { repoRoot } from "../lib/items.ts";

test("gallery builds an index, a page per view and catalogue.json", () => {
  const root = repoRoot();
  const out = mkdtempSync(join(tmpdir(), "site-"));
  const items = loadItems(root);
  const r = buildSite(CONFIG, items, root, out, "https://example.org/g/");
  assert.equal(r.pages, items.length + 1);
  assert.ok(existsSync(join(out, "kpi", "index.html")));
  const cat = JSON.parse(readFileSync(join(out, "catalogue.json"), "utf8"));
  assert.equal(cat.kind, "views");
  for (const k of ["id", "name", "category", "description", "tags", "inputs", "options", "links"]) assert.ok(k in cat.items[0], k);
});

test("libraries are read from a view's CDN script tags", () => {
  // A copy in the view's folder (no view in the repository bundles one any more, so a temporary folder).
  const dir = mkdtempSync(join(tmpdir(), "view-"));
  writeFileSync(join(dir, "index.html"), '<script src="d3.v4.min.js"></script>');
  writeFileSync(join(dir, "d3.v4.min.js"), "");
  assert.deepEqual(libraries(dir), ["d3 4 (in the view's folder)"]);
  assert.deepEqual(libraries(join(repoRoot(), "beeswarm")), ["d3 4.13.0"]);
  assert.deepEqual(libraries(join(repoRoot(), "threeforcegraph")), ["3d-force-graph 1.80.2"]);
});

test("descriptions are cut at a sentence end, never mid-word", async () => {
  const { shorten } = await import("../repo.ts");
  const s = shorten("A first sentence that is long enough to be kept as it stands here today. " + "word ".repeat(80));
  assert.equal(s, "A first sentence that is long enough to be kept as it stands here today.");
  assert.ok(shorten("word ".repeat(80)).endsWith("…"));
});

test("lastUpdated dates an item from its folder's last commit, and gives nothing without a full history", () => {
  const dir = mkdtempSync(join(tmpdir(), "history-"));
  const git = (args: string[], date: string) => execFileSync("git", ["-C", dir, "-c", "user.name=t", "-c", "user.email=t@example.org", ...args],
    { env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date }, stdio: "ignore" });
  const items = ["a", "b"].map((path) => ({ path })) as Item[];
  assert.equal(lastUpdated(dir, items).size, 0);
  git(["init", "-q"], "");
  for (const [path, date] of [["a", "2024-01-02T12:00:00Z"], ["b", "2025-03-04T12:00:00Z"]]) {
    mkdirSync(join(dir, path));
    writeFileSync(join(dir, path, "f"), path);
    git(["add", "."], date);
    git(["commit", "-qm", path], date);
  }
  assert.deepEqual([...lastUpdated(dir, items)], [["a", "2024-01-02"], ["b", "2025-03-04"]]);
  const shallow = mkdtempSync(join(tmpdir(), "shallow-"));
  execFileSync("git", ["clone", "-q", "--depth", "1", `file://${dir}`, shallow], { stdio: "ignore" });
  assert.equal(lastUpdated(shallow, items).size, 0);
});
