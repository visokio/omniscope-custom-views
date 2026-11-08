// Live demos for the gallery: a view running in an <iframe srcdoc> on the harness's stand-in for
// Omniscope, with its sample data. Pages work from any static host; the libraries a view loads from
// a CDN are still loaded from that CDN, exactly as in Omniscope.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const HARNESS = join(import.meta.dirname, "..", "harness");
const { toDataset } = require(join(HARNESS, "dataset.js")) as { toDataset: (csv: string, types?: unknown) => Dataset };

export interface Dataset { fields: { name: string; type: string }[]; rows: unknown[][] }
export interface TestCase {
  name: string; showcase?: boolean; data?: string; types?: Record<string, string>; generate?: string; generateArgs?: unknown;
  fields?: Dataset["fields"]; options?: { items: Record<string, unknown> }; showcaseHeight?: number; caption?: string;
  variables?: Record<string, unknown>; baseUrl?: string; workflow?: unknown;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function readCases(viewDir: string): TestCase[] {
  const f = join(viewDir, "tests", "cases.json");
  return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : [];
}

/** The cases shown as live demos: those marked "showcase", else the one named showcase, else the first. */
export function demoCases(cases: TestCase[]): TestCase[] {
  const marked = cases.filter((c) => c.showcase);
  if (marked.length) return marked;
  const c = cases.find((x) => x.name === "showcase") ?? cases[0];
  return c ? [c] : [];
}

export function caseDataset(viewDir: string, c: TestCase): { ref: string; dataset: Dataset } {
  if (c.data) return { ref: c.data, dataset: toDataset(readFileSync(join(viewDir, c.data), "utf8"), c.types) };
  if (c.generate) return { ref: c.generate, dataset: require(join(viewDir, c.generate))(c.generateArgs ?? {}) };
  return { ref: "inline:" + c.name, dataset: { fields: c.fields ?? [], rows: [] } };
}

/** The view's index.html with the mock omniscope.js and its own relative scripts and styles inlined. */
export function inlineView(viewDir: string, config: unknown): string {
  let html = readFileSync(join(viewDir, "index.html"), "utf8");
  const mock = readFileSync(join(HARNESS, "omniscope-mock.js"), "utf8");
  const cfg = "<script>window.__OMNI_MOCK_CONFIG__=" + JSON.stringify(config).replace(/</g, "\\u003c") + ";</script>";
  html = html.replace(/<script[^>]*src=["']\/_global_\/customview\/v1\/omniscope\.js["'][^>]*><\/script>/,
    () => cfg + "<script>" + mock.replace(/<\/script/g, "<\\/script") + "</script>");
  html = html.replace(/<script([^>]*)src=["'](?!https?:|\/\/|\/)([^"']+)["']([^>]*)><\/script>/g, (m, a, src, b) => {
    const f = join(viewDir, src);
    return existsSync(f) ? "<script" + a + b + ">" + readFileSync(f, "utf8").replace(/<\/script/g, "<\\/script") + "</script>" : m;
  });
  html = html.replace(/<link([^>]*)href=["'](?!https?:|\/\/|\/)([^"']+\.css)["']([^>]*)>/g, (m, _a, href) => {
    const f = join(viewDir, href);
    return existsSync(f) ? "<style>" + readFileSync(f, "utf8") + "</style>" : m;
  });
  return html;
}

/** One live demo figure. The dataset is embedded once per page (window.__DEMO_DATASETS__) and referenced by ref. */
export function demoFigure(viewDir: string, viewId: string, manifest: any, c: TestCase, ref: string): string {
  const config = { viewId, viewName: manifest.name, manifest, options: c.options ?? { items: {} }, datasetRef: ref,
    variables: c.variables, baseUrl: c.baseUrl, workflow: c.workflow };
  const srcdoc = inlineView(viewDir, config);
  const h = c.showcaseHeight ?? 560;
  return `<figure class="live"><div class="frame"><iframe title="${esc(String(manifest.name))} live demo" style="height:${h}px" data-srcdoc="${esc(srcdoc).replace(/\n/g, "&#10;")}"></iframe></div>` +
    `<figcaption><button class="replay" type="button" title="Reload this demo to see its entrance again">\u21bb Replay</button>${esc(c.caption ?? "Live: the view running on sample data in a local stand-in for Omniscope. Interact with it.")}</figcaption></figure>`;
}

/** Third-party libraries a view loads from a CDN, as "name version". */
export function libraries(viewDir: string): string[] {
  const html = readFileSync(join(viewDir, "index.html"), "utf8");
  const out = new Set<string>();
  for (const m of html.matchAll(/(?:src|href)=["'](https?:\/\/[^"']+)["']/g)) {
    const url = m[1];
    let r = /\/npm\/(@?[^@/]+(?:\/[^@/]+)?)@([\d.]+)/.exec(url) ?? /unpkg\.com\/(@?[^@/]+)@([\d.]+)/.exec(url);
    if (r) { out.add(`${r[1]} ${r[2]}`); continue; }
    r = /d3js\.org\/d3\.v(\d+)/.exec(url);
    if (r) { out.add(`d3 ${r[1]}`); continue; }
    r = /ajax\/libs\/([^/]+)\/([\d.]+)\//.exec(url) ?? /bootstrapcdn\.com\/([^/]+)\/([\d.]+)\//.exec(url);
    if (r) { out.add(`${r[1]} ${r[2]}`); continue; }
    if (/fonts\.googleapis/.test(url)) continue;
    out.add(new URL(url).host + new URL(url).pathname);
  }
  // Libraries shipped in the view's folder, such as d3.v4.min.js.
  for (const m of html.matchAll(/<script[^>]*src=["'](?!https?:|\/\/|\/)([^"']+)["']/g)) {
    const r = /^(?:.*\/)?([a-z][\w-]*?)\.v(\d+)(?:\.min)?\.js$/i.exec(m[1]);
    if (r) out.add(`${r[1]} ${r[2]} (in the view's folder)`);
  }
  return [...out];
}
