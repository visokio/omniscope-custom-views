// Static server for the harness: serves the repository and maps the Omniscope library URL to the mock.
// node tools/harness/server.js [port], then open /tools/harness/host.html?view=<view>
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.csv': 'text/csv', '.md': 'text/markdown', '.jpg': 'image/jpeg', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json' };
function start(port = 0) {
  const srv = http.createServer((req, res) => {
    let u = decodeURIComponent(req.url.split('?')[0]);
    if (u === '/favicon.ico') { res.writeHead(204); return res.end(); } // browsers ask for it; a 404 shows as a console error
    if (u === '/_global_/customview/v1/omniscope.js') u = '/tools/harness/omniscope-mock.js';
    const f = path.join(ROOT, path.normalize(u).replace(/^(\.\.[/\\])+/, ''));
    if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    fs.stat(f, (e, st) => {
      let file = f;
      if (!e && st.isDirectory()) file = path.join(f, 'index.html');
      fs.readFile(file, (err, buf) => {
        if (err) { res.writeHead(404); return res.end('not found'); }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        res.end(buf);
      });
    });
  });
  return new Promise(r => srv.listen(port, '127.0.0.1', () => r({ srv, port: srv.address().port })));
}
module.exports = { start, ROOT };
if (require.main === module) start(+process.argv[2] || 8123).then(({ port }) => console.log('harness on http://127.0.0.1:' + port + '/tools/harness/host.html'));
