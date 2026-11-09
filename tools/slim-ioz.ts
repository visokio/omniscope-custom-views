// npm run slim-ioz -- <file.ioz> [...]: remove the exporting server's branding (fonts, logos, style) from an IOZ.
// An exported IOZ carries the server's branding, about 1 MB of fonts, which the importing server doesn't use.
// An IOZ is a short header followed by a zip; this keeps the header, the project and its data. Rewrites in place.
import { readFileSync, writeFileSync } from "node:fs";
import { unzipSync, zipSync } from "fflate";
import { pathToFileURL } from "node:url";

const BRANDING = new Set(["BRANDING", "style.xml", "favicon.ico", "crumb-corner-logo.svg", "attribution-logo.svg"]);

export function slimIoz(bytes: Uint8Array): Uint8Array {
  const start = Buffer.from(bytes).indexOf(Buffer.from("PK\u0003\u0004", "binary"));
  if (start < 0) throw new Error("not an IOZ: no zip found");
  const entries = unzipSync(bytes.subarray(start));
  const kept: Record<string, Uint8Array> = {};
  for (const [name, data] of Object.entries(entries))
    if (!BRANDING.has(name) && !name.startsWith("visokio-branded-font")) kept[name] = data;
  const zip = zipSync(kept, { level: 6 });
  const out = new Uint8Array(start + zip.length);
  out.set(bytes.subarray(0, start), 0);
  out.set(zip, start);
  return out;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  for (const f of process.argv.slice(2)) {
    const before = readFileSync(f);
    const after = slimIoz(before);
    writeFileSync(f, after);
    console.log(`${f}: ${before.length} -> ${after.length} bytes`);
  }
}
