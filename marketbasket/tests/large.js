// 80,000 baskets (about 400,000 lines) over 2,000 SKUs with a few planted pairs, for the performance test.
module.exports = function () {
  let s = 97; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; const rows = [];
  for (let b = 0; b < 80000; b++) {
    const items = new Set(); const k = 2 + Math.floor(rnd() * 6);
    for (let i = 0; i < k; i++) items.add('SKU ' + Math.floor(Math.pow(rnd(), 2.2) * 2000));
    if (rnd() < 0.08) { items.add('SKU 3'); items.add('SKU 7'); }
    items.forEach(i => rows.push(['T' + b, i]));
  }
  return { fields: [{ name: 'Txn', type: 'TEXT' }, { name: 'SKU', type: 'TEXT' }], rows };
};
