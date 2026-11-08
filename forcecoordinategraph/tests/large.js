// 3,000 nodes in 30 clusters and 6,000 links, for the large-dataset test (more links than Links shown).
module.exports = function () {
  let s = 23; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647, rows = [];
  const nodes = [];
  for (let i = 0; i < 3000; i++) {
    const c = i % 30, cx = (c % 6) * 100, cy = Math.floor(c / 6) * 100;
    nodes.push(['Node ' + (i + 1), 'Cluster ' + (c % 10 + 1), Math.round(cx + (rnd() - 0.5) * 60), Math.round(cy + (rnd() - 0.5) * 60)]);
  }
  nodes.forEach(n => rows.push([n[0], null, n[1], n[2], n[3], null]));
  for (let i = 0; i < 6000; i++) {
    const a = nodes[Math.floor(rnd() * 3000)], b = nodes[Math.floor(rnd() * 3000)];
    rows.push([a[0], b[0], a[1], a[2], a[3], Math.round(rnd() * 100)]);
  }
  return { fields: [{ name: 'Node', type: 'TEXT' }, { name: 'Linked', type: 'TEXT' }, { name: 'Cluster', type: 'TEXT' },
    { name: 'X', type: 'NUMBER' }, { name: 'Y', type: 'NUMBER' }, { name: 'Weight', type: 'NUMBER' }], rows };
};
