// npm run test:views: every view's harness tests (tests/cases.json) in headless Chromium.
//   npm run test:views -- waffle kpi      only these views
//   TEST_VIEWS_JOBS=1 npm run test:views  one view at a time (default 4)
// Needs Chrome or Chromium (CHROMIUM_PATH, or a system install).
import { existsSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { repoRoot, viewDirs } from "./lib/items.ts";

const require = createRequire(import.meta.url);
const { run } = require("./harness/run-test.js") as { run: (dir: string, o?: object) => Promise<{ cases: { name: string; ok: boolean }[] }> };

const root = repoRoot();
const only = process.argv.slice(2);
const views = viewDirs(root).filter((v) => existsSync(join(root, v, "tests", "cases.json")) && (!only.length || only.includes(v)));
// Several views at once (each in its own browser): the cases wait for animations, so one at a time takes 45 minutes.
const jobs = Math.max(1, Number(process.env.TEST_VIEWS_JOBS) || 4);
let failed = 0, cases = 0, next = 0;
async function worker() {
  while (next < views.length) {
    const v = views[next++];
    const r = await run(join(root, v));
    cases += r.cases.length;
    failed += r.cases.filter((c) => !c.ok).length;
  }
}
await Promise.all(Array.from({ length: jobs }, worker));
console.log(`${views.length} views, ${cases} cases, ${failed} failed`);
process.exit(failed ? 1 : 0);
