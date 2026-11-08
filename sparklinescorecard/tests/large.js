// 400 rows x 104 weeks for the performance test.
module.exports = function () {
  let s = 12; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; const rows = [];
  for (let wk = 0; wk < 104; wk++) for (let i = 0; i < 400; i++) { const v = 1000 + i * 10 + wk * (i % 7 - 3) * 4 + rnd() * 200; rows.push([new Date(Date.UTC(2024, 0, 1 + 7 * wk)).toISOString().slice(0, 10), 'Account ' + String(i).padStart(3, '0'), Math.round(v), Math.round(1000 + i * 10 + wk * 2)]); }
  return { fields: [{ name: 'Week', type: 'DATE' }, { name: 'Account', type: 'TEXT' }, { name: 'Revenue', type: 'NUMBER' }, { name: 'Goal', type: 'NUMBER' }], rows };
};
