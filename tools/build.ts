// npm run build: bring views.json up to date, check every manifest, and build the gallery into _site/.
//   npm run build -- --check      fail if views.json is out of date (CI on branches), build nothing
//   npm run build -- --no-site    views.json and checks only
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "./lib/items.ts";
import { syncViews, viewsText } from "./lib/views-json.ts";
import { validateRepo } from "./lib/validate.ts";
import { buildSite } from "./site/build-site.ts";
import { parseRelated, readRelated } from "./site/related.ts";
import { CONFIG, SITE_URL, UNLISTED, CATEGORY_LABELS, loadItems, viewCategories } from "./repo.ts";

const root = repoRoot();
const args = process.argv.slice(2);
const file = join(root, "views.json");
const sync = syncViews(root, UNLISTED, viewCategories(root));
const fresh = viewsText(sync.views);
const current = existsSync(file) ? readFileSync(file, "utf8") : "";

const problems = validateRepo(root);
// related.json: every link must lead somewhere, and links between two items here go both ways.
for (const p of parseRelated(CONFIG, readRelated(root), loadItems(root)).problems) problems.push({ ...p, level: "error" });
// Gallery categories: every listed view needs one or two of the picker's tabs in view-categories.json.
{
  const cats = viewCategories(root);
  for (const v of sync.views) {
    const c = cats[v.name];
    if (!c?.length) problems.push({ path: v.name, level: "warning", message: "no category in view-categories.json" });
    else for (const k of c) if (!(k in CATEGORY_LABELS)) problems.push({ path: v.name, level: "error", message: `unknown category "${k}" in view-categories.json (use ${Object.keys(CATEGORY_LABELS).join(", ")})` });
  }
}
for (const p of problems.filter((p) => p.level === "error")) console.error(`error   ${p.path}: ${p.message}`);
const warnings = problems.filter((p) => p.level === "warning");
if (warnings.length) console.log(`${warnings.length} warnings (run with --warnings to list them)`);
if (args.includes("--warnings")) for (const p of warnings) console.log(`warning ${p.path}: ${p.message}`);
if (problems.some((p) => p.level === "error")) process.exit(1);

if (sync.added.length) console.log(`views.json: adding ${sync.added.join(", ")}`);
if (sync.removed.length) console.log(`views.json: removing ${sync.removed.join(", ")} (folder gone)`);
if (args.includes("--check")) {
  if (fresh !== current) { console.error("views.json is out of date: run npm run build and commit it"); process.exit(1); }
  console.log("views.json is up to date");
  process.exit(0);
}
if (fresh !== current) { writeFileSync(file, fresh); console.log("views.json regenerated"); }
else console.log("views.json unchanged");

if (!args.includes("--no-site")) {
  const r = buildSite(CONFIG, loadItems(root), root, join(root, "_site"), SITE_URL);
  console.log(`gallery: ${r.pages} pages, ${r.files} files copied, in ${r.outDir}`);
}
