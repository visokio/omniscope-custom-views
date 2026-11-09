import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { buildSite } from "../site/build-site.ts";
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
