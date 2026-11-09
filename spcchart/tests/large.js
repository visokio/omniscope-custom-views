// 2,000 daily points (one row each) with noise, a level shift and a slow drift, for the performance test.
module.exports = function () {
  const rows = []; let s = 3; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const d0 = Date.UTC(2020, 0, 1);
  for (let i = 0; i < 2000; i++) {
    const g = (rnd() + rnd() + rnd() - 1.5) * 2;
    rows.push([new Date(d0 + i * 864e5).toISOString().slice(0, 10), 50 + g * 3 + (i > 1200 ? 6 : 0) + i * 0.002]);
  }
  return { fields: [{ name: 'Day', type: 'DATE' }, { name: 'Reading', type: 'NUMBER' }], rows };
};
