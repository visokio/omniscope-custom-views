// Finding the views in the repository: top-level folders with a manifest.json.
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const SKIP_DIRS = new Set([".git", ".github", "node_modules", "tools", "_site", "_bundle"]);

export function repoRoot(): string {
  return fileURLToPath(new URL("../..", import.meta.url)).replace(/[\\/]$/, "");
}

/** Names of the top-level folders holding a manifest.json, sorted. */
export function viewDirs(root: string): string[] {
  return readdirSync(root)
    .filter((n) => !SKIP_DIRS.has(n) && !n.startsWith(".") && statSync(join(root, n)).isDirectory() && existsSync(join(root, n, "manifest.json")))
    .sort(cmp);
}

export function cmp(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function readJson<T = any>(file: string): T {
  const text = readFileSync(file, "utf8");
  try {
    return JSON.parse(text.replace(/^﻿/, ""));
  } catch (e) {
    throw new Error(`JSON error in ${file}: ${(e as Error).message}`);
  }
}
