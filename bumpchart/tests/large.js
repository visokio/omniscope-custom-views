// 300 items ranked over 104 weeks, for the performance test.
module.exports = function () {
  let s = 4; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; const rows = [];
  for (let wk = 0; wk < 104; wk++) for (let i = 0; i < 300; i++) rows.push([new Date(Date.UTC(2024, 0, 1 + 7 * wk)).toISOString().slice(0, 10), 'Item ' + i, Math.round(1000 / (1 + i * 0.05) * (0.7 + rnd() * 0.6))]);
  return { fields: [{ name: 'Week', type: 'DATE' }, { name: 'Item', type: 'TEXT' }, { name: 'Score', type: 'NUMBER' }], rows };
};
