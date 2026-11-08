// Manifest checks for views. Errors fail the build; warnings are reported (older views predate some rules).
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { viewDirs, readJson } from "./items.ts";

export interface Problem { path: string; level: "error" | "warning"; message: string }

const FILE_SET = ["manifest.json", "index.html", "icon.svg", "thumbnail.png", "README.md", "sample-data", "showcase", "tests", "demo.ioz"];
// Option types from the custom view schema (tools/harness/schema/customview-schema.json).
const OPTION_TYPES = new Set(["GROUPING", "MEASURE", "CHOICE", "TOGGLE", "ACTION", "TEXT", "FIELD", "COLOUR", "NUMBER", "DATE", "STYLE", "FILE_REFERENCE", "EMBEDDED_VIEW_OPTIONS"]);

export function validateView(root: string, name: string, m: any): Problem[] {
  const out: Problem[] = [];
  const err = (message: string) => out.push({ path: name, level: "error", message });
  const warn = (message: string) => out.push({ path: name, level: "warning", message });
  if (!m.name) err('missing "name"');
  if (!existsSync(join(root, name, "index.html"))) err("index.html not found");
  for (const k of ["icon", "thumbnail"]) if (m[k] && !existsSync(join(root, name, m[k]))) err(`${k} ${m[k]} not found`);
  if (m.tags !== undefined && (!Array.isArray(m.tags) || m.tags.some((t: unknown) => typeof t !== "string"))) err("tags must be a list of text");
  const items = m.options?.items ?? {};
  for (const [k, o] of Object.entries<any>(items)) {
    if (!o || typeof o !== "object") { err(`option "${k}" is not an object`); continue; }
    if (!o.displayName) warn(`option "${k}" has no displayName`);
    if (o.type && !OPTION_TYPES.has(o.type)) warn(`option "${k}" has an unusual type ${o.type}`);
  }
  for (const g of m.options?.optionGroups ?? []) for (const r of g.rows ?? []) for (const c of r.cells ?? [])
    if (c.option && !(c.option in items)) err(`option group "${g.displayName}" refers to unknown option "${c.option}"`);
  if (Array.isArray(m.tags) && m.tags.includes("visokio-agents")) {
    const files = readdirSync(join(root, name));
    for (const f of FILE_SET) if (!files.includes(f)) err(`visokio-agents view is missing ${f}`);
    if (files.includes("tests") && !existsSync(join(root, name, "tests", "cases.json"))) err("visokio-agents view has no tests/cases.json");
  }
  return out;
}

export function validateRepo(root: string): Problem[] {
  const out: Problem[] = [];
  for (const name of viewDirs(root)) {
    let m: any;
    try { m = readJson(join(root, name, "manifest.json")); } catch (e) { out.push({ path: name, level: "error", message: (e as Error).message }); continue; }
    out.push(...validateView(root, name, m));
  }
  return out;
}
