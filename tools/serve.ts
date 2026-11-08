// npm run serve [-- --port N]: serve the built gallery (_site/) to preview it. Build it first with npm run build.
// Default ports differ per repository (views 8080, blocks 8081), and nothing is cached, so previews of the two
// galleries never show each other's pages.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, normalize, extname } from "node:path";
import { repoRoot } from "./lib/items.ts";
import { CONFIG } from "./repo.ts";
import { pathToFileURL } from "node:url";

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "application/javascript", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".csv": "text/csv", ".ioz": "application/octet-stream",
};

export function serve(dir: string, port: number, host = "0.0.0.0") {
  const server = createServer(async (req, res) => {
    let p = decodeURIComponent((req.url ?? "/").split("?")[0]);
    let file = join(dir, normalize(p).replace(/^(\.\.[/\\])+/, ""));
    try {
      if ((await stat(file)).isDirectory()) file = join(file, "index.html");
      const body = await readFile(file);
      res.writeHead(200, { "Content-Type": MIME[extname(file)] ?? "application/octet-stream", "Cache-Control": "no-store" });
      res.end(body);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("not found");
    }
  });
  return new Promise<typeof server>((r) => server.listen(port, host, () => r(server)));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const i = process.argv.indexOf("--port");
  const port = i > 0 ? +process.argv[i + 1] : CONFIG.kind === "views" ? 8080 : 8081;
  await serve(join(repoRoot(), "_site"), port);
  console.log(`gallery on http://localhost:${port}/`);
}
