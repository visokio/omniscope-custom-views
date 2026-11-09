// The gallery's view of an item, the same in both community repositories.
// Each repository's tools/repo.ts turns its manifests into these.

export interface ItemOption {
  name: string;
  title: string;
  type: string;
  description?: string;
}

export interface ItemOutput {
  id: string;
  label: string;
  description?: string;
}

export interface Item {
  /** Folder path in the repository, with "/" separators. Also the page's path in the gallery. */
  path: string;
  name: string;
  category: string;
  subcategory?: string | null;
  description: string;
  tags: string[];
  aiBuilt: boolean;
  /** Blocks: PYTHON or R. */
  language?: string;
  /** Field options: what the item reads from its data. */
  inputs: ItemOption[];
  options: ItemOption[];
  outputs: ItemOutput[];
  /** Gallery filter categories (labels). Blocks: their one category; views: one or two picker tabs. */
  categories: string[];
  /** The item's icon: a file in the item folder (views) or the manifest's data URI (blocks). */
  icon?: { file: string } | { dataUri: string };
  /** File names relative to the item folder. */
  thumbnail?: string;
  showcase?: string;
  readme?: string;
  sampleData: string[];
  hasDemo: boolean;
  /** Third-party libraries, for views (name and version). */
  libraries: string[];
  /** Anything repository-specific the page renderer needs. */
  extra?: Record<string, unknown>;
}

export interface RepoConfig {
  /** "blocks" or "views". */
  kind: "blocks" | "views";
  title: string;
  /** One sentence for the gallery's index page. */
  intro: string;
  githubRepo: string;
  branch: string;
  /** Base URL of the item's folder on the public demo server, without a trailing slash. */
  demoServerBase: string;
  /** Name of the demo project once unpacked on the demo server. */
  demoProject: string;
  /** Blocks: the tile colour the app draws behind a block's icon, per category. Views: none (white). */
  tileColours?: Record<string, string>;
  /** Category labels in the order the filter chips show them. */
  categoryOrder?: string[];
  /** Labels for the noun, singular and plural. */
  noun: [string, string];
  /** Extra HTML at the top of an item page (views: the live demo), from the repository adapter. */
  renderLead?: (item: Item, root: string) => string;
  /** Replaces images whose alt text starts with "live" (views: live demos). */
  renderLive?: (item: Item, root: string, index: number) => string | null;
  /** Inline <script> data the page needs once (views: the demo datasets). */
  pageData?: (item: Item) => string;
  /** The other community repository's gallery, for links between the two (blocks link to views and back). */
  otherGallery: { title: string; url: string; noun: [string, string] };
}

export const AI_BUILT_TAG = "visokio-agents";
export const EXPLORER_URL = "https://public.omniscope.me/Community/Blocks+and+Views+Explorer.iox/r/Report/";

/** The agreed statement about items built by Visokio's agents, shown in each README and the gallery. */
export const AI_BUILT_STATEMENT = {
  short: "A community example built by Visokio's agents, tested by automated tests.",
  html:
    "Items tagged <b>visokio-agents</b> are community examples built by Visokio's agents, to extend Omniscope's core blocks and views with popular, specialist and more unusual use cases, and to show what anyone, people or agents, can build on Omniscope. They are tested by automated tests and were run on a real Omniscope server. They were not reviewed by Omniscope's core team, so they are not on a par with the core blocks and views, which have years of manual, functional and unit tests behind them.",
};

export function encodePath(p: string): string {
  return p.split("/").map(encodeURIComponent).join("/");
}

export function githubTree(cfg: RepoConfig, path: string): string {
  return `https://github.com/${cfg.githubRepo}/tree/${cfg.branch}/${encodePath(path)}`;
}

export function githubBlob(cfg: RepoConfig, path: string): string {
  return `https://github.com/${cfg.githubRepo}/blob/${cfg.branch}/${encodePath(path)}`;
}

export function githubRaw(cfg: RepoConfig, path: string): string {
  return `https://github.com/${cfg.githubRepo}/raw/${cfg.branch}/${encodePath(path)}`;
}

/** The item's demo project on the public demo server, derived from its repository path. */
export function demoServerUrl(cfg: RepoConfig, path: string): string {
  return `${cfg.demoServerBase}/${encodePath(path)}/${encodeURIComponent(cfg.demoProject)}/`;
}
