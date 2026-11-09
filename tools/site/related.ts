// related.json: for each item, the core and community blocks and views a user should know about, and, where two
// do a similar job, which to use when. Shared by both community repositories (this file is the same in each).
//
//   { "items": { "<item path>": { "summary": "...", "overlaps": [Ref], "seeAlso": [Ref] } } }
//   summary: a short paragraph on how the item fits with its neighbours (**bold** allowed).
//   Ref: exactly one of coreBlock / coreView (the picker's name), block / view (a community item's path), and a note.
//   A ref to the other community repository also carries its name (this repository can't read the other's manifests).
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { type Item, type RepoConfig, encodePath } from "./model.ts";

export type RefKind = "coreBlock" | "coreView" | "block" | "view";
export interface Ref { kind: RefKind; target: string; name?: string; note: string }
export interface Related { summary?: string; overlaps: Ref[]; seeAlso: Ref[] }
export type RelatedMap = Map<string, Related>;
export interface RelatedProblem { path: string; message: string }

const KINDS: RefKind[] = ["coreBlock", "coreView", "block", "view"];
export const RELATED_FILE = "related.json";

/** The community kind this repository holds ("block" in the blocks repository), and the other one. */
function ownKind(cfg: RepoConfig): RefKind { return cfg.kind === "blocks" ? "block" : "view"; }
function otherKind(cfg: RepoConfig): RefKind { return cfg.kind === "blocks" ? "view" : "block"; }

export function readRelated(root: string): unknown {
  const f = join(root, RELATED_FILE);
  return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : { items: {} };
}

/**
 * Checks related.json against the repository's items and returns the parsed map. Every key and every ref to this
 * repository must be an item, each ref has one kind and a note, refs to the other repository carry a name, and a
 * link between two items here is listed on both items (in the same list when it's an overlap).
 */
export function parseRelated(cfg: RepoConfig, raw: unknown, items: Item[]): { map: RelatedMap; problems: RelatedProblem[] } {
  const problems: RelatedProblem[] = [];
  const map: RelatedMap = new Map();
  const paths = new Set(items.map((i) => i.path));
  const bad = (path: string, message: string) => problems.push({ path: `${RELATED_FILE}: ${path}`, message });
  const entries = (raw as any)?.items;
  if (!entries || typeof entries !== "object") return { map, problems: [{ path: RELATED_FILE, message: 'needs an "items" object' }] };
  for (const [key, val] of Object.entries<any>(entries)) {
    if (!paths.has(key)) { bad(key, `is not a ${cfg.noun[0]} in this repository`); continue; }
    const rel: Related = { overlaps: [], seeAlso: [] };
    for (const list of ["overlaps", "seeAlso"] as const) {
      for (const r of Array.isArray(val?.[list]) ? val[list] : []) {
        const kinds = KINDS.filter((k) => typeof r?.[k] === "string" && r[k]);
        if (kinds.length !== 1) { bad(key, `a ${list} entry needs exactly one of ${KINDS.join(", ")}`); continue; }
        const kind = kinds[0], target = r[kind] as string;
        if (typeof r.note !== "string" || !r.note.trim()) bad(key, `${target}: needs a note`);
        if (kind === ownKind(cfg) && !paths.has(target)) bad(key, `${target} is not a ${cfg.noun[0]} in this repository`);
        if (kind === ownKind(cfg) && target === key) bad(key, "lists itself");
        if (kind === otherKind(cfg) && (typeof r.name !== "string" || !r.name)) bad(key, `${target}: a ref to the other repository needs its name`);
        rel[list].push({ kind, target, name: r.name, note: String(r.note ?? "") });
      }
    }
    if (val?.summary !== undefined) rel.summary = String(val.summary);
    for (const k of Object.keys(val ?? {})) if (!["summary", "overlaps", "seeAlso"].includes(k)) bad(key, `unknown key "${k}"`);
    map.set(key, rel);
  }
  // Links between two items here go both ways, so either page leads to the other.
  for (const [key, rel] of map) {
    for (const list of ["overlaps", "seeAlso"] as const) {
      for (const r of rel[list]) {
        if (r.kind !== ownKind(cfg) || !paths.has(r.target)) continue;
        const back = map.get(r.target);
        const has = (l: Ref[] | undefined) => !!l?.some((x) => x.kind === r.kind && x.target === key);
        if (list === "overlaps" ? !has(back?.overlaps) : !has(back?.overlaps) && !has(back?.seeAlso))
          bad(key, `lists ${r.target} under ${list}, but ${r.target} doesn't list it back${list === "overlaps" ? " under overlaps" : ""}`);
      }
    }
  }
  return { map, problems };
}

const KIND_LABEL: Record<RefKind, string> = {
  coreBlock: "core block", coreView: "core view", block: "community block", view: "community view",
};

/** Where a ref's page is: an item here (relative), an item in the other gallery, or nowhere (core items). */
function refHref(cfg: RepoConfig, r: Ref, rootRel: string): string | null {
  if (r.kind === ownKind(cfg)) return `${rootRel}${encodePath(r.target)}/index.html`;
  if (r.kind === otherKind(cfg)) return `${cfg.otherGallery.url}${encodePath(r.target)}/index.html`;
  return null;
}

function refName(r: Ref, items: Map<string, Item>): string {
  return r.name ?? items.get(r.target)?.name ?? r.target;
}

/** The Related section of an item page, or "" when the item has none. `esc` is the page's HTML escaper. */
export function relatedSection(cfg: RepoConfig, item: Item, rel: Related | undefined, items: Map<string, Item>,
  rootRel: string, esc: (s: unknown) => string): string {
  if (!rel || (!rel.summary && !rel.overlaps.length && !rel.seeAlso.length)) return "";
  const li = (r: Ref) => {
    const href = refHref(cfg, r, rootRel);
    const name = esc(refName(r, items));
    const label = href ? `<a href="${esc(href)}">${name}</a>` : `<b>${name}</b>`;
    return `<li>${label} <span class="kind">${KIND_LABEL[r.kind]}</span><br>${esc(r.note)}</li>`;
  };
  const list = (title: string, intro: string, refs: Ref[]) => refs.length
    ? `<h3>${title}</h3><p class="intro">${intro}</p><ul class="related">${refs.map(li).join("")}</ul>` : "";
  const summary = rel.summary ? `<p>${esc(rel.summary).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")}</p>` : "";
  return `<section class="reference related"><h2>Related</h2>${summary}` +
    list("Does a similar job", `What each does differently, and when to use which.`, rel.overlaps) +
    list("See also", `Worth knowing about alongside this ${cfg.noun[0]}.`, rel.seeAlso) +
    `</section>`;
}

/** related entries for catalogue.json: absolute links, so an agent can follow them. */
export function relatedForCatalogue(cfg: RepoConfig, rel: Related | undefined, items: Map<string, Item>, siteUrl: string) {
  if (!rel) return [];
  return (["overlaps", "seeAlso"] as const).flatMap((list) => rel[list].map((r) => ({
    relation: list,
    kind: r.kind,
    id: r.kind === "coreBlock" || r.kind === "coreView" ? null : r.target,
    name: refName(r, items),
    page: r.kind === ownKind(cfg) ? `${siteUrl}${encodePath(r.target)}/index.html` : refHref(cfg, r, ""),
    note: r.note,
  })));
}
