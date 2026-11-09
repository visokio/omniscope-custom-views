// Mock test runner: renders a view in the harness for each case in <view>/tests/cases.json.
//   node tools/harness/run-test.js <viewDir> [--only caseName] [--thumbnail]
// Headless Chromium: set CHROMIUM_PATH, or it looks for a system Chrome or Chromium.
// Each case: { name, data (csv path relative to the view), types?, options: {items}, width, height,
//              wait?, expect?: { selector, min, max, noErrors (default true), text },
//              actions?: [ {click: selector, at?: [x,y]}, {wait: ms}, {resize: [w,h]},
//                          {update: {items}}, {filter: Filter}, {expectSelection: true|false},
//                          {screenshot: name}, {eval: "js in view frame"},
//                          {expectRequest: {method, url (ending), body (partial), count?}}, {reload: true} ],
//              variables?, baseUrl?, workflow? (Workflow REST API stand-in, see omniscope-mock.js),
//              thumbnail?: true, expectError?: true, routes?: { urlGlob: file | 'abort' } }
// Writes <view>/tests/screenshots/<case>.png and <view>/tests/results.json (both gitignored). Exit code 1 on failure.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright-core');
const { chromiumPath } = require('./chromium');
const server = require('./server');
const validate = require('./validate');
const { toDataset } = require('./dataset');

async function run(viewDir, opts = {}) {
  viewDir = path.resolve(viewDir);
  const viewId = path.relative(server.ROOT, viewDir).split(path.sep).join('/');
  const manifest = JSON.parse(fs.readFileSync(path.join(viewDir, 'manifest.json'), 'utf8'));
  const cases = JSON.parse(fs.readFileSync(path.join(viewDir, 'tests', 'cases.json'), 'utf8'));
  const mv = validate.manifest(manifest);
  const shotDir = path.join(viewDir, 'tests', 'screenshots');
  fs.mkdirSync(shotDir, { recursive: true });
  const { srv, port } = await server.start(0);
  const browser = await chromium.launch({ executablePath: chromiumPath(), args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const results = { view: viewId, manifestValid: mv.ok, manifestErrors: mv.errors, cases: [] };
  for (const c of cases) {
    if (opts.only && c.name !== opts.only) continue;
    if (opts.thumbnail && !c.thumbnail) continue;
    const w = c.width || 900, h = c.height || 600;
    const ctx = await browser.newContext({ viewport: { width: w + 60, height: h + 300 }, deviceScaleFactor: c.scale || 1 });
    // routes: {"<url glob>": "<file in the view folder>" | "abort"} stands in for an outside service, so a view that
    // embeds one is tested offline. HARNESS_NO_ROUTES=1 lets the requests through (screenshots of the real service).
    if (c.routes && !process.env.HARNESS_NO_ROUTES) for (const [glob, target] of Object.entries(c.routes)) {
      await ctx.route(glob, rt => target === 'abort' ? rt.abort() : rt.fulfill({ path: path.join(viewDir, target) }));
    }
    const page = await ctx.newPage();
    const consoleErrors = [];
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 400)); });
    page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));
    const t0 = Date.now();
    await page.goto(`http://127.0.0.1:${port}/tools/harness/host.html`);
    let ds = { fields: c.fields || [], rows: [] };
    if (c.data) ds = toDataset(fs.readFileSync(path.join(viewDir, c.data), 'utf8'), c.types);
    if (c.generate) ds = require(path.join(viewDir, c.generate))(c.generateArgs || {});
    const config = { viewId, viewName: manifest.name, caseName: c.name, manifest, options: c.options || { items: {} }, dataset: ds, filter: c.filter || null, queryDelayMs: c.queryDelayMs,
      variables: c.variables, baseUrl: c.baseUrl, workflow: c.workflow };
    await page.evaluate(([cfg, size]) => window.mount(cfg, size), [config, { width: w, height: h }]);
    await page.waitForTimeout(c.wait || 2500);
    const frame = page.frames().find(f => f.url().includes('/' + viewId + '/index.html'));
    const r = { name: c.name, rows: ds.rows.length, ok: true, problems: [], checks: [] };
    const fail = msg => { r.ok = false; r.problems.push(msg); };
    const el = page.locator('#view');
    // Clip-based screenshots: element screenshots wait for 'stable' and can hang while a WebGL view animates.
    const shotEl = async file => { const bb = await el.boundingBox(); return page.screenshot({ path: file, clip: bb }); };
    const doShot = async name => { await shotEl(path.join(shotDir, name + '.png')); r.checks.push('screenshot ' + name); };
    for (const a of c.actions || []) {
     try {
      if (a.hover) { await frame.locator(a.hover).nth(a.nth || 0).hover({ force: true }); await page.waitForTimeout(a.waitAfter || 300); }
      if (a.click) {
        const loc = frame.locator(a.click).nth(a.nth || 0);
        if (!(await loc.count())) { fail('click target missing: ' + a.click); continue; }
        if (a.at) await loc.click({ position: { x: a.at[0], y: a.at[1] }, force: true }); else await loc.click({ force: true });
        await page.waitForTimeout(a.waitAfter || 500);
      }
      if (a.clickAt) { const box = await el.boundingBox(); await page.mouse.click(box.x + a.clickAt[0], box.y + a.clickAt[1]); await page.waitForTimeout(a.waitAfter || 500); }
      if (a.clickEval) {
        // Evaluate JS in the view frame that returns [x, y] (frame coordinates), then click there with the real mouse.
        const xy = await frame.evaluate(a.clickEval);
        if (!xy) { fail('clickEval returned nothing'); continue; }
        const box = await el.boundingBox();
        await page.mouse.move(box.x + xy[0], box.y + xy[1]); await page.waitForTimeout(150);
        await page.mouse.down(); await page.mouse.up(); await page.waitForTimeout(a.waitAfter || 600);
      }
      if (a.hoverEval) {
        const xy = await frame.evaluate(a.hoverEval); const box = await el.boundingBox();
        if (xy) { await page.mouse.move(box.x + xy[0], box.y + xy[1]); await page.waitForTimeout(a.waitAfter || 600); }
      }
      if (a.reload) {
        // Recreate the view's iframe, as Omniscope does when a block the view reads is executed: the view's JS state
        // is lost; sessionStorage and the mock's server-side state (jobs, parameters, requests) are kept.
        await page.evaluate(() => { const f = document.getElementById('view'); f.src = f.src; });
        await page.waitForTimeout(a.waitAfter || 1200);
        r.checks.push('reloaded');
      }
      if (a.wait) await page.waitForTimeout(a.wait);
      if (a.resize) { await page.evaluate(([w, h]) => window.resizeView(w, h), a.resize); await page.waitForTimeout(a.waitAfter || 1200); }
      if (a.update) { await frame.evaluate(items => window.__omniMock.update({ options: { items } }), a.update); await page.waitForTimeout(a.waitAfter || 1500); }
      if (a.filter !== undefined) { await frame.evaluate(f => window.__omniMock.setFilter(f), a.filter); await page.waitForTimeout(a.waitAfter || 1500); }
      if (a.eval) { const v = await frame.evaluate(a.eval); r.checks.push('eval ' + String(JSON.stringify(v)).slice(0, 200)); if (a.expectTruthy && !v) fail('eval falsy: ' + a.eval); }
      if (a.expectSelection !== undefined) {
        // In Omniscope a whitespace click clears the view's selection, so it counts as "cleared".
        const ev = await page.evaluate(() => window.__omniEvents.filter(e => e.type === 'updated' || e.type === 'whitespaceClick').pop());
        const has = !!(ev && ev.type === 'updated' && ev.data.viewSelection);
        if (has !== a.expectSelection) fail(`expected selection ${a.expectSelection}, got ${JSON.stringify(ev && ev.data)}`);
        else r.checks.push('selection ' + (has ? JSON.stringify(ev.data.viewSelection).slice(0, 300) : 'cleared'));
      }
      if (a.expectRequest) {
        // Workflow REST API calls the view made (answered by the mock): match method, URL ending and a partial body.
        const want = a.expectRequest, reqs = await frame.evaluate(() => window.__omniMock.workflow.requests);
        const sub = (x, y) => y === undefined || (y && typeof y === 'object' ? x && typeof x === 'object' &&
          Object.keys(y).every(k => sub(x[k], y[k])) && (!Array.isArray(y) || x.length === y.length) : x === y);
        const hits = reqs.filter(q => (!want.method || q.method === want.method) && (!want.url || q.url.endsWith(want.url)) && sub(q.body, want.body));
        const ok = want.count !== undefined ? hits.length === want.count : hits.length > 0;
        if (!ok) fail(`expected ${want.count !== undefined ? want.count : 'a'} request ${JSON.stringify(want).slice(0, 200)}; got ${hits.length} of ${JSON.stringify(reqs).slice(0, 400)}`);
        else r.checks.push('request ' + JSON.stringify(want).slice(0, 160) + ' x' + hits.length);
      }
      if (a.screenshot) await doShot(c.name + '-' + a.screenshot);
     } catch (e) { fail('action ' + JSON.stringify(a).slice(0, 120) + ' threw: ' + e.message.split('\n')[0]); }
    }
    const events = await page.evaluate(() => window.__omniEvents);
    const ctxObj = await frame.evaluate(() => JSON.parse(JSON.stringify(omniscope.view.context())));
    const cv = validate.context(ctxObj);
    if (!cv.ok) fail('context schema: ' + cv.errors.slice(0, 5).join('; '));
    const errs = events.filter(e => e.type === 'error' || e.type === 'exception' || e.type === 'queryError');
    r.viewErrors = errs.map(e => e.data);
    r.consoleErrors = consoleErrors;
    const ex = c.expect || {};
    if (!c.expectError && ex.noErrors !== false) {
      if (errs.length) fail('view reported errors: ' + JSON.stringify(errs.map(e => e.data)).slice(0, 400));
      if (consoleErrors.length) fail('console errors: ' + consoleErrors.join(' | ').slice(0, 400));
    }
    if (c.expectError && !errs.length) fail('expected the view to report an error');
    if (ex.selector) {
      const n = await frame.locator(ex.selector).count();
      r.checks.push(`${ex.selector} count=${n}`);
      if (ex.min !== undefined && n < ex.min) fail(`${ex.selector}: ${n} < ${ex.min}`);
      if (ex.max !== undefined && n > ex.max) fail(`${ex.selector}: ${n} > ${ex.max}`);
    }
    if (ex.text) {
      const body = await frame.evaluate(() => document.body.innerText);
      if (!body.includes(ex.text)) fail('text not found: ' + ex.text);
    }
    if (ex.notBlank || ex.canvasNotBlank) {
      // Screenshot-based: works for WebGL canvases too (they cannot be read back without preserveDrawingBuffer).
      const { PNG } = require('pngjs');
      const png = PNG.sync.read(await shotEl());
      const colours = new Set();
      for (let i = 0; i < png.data.length; i += 4 * 7) colours.add((png.data[i] >> 3) + ',' + (png.data[i + 1] >> 3) + ',' + (png.data[i + 2] >> 3));
      r.checks.push('distinct colours=' + colours.size);
      if (colours.size < (ex.minColours || 6)) fail('render looks blank (' + colours.size + ' colours)');
    }
    if (false) {
      const nb = await frame.evaluate(sel => {
        const cv = document.querySelector(sel || 'canvas'); if (!cv) return false;
        const t = document.createElement('canvas'); t.width = 64; t.height = 64; const g = t.getContext('2d'); g.drawImage(cv, 0, 0, 64, 64);
        const d = g.getImageData(0, 0, 64, 64).data; const s = new Set(); for (let i = 0; i < d.length; i += 16) s.add(d[i] + ',' + d[i + 1] + ',' + d[i + 2]); return s.size > 3;
      }, ex.canvasNotBlank === true ? null : ex.canvasNotBlank);
      r.checks.push('canvas not blank=' + nb);
      if (!nb) fail('canvas looks blank');
    }
    r.renderMs = Date.now() - t0;
    // Only with --thumbnail: a normal test run must not rewrite the committed thumbnail.
    if (c.thumbnail && opts.thumbnail) await shotEl(path.join(viewDir, 'thumbnail.png'));
    await doShot(c.name);
    results.cases.push(r);
    console.log(`${r.ok ? 'PASS' : 'FAIL'} ${viewId}/${c.name} rows=${r.rows} ${r.renderMs}ms ${r.problems.join(' ; ')}`);
    await ctx.close();
  }
  await browser.close(); srv.close();
  if (!opts.only && !opts.thumbnail) fs.writeFileSync(path.join(viewDir, 'tests', 'results.json'), JSON.stringify(results, null, 1));
  if (!mv.ok) console.log('manifest schema warnings: ' + mv.errors.join('; '));
  return results;
}
module.exports = { run };
if (require.main === module) {
  const a = process.argv.slice(2);
  const o = { only: a.includes('--only') ? a[a.indexOf('--only') + 1] : null, thumbnail: a.includes('--thumbnail') };
  run(a[0], o).then(r => process.exit(r.cases.every(c => c.ok) ? 0 : 1)).catch(e => { console.error(e); process.exit(2); });
}
