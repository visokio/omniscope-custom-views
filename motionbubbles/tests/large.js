// 1,000 bubbles over 40 periods for the performance test.
module.exports = function () {
  let s = 27; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; const rows = [];
  for (let t = 0; t < 40; t++) for (let i = 0; i < 1000; i++) rows.push([2000 + t, 'B' + i, 'G' + (i % 6), 10 + (i % 50) + t * (i % 7) * 0.3 + rnd() * 3, 50 + (i % 30) - t * 0.4 + rnd() * 3, 1 + (i % 97)]);
  return { fields: [{ name: 'Year', type: 'NUMBER' }, { name: 'Name', type: 'TEXT' }, { name: 'Group', type: 'TEXT' }, { name: 'X', type: 'NUMBER' }, { name: 'Y', type: 'NUMBER' }, { name: 'Size', type: 'NUMBER' }], rows };
};
