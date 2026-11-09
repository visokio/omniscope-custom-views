import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { validateView, validateRepo } from "../lib/validate.ts";
import { repoRoot } from "../lib/items.ts";

test("every view manifest in the repository passes (errors only)", () => {
  assert.deepEqual(validateRepo(repoRoot()).filter((p) => p.level === "error"), []);
});

test("unknown options in groups, missing files and the visokio-agents file set are errors", () => {
  const root = mkdtempSync(join(tmpdir(), "vv-"));
  mkdirSync(join(root, "v"));
  const probs = validateView(root, "v", {
    name: "V", icon: "icon.svg", tags: ["visokio-agents"],
    options: { items: { a: { displayName: "A", type: "FIELD" } }, optionGroups: [{ displayName: "G", rows: [{ cells: [{ option: "b" }] }] }] },
  });
  const msgs = probs.filter((p) => p.level === "error").map((p) => p.message);
  assert.ok(msgs.includes("index.html not found"));
  assert.ok(msgs.includes("icon icon.svg not found"));
  assert.ok(msgs.some((m) => /unknown option "b"/.test(m)));
  assert.ok(msgs.some((m) => /missing showcase/.test(m)));
});
