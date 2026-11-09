// 2,000 products x 2 periods x 50 rows (200,000 rows) for the performance test.
module.exports = function () {
  let s = 10; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; const rows = [];
  for (let i = 0; i < 2000; i++) { const p = 1 + (i % 40); for (const yr of ['A', 'B']) { if ((i % 97 === 0 && yr === 'A') || (i % 89 === 0 && yr === 'B')) continue; for (let k = 0; k < 50; k++) { const u = Math.round(rnd() * 100); rows.push([yr, 'SKU' + i, u, u * p * (yr === 'B' ? 1.03 : 1)]); } } }
  return { fields: [{ name: 'Period', type: 'TEXT' }, { name: 'SKU', type: 'TEXT' }, { name: 'Units', type: 'NUMBER' }, { name: 'Revenue', type: 'NUMBER' }], rows };
};
