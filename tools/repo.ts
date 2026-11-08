// The views repository's side of the shared tools: its configuration and how a view becomes a gallery item.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { viewDirs, readJson } from "./lib/items.ts";
import { readCases, demoCases, caseDataset, demoFigure, libraries } from "./lib/live-demo.ts";
import { type Item, type ItemOption, type RepoConfig, AI_BUILT_TAG } from "./site/model.ts";

/** View folders deliberately left out of views.json (not offered in the app's view picker). */
export const UNLISTED: string[] = [];

const FIELD_TYPES = new Set(["FIELD", "MEASURE", "GROUPING"]);

/** The view picker's tabs, as gallery categories: key in view-categories.json -> label. */
export const CATEGORY_LABELS: Record<string, string> = {
  bar: "Bar", "line/scatter": "Line and scatter", diagram: "Diagram", map: "Map", network: "Network", table: "Table", tool: "Tool",
};

/** view-categories.json at the repository root: each view's one or two picker tabs. */
export function viewCategories(root: string): Record<string, string[]> {
  const f = join(root, "view-categories.json");
  return existsSync(f) ? readJson(f) : {};
}

const datasetsByPage = new Map<string, Record<string, unknown>>();

export const CONFIG: RepoConfig = {
  kind: "views",
  title: "Omniscope Custom Views",
  intro: "Charts and interactive views for Omniscope reports, built with the custom view API. Most pages run the view live on sample data.",
  githubRepo: "visokio/omniscope-custom-views",
  branch: process.env.GALLERY_BRANCH || "master",
  demoServerBase: process.env.DEMO_SERVER_BASE ?? "https://public.omniscope.me/Community/Views",
  demoProject: "demo.iox",
  noun: ["view", "views"],
  otherGallery: {
    title: "Omniscope Custom Blocks", url: process.env.OTHER_GALLERY_URL ?? "https://visokio.github.io/omniscope-custom-blocks/", noun: ["block", "blocks"],
  },
  categoryOrder: Object.values(CATEGORY_LABELS),
  renderLive(item, root, index) {
    const dir = join(root, item.path);
    const demos = demoCases(readCases(dir));
    const c = demos[index] ?? demos[0];
    if (!c) return null;
    const { ref, dataset } = caseDataset(dir, c);
    const sets = datasetsByPage.get(item.path) ?? {};
    sets[ref] = dataset;
    datasetsByPage.set(item.path, sets);
    return demoFigure(dir, item.path, readJson(join(dir, "manifest.json")), c, ref);
  },
  renderLead(item, root) {
    // A view with tests but no showcase still gets one live demo at the top.
    if (item.showcase) return "";
    return this.renderLive!(item, root, 0) ?? "";
  },
  pageData(item) {
    // Called after the page body is rendered, so every demo's dataset is known.
    const sets = datasetsByPage.get(item.path) ?? {};
    return `<script>window.__DEMO_DATASETS__=${JSON.stringify(sets).replace(/</g, "\\u003c")};</script>`;
  },
};

export const SITE_URL = process.env.SITE_URL ?? "https://visokio.github.io/omniscope-custom-views/";

export function loadItems(root: string, unlisted = UNLISTED): Item[] {
  const items: Item[] = [];
  const cats = viewCategories(root);
  for (const name of viewDirs(root)) {
    if (unlisted.includes(name)) continue;
    const m = readJson(join(root, name, "manifest.json"));
    const opts = Object.entries<any>(m.options?.items ?? {});
    const toOpt = ([k, o]: [string, any]): ItemOption => ({ name: k, title: o.displayName ?? k, type: String(o.type ?? ""), description: o.detail ?? o.description ?? undefined });
    const files = readdirSync(join(root, name));
    const sample = existsSync(join(root, name, "sample-data"))
      ? readdirSync(join(root, name, "sample-data")).filter((f) => /\.(csv|tsv|json)$/i.test(f)).sort().map((f) => "sample-data/" + f)
      : [];
    const tags: string[] = Array.isArray(m.tags) ? m.tags : [];
    items.push({
      path: name,
      name: m.name ?? name,
      category: CATEGORY_LABELS[cats[name]?.[0]] ?? "Other",
      categories: (cats[name] ?? []).map((c) => CATEGORY_LABELS[c] ?? c).concat(cats[name]?.length ? [] : ["Other"]),
      icon: typeof m.icon === "string" && files.includes(m.icon) ? { file: m.icon } : undefined,
      subcategory: null,
      description: m.description ?? firstParagraph(root, name) ?? "",
      tags,
      aiBuilt: tags.includes(AI_BUILT_TAG),
      inputs: opts.filter(([, o]) => FIELD_TYPES.has(o?.type)).map(toOpt),
      options: opts.filter(([, o]) => !FIELD_TYPES.has(o?.type)).map(toOpt),
      outputs: [],
      thumbnail: files.includes("thumbnail.png") ? "thumbnail.png" : undefined,
      showcase: existsSync(join(root, name, "showcase", "showcase.md")) ? "showcase/showcase.md" : undefined,
      readme: files.includes("README.md") ? "README.md" : undefined,
      sampleData: sample,
      hasDemo: files.includes("demo.ioz"),
      libraries: libraries(join(root, name)),
    });
  }
  return items;
}

/** View manifests have no description: use the showcase's lead line, else the README's first paragraph. */
function firstParagraph(root: string, name: string): string | null {
  for (const f of [join(root, name, "showcase", "showcase.md"), join(root, name, "README.md")]) {
    if (!existsSync(f)) continue;
    const para = readFileSync(f, "utf8").split(/\n\s*\n/).map((p) => p.trim())
      .find((p) => p && !/^[#!<|*-]/.test(p));
    if (para) return shorten(para.replace(/\s+/g, " ").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_`]/g, ""));
  }
  return null;
}

/** At most about 240 characters, cut at the end of a sentence where possible. */
export function shorten(text: string, max = 240): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  if (end > 60) return cut.slice(0, end + 1);
  return cut.slice(0, cut.lastIndexOf(" ")) + "…";
}
