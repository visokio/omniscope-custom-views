// The gallery: a static site in _site/ with an index page, one page per item and catalogue.json.
// Shared by both community repositories; each passes its items and a RepoConfig.
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync, readFileSync, copyFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, posix, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { Marked, type Tokens } from "marked";
import {
  type Item, type RepoConfig, AI_BUILT_TAG, AI_BUILT_STATEMENT, EXPLORER_URL,
  encodePath, githubTree, githubBlob, githubRaw, demoServerUrl,
} from "./model.ts";
import { type RelatedMap, parseRelated, readRelated, relatedSection, relatedForCatalogue } from "./related.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const IMAGE_EXT = new Set([".png", ".svg", ".jpg", ".jpeg", ".gif", ".webp"]);

export function esc(s: unknown): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Path from one site page's folder to the site root ("../../"). */
function up(path: string): string {
  return "../".repeat(path.split("/").length);
}

function isRelative(href: string): boolean {
  return !/^([a-z][a-z0-9+.-]*:|\/\/|#|\/)/i.test(href);
}

/**
 * Renders an item's Markdown (showcase or README). Relative images are copied next to the page;
 * other relative links point at the file on GitHub. docDir is the document's folder within the item.
 */
export function renderMarkdown(cfg: RepoConfig, item: Item, root: string, md: string, docDir: string,
  copies: Set<string>, live?: (index: number) => string | null): string {
  const lives: string[] = [];
  let liveIndex = 0;
  const resolve = (href: string) => posix.normalize(posix.join(docDir, decodeURI(href.split("#")[0])));
  const marked = new Marked({
    gfm: true,
    renderer: {
      image({ href, title, text }: Tokens.Image) {
        if (live && /^live/i.test(text)) {
          const html = live(liveIndex++);
          if (html) { lives.push(html); return `LIVEDEMO${lives.length - 1}X`; }
        }
        let src = href;
        if (isRelative(href)) {
          const rel = resolve(href);
          if (rel.startsWith("..") || !existsSync(join(root, item.path, rel))) return "";
          copies.add(rel);
          src = encodePath(rel);
        }
        return `<img src="${esc(src)}" alt="${esc(text)}"${title ? ` title="${esc(title)}"` : ""} loading="lazy">`;
      },
      link({ href, title, tokens }: Tokens.Link) {
        const inner = this.parser.parseInline(tokens);
        let url = href;
        if (isRelative(href) && href) {
          const rel = resolve(href);
          const abs = posix.normalize(posix.join(item.path, rel));
          url = abs.startsWith("..") ? githubTree(cfg, "") : existsSync(join(root, abs)) && statSync(join(root, abs)).isDirectory()
            ? githubTree(cfg, abs) : githubBlob(cfg, abs);
        }
        const ext = /^https?:/.test(url) ? ' target="_blank" rel="noopener"' : "";
        return `<a href="${esc(url)}"${title ? ` title="${esc(title)}"` : ""}${ext}>${inner}</a>`;
      },
    },
  });
  // Drop the document's own title (the page has one) and the HTML comments used as markers.
  const body = md.replace(/^﻿/, "").replace(/<!--[\s\S]*?-->/g, "").replace(/^\s*# .*\n/, "");
  let html = marked.parse(body, { async: false }) as string;
  html = html.replace(/<p>\s*<img ([^>]*)>\s*<\/p>/g, (_m, attrs) => {
    const alt = /alt="([^"]*)"/.exec(attrs)?.[1] ?? "";
    return `<figure class="shot"><img ${attrs}>${alt ? `<figcaption>${alt}</figcaption>` : ""}</figure>`;
  });
  return html.replace(/(?:<p>)?LIVEDEMO(\d+)X(?:<\/p>)?/g, (_m, i) => lives[+i]);
}

function badge(text: string, cls = "", title = "", href = ""): string {
  const t = title ? ` title="${esc(title)}"` : "";
  return href ? `<a class="badge ${cls}" href="${esc(href)}"${t}>${esc(text)}</a>` : `<span class="badge ${cls}"${t}>${esc(text)}</span>`;
}

/** The icon's file name in the item's gallery folder. */
export function iconFile(item: Item): string | null {
  if (!item.icon) return null;
  if ("file" in item.icon) return item.icon.file;
  const mime = /^data:([^;,]+)/.exec(item.icon.dataUri)?.[1] ?? "image/png";
  return mime.includes("svg") ? "icon.svg" : "icon.png";
}

/** The icon as the app shows it: blocks on their category's tile colour, views on white. */
function iconHtml(cfg: RepoConfig, item: Item, prefix: string, cls: string): string {
  const f = iconFile(item);
  if (!f) return "";
  const colour = cfg.tileColours?.[item.category];
  const style = colour ? ` style="background:${esc(colour)}"` : "";
  return `<span class="icon ${colour ? "tile" : "plain"} ${cls}"${style}><img src="${esc(prefix + encodePath(f))}" alt=""></span>`;
}

const LANG_TITLE: Record<string, string> = { Python: "Runs as a Python script inside Omniscope", R: "Runs as an R script inside Omniscope" };

/** Small badges: categories, language and the visokio-agents tag; each filters the index. */
function badges(cfg: RepoConfig, item: Item, rootRel: string): string {
  const lang = item.language ? (item.language === "PYTHON" ? "Python" : item.language) : "";
  const cats = item.subcategory ? [`${item.category} › ${item.subcategory}`] : item.categories;
  return [
    ...cats.map((c, i) => badge(c, "cat", `All ${(item.subcategory ? item.category : item.categories[i])} ${cfg.noun[1]}`,
      `${rootRel}index.html?category=${encodeURIComponent(item.subcategory ? item.category : item.categories[i])}`)),
    lang ? badge(lang, "lang", LANG_TITLE[lang] ?? "", `${rootRel}index.html?q=${encodeURIComponent("lang:" + lang.toLowerCase())}`) : "",
    item.aiBuilt ? badge(AI_BUILT_TAG, "ai", AI_BUILT_STATEMENT.short + " Click for all of them; see About for what it means.", `${rootRel}index.html?tag=${AI_BUILT_TAG}`) : "",
  ].filter(Boolean).join(" ");
}

function head(title: string, rootRel: string, description = ""): string {
  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
${description ? `<meta name="description" content="${esc(description)}">` : ""}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700&family=Roboto+Slab:wght@500;700&display=swap">
<link rel="stylesheet" href="${rootRel}assets/style.css">
<link rel="icon" href="${rootRel}assets/favicon.svg">
</head>
<body>`;
}

function topBar(cfg: RepoConfig, rootRel: string): string {
  return `<nav class="top"><div class="wrap"><a class="home" href="${rootRel}index.html">${esc(cfg.title)}</a>` +
    `<a href="${esc(cfg.otherGallery.url)}">${esc(cfg.otherGallery.title)}</a>` +
    `<a href="${EXPLORER_URL}" target="_blank" rel="noopener">Explorer</a>` +
    `<a href="https://github.com/${cfg.githubRepo}" target="_blank" rel="noopener">GitHub</a></div></nav>`;
}

function footer(cfg: RepoConfig): string {
  return `<footer><div class="wrap"><p>${esc(cfg.title)}: community ${esc(cfg.noun[1])} for <a href="https://visokio.com/" target="_blank" rel="noopener">Omniscope</a>. ` +
    `Source and issues on <a href="https://github.com/${cfg.githubRepo}" target="_blank" rel="noopener">GitHub</a>. Community ${esc(cfg.otherGallery.noun[1])} are in <a href="${esc(cfg.otherGallery.url)}">${esc(cfg.otherGallery.title)}</a>. Sample data is invented unless a page says otherwise.</p></div></footer>\n</body>\n</html>\n`;
}

function optionTable(title: string, rows: { title: string; type: string; description?: string }[]): string {
  if (!rows.length) return "";
  return `<h3>${esc(title)}</h3><table><thead><tr><th>Name</th><th>Type</th><th>What it does</th></tr></thead><tbody>` +
    rows.map((o) => `<tr><td>${esc(o.title)}</td><td>${esc(o.type)}</td><td>${esc(o.description ?? "")}</td></tr>`).join("") +
    `</tbody></table>`;
}

function itemPage(cfg: RepoConfig, item: Item, root: string, copies: Set<string>, related: RelatedMap,
  byPath: Map<string, Item>): string {
  const rootRel = up(item.path);
  const links: string[] = [];
  if (item.hasDemo) {
    links.push(`<a class="btn primary" href="${esc(demoServerUrl(cfg, item.path))}" target="_blank" rel="noopener">Open the demo in Omniscope</a>`);
    links.push(`<a class="btn" href="${esc(githubRaw(cfg, item.path + "/demo.ioz"))}">Download demo.ioz</a>`);
  }
  for (const f of item.sampleData) {
    copies.add(f);
    links.push(`<a class="btn" href="${esc(encodePath(f))}" download>Sample data: ${esc(posix.basename(f))}</a>`);
  }
  links.push(`<a class="btn" href="${esc(githubTree(cfg, item.path))}" target="_blank" rel="noopener">Source on GitHub</a>`);

  let body = "";
  if (item.showcase) {
    const md = readFileSync(join(root, item.path, item.showcase), "utf8");
    body = renderMarkdown(cfg, item, root, md, posix.dirname(item.showcase), copies,
      cfg.renderLive ? (i) => cfg.renderLive!(item, root, i) : undefined);
  } else if (item.readme) {
    const md = readFileSync(join(root, item.path, item.readme), "utf8");
    body = renderMarkdown(cfg, item, root, md, "", copies);
  } else {
    body = `<p>${esc(item.description)}</p>`;
  }
  const lead = cfg.renderLead ? cfg.renderLead(item, root) : "";
  // Blocks: the thumbnail is the icon, already in the header; views: a picture of the view.
  const showThumb = !!item.thumbnail && !lead && !item.showcase && !cfg.tileColours;
  if (showThumb) copies.add(item.thumbnail!);
  const thumb = showThumb ? `<figure class="shot thumb"><img src="${esc(encodePath(item.thumbnail!))}" alt="${esc(item.name)}"></figure>` : "";
  const ref = `<section class="reference"><h2>Reference</h2>` +
    optionTable("Fields it reads", item.inputs) + optionTable("Options", item.options) +
    (item.outputs.length ? `<h3>Outputs</h3><table><thead><tr><th>Output</th><th>What it holds</th></tr></thead><tbody>` +
      item.outputs.map((o) => `<tr><td>${esc(o.label)}</td><td>${esc(o.description ?? "")}</td></tr>`).join("") + `</tbody></table>` : "") +
    (item.libraries.length ? `<h3>Third-party libraries</h3><ul>${item.libraries.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>` : "") +
    `</section>`;
  return head(`${item.name} · ${cfg.title}`, rootRel, item.description) +
    (cfg.pageData ? cfg.pageData(item) : "") +
    topBar(cfg, rootRel) +
    `<header class="hero"><div class="wrap"><p class="crumbs"><a href="${rootRel}index.html">${esc(cfg.title)}</a> › ${esc(item.path)}</p>` +
    `<div class="title">${iconHtml(cfg, item, "", "big")}<h1>${esc(item.name)}</h1></div><p class="lead">${esc(item.description)}</p><p class="badges">${badges(cfg, item, rootRel)}</p>` +
    `<p class="actions">${links.join(" ")}</p></div></header>\n` +
    `<main class="wrap">${lead}${item.aiBuilt ? `<p class="ai-note">${AI_BUILT_STATEMENT.html} <a href="${rootRel}about.html">About</a></p>` : ""}` +
    `<article>${thumb}${body}</article>${relatedSection(cfg, item, related.get(item.path), byPath, rootRel, esc)}${ref}</main>\n` +
    LIVE_SCRIPT + footer(cfg);
}

// Starts each live demo when it scrolls into view, so its entrance animation is seen, and wires Replay.
const LIVE_SCRIPT = `<script>
(function () {
  var fs = document.querySelectorAll("iframe[data-srcdoc]");
  function go(f) { if (f.dataset.srcdoc) { f.srcdoc = f.dataset.srcdoc; delete f.dataset.srcdoc; } }
  Array.prototype.forEach.call(document.querySelectorAll("figure.live .replay"), function (b) {
    b.addEventListener("click", function () { var f = b.closest("figure").querySelector("iframe"); if (f.dataset.srcdoc) go(f); else f.srcdoc = f.getAttribute("srcdoc"); });
  });
  if (!("IntersectionObserver" in window)) { Array.prototype.forEach.call(fs, go); return; }
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); go(e.target); } }); }, { rootMargin: "0px 0px -20% 0px" });
  Array.prototype.forEach.call(fs, function (f) { io.observe(f); });
})();
</script>
`;

function indexPage(cfg: RepoConfig, items: Item[]): string {
  const catCounts = new Map<string, number>();
  for (const i of items) for (const c of i.categories) catCounts.set(c, (catCounts.get(c) ?? 0) + 1);
  const cats = [...catCounts.keys()].sort((a, b) => {
    const o = cfg.categoryOrder ?? [];
    return (o.indexOf(a) < 0 ? 99 : o.indexOf(a)) - (o.indexOf(b) < 0 ? 99 : o.indexOf(b)) || a.localeCompare(b);
  });
  const tagCounts = new Map<string, number>();
  for (const i of items) for (const t of new Set(i.tags.map((t) => t.toLowerCase()))) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  const tags = [...tagCounts.entries()].filter(([, n]) => n >= 2).map(([t]) => t).sort();
  const cards = items.map((i) => {
    const prefix = encodePath(i.path) + "/";
    // Blocks show their icon as the app draws it; views show their picture, else the icon.
    const thumb = cfg.tileColours && iconFile(i) ? iconHtml(cfg, i, prefix, "huge")
      : i.thumbnail ? `<img src="${esc(prefix + encodePath(i.thumbnail))}" alt="" loading="lazy">`
      : iconFile(i) ? iconHtml(cfg, i, prefix, "huge") : `<div class="nothumb">${esc(i.name)}</div>`;
    // "lang:python" / "lang:r": a search word only the language badge's link uses (a bare "r" matches nearly every block).
    const search = [i.name, i.description, ...i.categories, i.subcategory ?? "", i.language ? "lang:" + (i.language === "PYTHON" ? "python" : i.language) : "", ...i.tags, i.path].join(" ").toLowerCase();
    const lang = i.language ? (i.language === "PYTHON" ? "Python" : i.language) : "";
    const small = [...(i.subcategory ? [`${i.category} › ${i.subcategory}`] : i.categories).map((c) => badge(c, "cat")),
      lang ? badge(lang, "lang", LANG_TITLE[lang] ?? "") : "", i.aiBuilt ? badge(AI_BUILT_TAG, "ai", AI_BUILT_STATEMENT.short) : ""].filter(Boolean).join(" ");
    return `<a class="card" href="${esc(prefix)}index.html" data-cats="${esc(i.categories.join("|"))}" data-tags="${esc(i.tags.map((t) => t.toLowerCase()).join("|"))}" data-search="${esc(search)}">` +
      `<div class="thumb">${thumb}</div><div class="body"><h3>${cfg.tileColours ? "" : iconHtml(cfg, i, prefix, "small")}${esc(i.name)}</h3><p>${esc(i.description)}</p>` +
      `<p class="badges small">${small}</p></div></a>`;
  }).join("\n");
  const ai = items.filter((i) => i.aiBuilt).length;
  return head(cfg.title, "", cfg.intro) + topBar(cfg, "") +
    `<header class="hero"><div class="wrap"><h1>${esc(cfg.title)}</h1><p class="lead">${esc(cfg.intro)}</p>` +
    `<p class="lead small">${items.length} ${esc(cfg.noun[1])}. Machine-readable list for agents: <a href="catalogue.json">catalogue.json</a>.</p></div></header>\n` +
    `<main class="wrap"><div class="filters"><input id="q" type="search" placeholder="Search ${esc(cfg.noun[1])}" aria-label="Search">` +
    `<input type="hidden" id="cat">` +
    `<select id="tag" aria-label="Tag"><option value="">All tags</option>${tags.map((t) => `<option${t === AI_BUILT_TAG ? ' value="visokio-agents"' : ""}>${esc(t)}</option>`).join("")}</select>` +
    `<span id="count"></span></div>\n` +
    `<div class="chips" role="group" aria-label="Categories"><button type="button" data-cat="" class="chip">All <span>${items.length}</span></button>` +
    cats.map((c) => `<button type="button" class="chip" data-cat="${esc(c)}">${esc(c)} <span>${catCounts.get(c)}</span></button>`).join("") + `</div>\n` +
    `<div class="grid" id="grid">\n${cards}\n</div>\n` +
    `<p class="about-link"><a href="about.html">About these ${esc(cfg.noun[1])} and the ${AI_BUILT_TAG} tag</a> (${ai} of the ${items.length} carry it).</p></main>\n` +
    `<script>
(function () {
  var q = document.getElementById("q"), cat = document.getElementById("cat"), tag = document.getElementById("tag"), count = document.getElementById("count");
  var cards = document.querySelectorAll(".card");
  var p = new URLSearchParams(location.search);
  if (p.get("q")) q.value = p.get("q"); if (p.get("category")) cat.value = p.get("category"); if (p.get("tag")) tag.value = p.get("tag");
  function apply() {
    var words = q.value.toLowerCase().split(/\\s+/).filter(Boolean), n = 0;
    Array.prototype.forEach.call(cards, function (c) {
      var ok = (!cat.value || c.dataset.cats.split("|").indexOf(cat.value) >= 0) && (!tag.value || c.dataset.tags.split("|").indexOf(tag.value) >= 0) &&
        words.every(function (w) { return c.dataset.search.indexOf(w) >= 0; });
      c.hidden = !ok; if (ok) n++;
    });
    count.textContent = n + " of " + cards.length;
    var s = new URLSearchParams(); if (q.value) s.set("q", q.value); if (cat.value) s.set("category", cat.value); if (tag.value) s.set("tag", tag.value);
    history.replaceState(null, "", s.toString() ? "?" + s : location.pathname);
  }
  var chips = document.querySelectorAll(".chip");
  function mark() { Array.prototype.forEach.call(chips, function (b) { b.classList.toggle("on", b.dataset.cat === cat.value); }); }
  Array.prototype.forEach.call(chips, function (b) { b.addEventListener("click", function () { cat.value = b.dataset.cat; mark(); apply(); }); });
  [q, tag].forEach(function (el) { el.addEventListener("input", apply); });
  mark(); apply();
})();
</script>\n` + footer(cfg);
}

/** Date (YYYY-MM-DD) of the last commit to touch each item's folder; empty without a full git history, so a shallow clone can't give wrong dates. */
export function lastUpdated(root: string, items: Item[]): Map<string, string> {
  const git = (...args: string[]) => execFileSync("git", ["-C", root, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  const out = new Map<string, string>();
  try {
    if (git("rev-parse", "--is-shallow-repository") !== "false") return out;
    for (const i of items) {
      const date = git("log", "-1", "--format=%cs", "--", i.path);
      if (date) out.set(i.path, date);
    }
  } catch { return new Map(); }  // not a git checkout
  return out;
}

export function catalogue(cfg: RepoConfig, items: Item[], siteUrl: string, related: RelatedMap = new Map(), updated: Map<string, string> = new Map()) {
  const byPath = new Map(items.map((i) => [i.path, i]));
  return {
    generatedFrom: `https://github.com/${cfg.githubRepo}`,
    kind: cfg.kind,
    statement: AI_BUILT_STATEMENT.html.replace(/<[^>]+>/g, ""),
    items: items.map((i) => ({
      id: i.path,
      name: i.name,
      category: i.category,
      categories: i.categories,
      subcategory: i.subcategory ?? null,
      description: i.description,
      tags: i.tags,
      aiBuilt: i.aiBuilt,
      language: i.language ?? null,
      inputs: i.inputs,
      options: i.options,
      outputs: i.outputs,
      libraries: i.libraries,
      lastUpdated: updated.get(i.path) ?? null,
      relatedSummary: related.get(i.path)?.summary ?? null,
      related: relatedForCatalogue(cfg, related.get(i.path), byPath, siteUrl),
      links: {
        page: `${siteUrl}${encodePath(i.path)}/index.html`,
        source: githubTree(cfg, i.path),
        demoIoz: i.hasDemo ? githubRaw(cfg, i.path + "/demo.ioz") : null,
        demoServer: i.hasDemo ? demoServerUrl(cfg, i.path) : null,
        sampleData: i.sampleData.map((f) => githubRaw(cfg, i.path + "/" + f)),
      },
    })),
  };
}

function aboutPage(cfg: RepoConfig, items: Item[]): string {
  const ai = items.filter((i) => i.aiBuilt).length;
  return head(`About · ${cfg.title}`, "", "") + topBar(cfg, "") +
    `<header class="hero"><div class="wrap"><p class="crumbs"><a href="index.html">${esc(cfg.title)}</a> › About</p><h1>About</h1></div></header>\n` +
    `<main class="wrap"><article><h2>Community ${esc(cfg.noun[1])}</h2><p>Every ${esc(cfg.noun[0])} here can be added to Omniscope from its picker, which lists this repository's ${esc(cfg.noun[1])}. ` +
    `Adding one copies it into your project, so later changes here don't affect projects that already use it.</p>` +
    `<p>Each page lists related ${esc(cfg.noun[1])} under <b>Related</b>: Omniscope's core blocks and views, community ${esc(cfg.noun[1])} here, and ` +
    `community ${esc(cfg.otherGallery.noun[1])} in <a href="${esc(cfg.otherGallery.url)}">${esc(cfg.otherGallery.title)}</a>. Where two do a similar job, it says which to use when.</p>` +
    `<p>To compare core and community blocks and views in one list, with filters, use the <a href="${EXPLORER_URL}" target="_blank" rel="noopener">Blocks and Views Explorer</a>, a report built in Omniscope.</p>` +
    `<h2 id="${AI_BUILT_TAG}">The ${AI_BUILT_TAG} tag</h2><p>${AI_BUILT_STATEMENT.html}</p><p>${ai} of the ${items.length} ${esc(cfg.noun[1])} carry it: <a href="index.html?tag=${AI_BUILT_TAG}">show them</a>.</p>` +
    `<h2>Badges</h2><p>Each page shows small badges: the category (as in Omniscope's picker)${cfg.kind === "blocks" ? ", the script language" : ""}, and ${AI_BUILT_TAG} where it applies. Clicking one lists every ${esc(cfg.noun[0])} that shares it.</p></article></main>\n` + footer(cfg);
}

export interface BuildResult { pages: number; files: number; outDir: string }

export function buildSite(cfg: RepoConfig, items: Item[], root: string, outDir: string, siteUrl: string): BuildResult {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(join(outDir, "assets"), { recursive: true });
  for (const f of readdirSync(join(HERE, "assets"))) copyFileSync(join(HERE, "assets", f), join(outDir, "assets", f));
  let files = 0;
  // Problems in related.json are reported (and fail) in npm run build; the gallery shows what parses.
  const related = parseRelated(cfg, readRelated(root), items).map;
  const byPath = new Map(items.map((i) => [i.path, i]));
  for (const item of items) {
    const copies = new Set<string>();
    const html = itemPage(cfg, item, root, copies, related, byPath);
    if (item.thumbnail) copies.add(item.thumbnail);
    const dir = join(outDir, item.path);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "index.html"), html);
    if (item.icon && "file" in item.icon) copies.add(item.icon.file);
    if (item.icon && "dataUri" in item.icon) {
      const data = item.icon.dataUri.split(",", 2)[1] ?? "";
      const base64 = /;base64,/.test(item.icon.dataUri);
      writeFileSync(join(dir, iconFile(item)!), base64 ? Buffer.from(data, "base64") : decodeURIComponent(data));
      files++;
    }
    for (const rel of copies) {
      const src = join(root, item.path, rel);
      if (!existsSync(src)) continue;
      mkdirSync(dirname(join(dir, rel)), { recursive: true });
      copyFileSync(src, join(dir, rel));
      files++;
    }
  }
  writeFileSync(join(outDir, "index.html"), indexPage(cfg, items));
  writeFileSync(join(outDir, "about.html"), aboutPage(cfg, items));
  writeFileSync(join(outDir, "catalogue.json"), JSON.stringify(catalogue(cfg, items, siteUrl, related, lastUpdated(root, items)), null, 1) + "\n");
  writeFileSync(join(outDir, ".nojekyll"), "");
  return { pages: items.length + 1, files, outDir };
}

export { IMAGE_EXT, extname };
