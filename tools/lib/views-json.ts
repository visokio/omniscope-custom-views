// views.json: the list of views Omniscope's view picker offers from this repository.
// Its entries are curated (display names, tags, extra files and a version that makes the app refetch),
// so they are kept as they are. The build adds an entry for every view folder not yet listed, removes
// entries whose folder has gone, and writes the file in one consistent format.
// The one thing it does change in an entry is its picker-tab tags: the app files a view under a tab of the
// view picker when one of its tags here is that tab's name, so those tags follow view-categories.json.
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { viewDirs, readJson } from "./items.ts";

export interface ViewEntry {
  name: string;
  displayName: string;
  tags: string[];
  files: string[];
  version: number;
  [key: string]: unknown;
}

/** Files in a view folder that are not "extra files" for the app to fetch. */
const STANDARD = new Set(["manifest.json", "index.html", "icon.svg", "README.md", "demo.ioz", "test.ioz", "package.json"]);

export function extraFiles(root: string, name: string): string[] {
  return readdirSync(join(root, name))
    .filter((f) => !STANDARD.has(f) && !/^thumbnail.*\.png$/.test(f) && statSync(join(root, name, f)).isFile())
    .sort();
}

export function newEntry(root: string, name: string): ViewEntry {
  const m = readJson(join(root, name, "manifest.json"));
  return { name, displayName: m.name ?? name, tags: Array.isArray(m.tags) ? m.tags : [], files: extraFiles(root, name), version: 0 };
}

export interface SyncResult { views: ViewEntry[]; added: string[]; removed: string[] }

/** The view picker's tabs, as the tag the app matches (also the keys of view-categories.json). */
export const PICKER_TABS = ["bar", "line/scatter", "diagram", "map", "network", "table", "tool"];

/**
 * An entry's tags with its picker-tab tags set to exactly its tabs: tab names it isn't in are dropped
 * (matched without regard to case), missing ones are added at the end, and every other tag is kept in order.
 */
export function withTabTags(tags: string[], tabs: string[]): string[] {
  const keep = tags.filter((t) => !PICKER_TABS.includes(t.toLowerCase()) || tabs.includes(t.toLowerCase()));
  const have = new Set(keep.map((t) => t.toLowerCase()));
  return keep.concat(tabs.filter((t) => !have.has(t)));
}

/**
 * unlisted: view folders deliberately left out of the picker.
 * categories: view-categories.json; when given, each listed view's picker-tab tags follow it (views it
 * doesn't mention keep their tags as they are).
 */
export function syncViews(root: string, unlisted: string[] = [], categories?: Record<string, string[]>): SyncResult {
  const file = join(root, "views.json");
  const current: ViewEntry[] = existsSync(file) ? readJson<{ views: ViewEntry[] }>(file).views : [];
  const dirs = new Set(viewDirs(root));
  const removed = current.filter((v) => !dirs.has(v.name)).map((v) => v.name);
  const views = current.filter((v) => dirs.has(v.name));
  const listed = new Set(views.map((v) => v.name));
  const added: string[] = [];
  for (const d of dirs) {
    if (listed.has(d) || unlisted.includes(d)) continue;
    views.push(newEntry(root, d));
    added.push(d);
  }
  if (categories) for (const v of views) if (categories[v.name]?.length) v.tags = withTabTags(v.tags, categories[v.name]);
  return { views, added, removed };
}

export function viewsText(views: ViewEntry[]): string {
  return JSON.stringify({ views }, null, "\t") + "\n";
}
