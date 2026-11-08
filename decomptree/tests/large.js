// 120,000 synthetic rows with a high-cardinality Region field (60 values) for the performance test.
module.exports = function (a) {
  const n = a.rows || 120000, fields = [{ name: 'Region', type: 'TEXT' }, { name: 'Channel', type: 'TEXT' }, { name: 'Category', type: 'TEXT' }, { name: 'Customer type', type: 'TEXT' }, { name: 'Carrier', type: 'TEXT' }, { name: 'Warehouse', type: 'TEXT' }, { name: 'Revenue (GBP)', type: 'NUMBER' }];
  const rows = []; let s = 1;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) rows.push(['Area ' + Math.floor(rnd() * 60), ['Online', 'Store', 'Phone'][Math.floor(rnd() * 3)], 'Cat ' + Math.floor(rnd() * 8), ['New', 'Returning'][Math.floor(rnd() * 2)], 'C' + Math.floor(rnd() * 4), 'W' + Math.floor(rnd() * 4), Math.round(rnd() * 20000) / 100]);
  return { fields, rows };
};
