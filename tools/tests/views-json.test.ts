import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, cpSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { syncViews, viewsText, withTabTags, PICKER_TABS } from "../lib/views-json.ts";
import { repoRoot } from "../lib/items.ts";
import { UNLISTED, CATEGORY_LABELS, viewCategories } from "../repo.ts";

const FIX = join(import.meta.dirname, "fixtures", "views-tree");
// On master, calendar had a folder but no views.json entry (unlisted in 2021); the fixture is that state.
const MASTER_UNLISTED = ["calendar"];

test("golden: on the views as they were before the tools, views.json comes back unchanged", () => {
  // views-tree/ holds views.json and every view's manifest from master on 6 November 2026.
  const before = JSON.parse(readFileSync(join(FIX, "views.json"), "utf8"));
  const r = syncViews(FIX, MASTER_UNLISTED);
  assert.deepEqual(r.views, before.views, "same entries, same order, same curated values");
  assert.deepEqual(r.added, []);
  assert.deepEqual(r.removed, []);
});

test("a new folder is appended from its manifest; a deleted folder is dropped", () => {
  const root = mkdtempSync(join(tmpdir(), "vj-"));
  cpSync(FIX, root, { recursive: true });
  mkdirSync(join(root, "newview"));
  writeFileSync(join(root, "newview", "manifest.json"), JSON.stringify({ name: "New View", tags: ["visokio-agents", "x"] }));
  writeFileSync(join(root, "newview", "index.html"), "");
  writeFileSync(join(root, "newview", "helper.js"), "");
  const r = syncViews(root, MASTER_UNLISTED);
  assert.deepEqual(r.added, ["newview"]);
  assert.deepEqual(r.views.at(-1), { name: "newview", displayName: "New View", tags: ["visokio-agents", "x"], files: ["helper.js"], version: 0 });
});

test("picker-tab tags follow view-categories.json; other tags keep their order", () => {
  assert.deepEqual(withTabTags(["custom", "diagram", "network", "Map"], ["network"]), ["custom", "network"]);
  assert.deepEqual(withTabTags(["custom", "heatmap"], ["table", "diagram"]), ["custom", "heatmap", "table", "diagram"]);
  assert.deepEqual(withTabTags(["Table", "x"], ["table"]), ["Table", "x"], "a tab tag in another case already counts");
  const r = syncViews(FIX, MASTER_UNLISTED, { bubblechart: ["diagram"] });
  assert.deepEqual(r.views.find((v) => v.name === "bubblechart")!.tags, ["custom", "bubble", "diagram"]);
  const before = JSON.parse(readFileSync(join(FIX, "views.json"), "utf8")).views;
  assert.deepEqual(r.views.find((v) => v.name === "beeswarm"), before.find((v: any) => v.name === "beeswarm"), "a view with no categories is left alone");
});

test("the picker tabs are the gallery's categories", () => {
  assert.deepEqual(PICKER_TABS, Object.keys(CATEGORY_LABELS));
});

test("views.json in the repository is up to date (run npm run build)", () => {
  const root = repoRoot();
  assert.equal(readFileSync(join(root, "views.json"), "utf8"), viewsText(syncViews(root, UNLISTED, viewCategories(root)).views));
});
