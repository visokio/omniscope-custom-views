import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { parseRelated, relatedSection, relatedForCatalogue } from "../site/related.ts";
import { esc } from "../site/build-site.ts";
import { CONFIG, loadItems } from "../repo.ts";
import { repoRoot } from "../lib/items.ts";

const FIX = repoRoot();
const items = loadItems(FIX);
const byPath = new Map(items.map((i) => [i.path, i]));
const [a, b] = items.map((i) => i.path);

test("related.json: a valid file parses with no problems", () => {
  const raw = { items: {
    [a]: { overlaps: [{ view: b, note: "Same job; this one streams." }, { coreView: "Bar", note: "Pass or fail only." }],
      seeAlso: [{ block: "Analytics/Clustering", name: "Clustering", note: "Shows the output." }] },
    [b]: { overlaps: [{ view: a, note: "Same job; this one doesn't stream." }] },
  } };
  const { map, problems } = parseRelated(CONFIG, raw, items);
  assert.deepEqual(problems, []);
  assert.equal(map.get(a)!.overlaps.length, 2);
});

test("related.json: unknown items, missing notes and names, one-way links are problems", () => {
  const raw = { items: {
    "No/Such-Block": { seeAlso: [{ coreBlock: "Sort", note: "x" }] },
    [a]: { overlaps: [{ view: b, note: "x" }], seeAlso: [{ view: "No/Such", note: "x" }, { block: "Analytics/Clustering", note: "x" },
      { coreView: "Bar", block: b, note: "x" }, { coreBlock: "Sort", note: "" }], extra: 1 },
    [b]: { seeAlso: [{ view: a, note: "x" }] },
  } };
  const msgs = parseRelated(CONFIG, raw, items).problems.map((p) => p.message).join("\n");
  assert.match(msgs, /is not a view in this repository/);
  assert.match(msgs, /No\/Such is not a view/);
  assert.match(msgs, /Analytics\/Clustering: a ref to the other repository needs its name/);
  assert.match(msgs, /needs exactly one of/);
  assert.match(msgs, /Sort: needs a note/);
  assert.match(msgs, /unknown key "extra"/);
  assert.match(msgs, /doesn't list it back under overlaps/);
});

test("related section links community items and names core ones", () => {
  const raw = { items: {
    [a]: { overlaps: [{ coreView: "Bar", note: "Pass <or> fail." }], seeAlso: [{ view: b, note: "n" }, { block: "Analytics/Clustering", name: "Clustering", note: "v" }] },
    [b]: { seeAlso: [{ view: a, note: "n" }] },
  } };
  const { map } = parseRelated(CONFIG, raw, items);
  const html = relatedSection(CONFIG, byPath.get(a)!, map.get(a), byPath, "../../", esc);
  assert.match(html, /<h2>Related<\/h2>/);
  assert.match(html, /<b>Bar<\/b> <span class="kind">core view<\/span><br>Pass &lt;or&gt; fail\./);
  assert.ok(html.includes(`href="../../${b.split("/").map(encodeURIComponent).join("/")}/index.html"`));
  assert.ok(html.includes(`href="${CONFIG.otherGallery.url}Analytics/Clustering/index.html">Clustering</a>`));
  assert.equal(relatedSection(CONFIG, byPath.get(a)!, undefined, byPath, "", esc), "");
  const only = parseRelated(CONFIG, { items: { [a]: { summary: "Use the core **Sort** <first>." } } }, items).map.get(a);
  assert.match(relatedSection(CONFIG, byPath.get(a)!, only, byPath, "", esc), /<h2>Related<\/h2><p>Use the core <b>Sort<\/b> &lt;first&gt;\.<\/p><\/section>/);
  const cat = relatedForCatalogue(CONFIG, map.get(a), byPath, "https://g/");
  assert.deepEqual(cat.map((r) => [r.relation, r.kind, r.id]), [["overlaps", "coreView", null], ["seeAlso", "view", b], ["seeAlso", "block", "Analytics/Clustering"]]);
  assert.equal(cat[1].page?.startsWith("https://g/"), true);
});
