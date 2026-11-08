// npm run bundle:demo-server [-- --out <dir>]: the upload tree for the public demo server, and a zip of it.
// The tree mirrors the repository: <server folder>/<item path>/demo.ioz for every item that has a demo,
// plus a README.md in each item folder and each parent folder (Omniscope shows a folder's README, as GitHub
// does). Each README links back to the item's gallery page, where the sample data and source live.
// Upload with npm run publish:demo-server, which also unpacks each demo.ioz into demo.iox on the server.
import { mkdirSync, rmSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { join, posix } from "node:path";
import { execFileSync } from "node:child_process";
import { repoRoot } from "./lib/items.ts";
import { CONFIG, SITE_URL, loadItems } from "./repo.ts";
import { type Item, AI_BUILT_STATEMENT, encodePath, githubTree } from "./site/model.ts";
import { pathToFileURL } from "node:url";

const plain = AI_BUILT_STATEMENT.html.replace(/<[^>]+>/g, "");

export function itemReadme(item: Item): string {
  const page = `${SITE_URL}${encodePath(item.path)}/index.html`;
  return [
    `# ${item.name}`, "",
    item.description, "",
    `Open **${CONFIG.demoProject}** in this folder to try the ${CONFIG.noun[0]} on its sample data.`, "",
    `- [How it works, its options and the sample data](${page})`,
    `- [Source on GitHub](${githubTree(CONFIG, item.path)})`,
    ...(item.aiBuilt ? ["", `*${plain}*`] : []),
    "",
  ].join("\n");
}

export function folderReadme(folder: string, children: { name: string; description: string; page: string }[]): string {
  const title = folder ? posix.basename(folder).replace(/-/g, " ") : CONFIG.title;
  return [
    `# ${title}`, "",
    `Demo projects for community ${CONFIG.noun[1]}, mirrored from [${CONFIG.githubRepo}](https://github.com/${CONFIG.githubRepo}). ` +
      `The [gallery](${SITE_URL}) describes each one.`, "",
    ...children.map((c) => `- [${c.name}](${c.page}): ${c.description}`),
    "",
  ].join("\n");
}

export function buildBundle(root: string, out: string): { tree: string; items: number; zip: string | null } {
  const serverFolder = decodeURIComponent(new URL(CONFIG.demoServerBase).pathname).replace(/^\/|\/$/g, "");
  const tree = join(out, "tree");
  rmSync(out, { recursive: true, force: true });
  const items = loadItems(root).filter((i) => i.hasDemo);
  const folders = new Map<string, { name: string; description: string; page: string }[]>();
  for (const item of items) {
    const dir = join(tree, serverFolder, item.path);
    mkdirSync(dir, { recursive: true });
    copyFileSync(join(root, item.path, "demo.ioz"), join(dir, "demo.ioz"));
    writeFileSync(join(dir, "README.md"), itemReadme(item));
    // Every parent folder lists what is directly below it.
    const parts = item.path.split("/");
    for (let i = 0; i < parts.length; i++) {
      const parent = parts.slice(0, i).join("/");
      const child = parts.slice(0, i + 1).join("/");
      const list = folders.get(parent) ?? [];
      if (!list.some((c) => c.name === parts[i] || c.page.endsWith(`/${encodePath(child)}/index.html`))) {
        list.push(i === parts.length - 1
          ? { name: item.name, description: item.description, page: `${SITE_URL}${encodePath(child)}/index.html` }
          : { name: parts[i].replace(/-/g, " "), description: "folder", page: `${SITE_URL}?q=${encodeURIComponent(child)}` });
      }
      folders.set(parent, list);
    }
  }
  for (const [folder, children] of folders) {
    const dir = join(tree, serverFolder, folder);
    mkdirSync(dir, { recursive: true });
    if (!existsSync(join(dir, "README.md"))) writeFileSync(join(dir, "README.md"), folderReadme(folder, children));
  }
  let zip: string | null = join(out, `${posix.basename(serverFolder) || "demo-server"}-bundle.zip`);
  try {
    execFileSync("zip", ["-qr", zip, "."], { cwd: tree });
  } catch {
    console.warn("zip is not installed: the tree is ready, but no zip was made");
    zip = null;
  }
  return { tree, items: items.length, zip };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const i = process.argv.indexOf("--out");
  const out = i > 0 ? process.argv[i + 1] : join(repoRoot(), "_bundle");
  const r = buildBundle(repoRoot(), out);
  console.log(`${r.items} demo projects in ${r.tree}${r.zip ? `, zipped to ${r.zip}` : ""}`);
}
