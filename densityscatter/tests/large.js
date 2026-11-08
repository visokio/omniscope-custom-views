// 1,000,000 points for the performance test.
module.exports = function () {
  let s = 31; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; const g = () => rnd() + rnd() + rnd() - 1.5; const rows = [];
  for (let i = 0; i < 1000000; i++) { const a = g(), b = g(); rows.push([a * 10 + (i % 3) * 8, a * 6 + b * 4 + (i % 3) * 5]); }
  return { fields: [{ name: 'A', type: 'NUMBER' }, { name: 'B', type: 'NUMBER' }], rows };
};
