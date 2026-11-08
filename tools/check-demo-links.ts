// npm run check:demo-links: is every item's demo project on the public demo server?
// Lists the missing ones and exits 1 if there are any. Changes nothing.
import { repoRoot } from "./lib/items.ts";
import { CONFIG, loadItems } from "./repo.ts";
import { demoServerUrl } from "./site/model.ts";

const items = loadItems(repoRoot()).filter((i) => i.hasDemo);
const missing: string[] = [];
for (const item of items) {
  const url = demoServerUrl(CONFIG, item.path);
  let status = 0;
  try {
    status = (await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(30000) })).status;
  } catch (e) {
    status = -1;
  }
  if (status !== 200) missing.push(`${item.path}  (${status === -1 ? "no answer" : `HTTP ${status}`})  ${url}`);
}
console.log(`${items.length - missing.length} of ${items.length} demo projects found on ${CONFIG.demoServerBase}`);
for (const m of missing) console.log(`missing: ${m}`);
process.exit(missing.length ? 1 : 0);
