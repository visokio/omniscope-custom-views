// 500 items over 120 periods for the performance test.
module.exports = function () {
  let s = 21; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; const rows = [];
  for (let m = 0; m < 120; m++) for (let i = 0; i < 500; i++) rows.push([new Date(Date.UTC(2016, m, 1)).toISOString().slice(0, 10), 'Item ' + i, Math.round(rnd() * 1000 * (1 + (i % 9) * m / 60))]);
  return { fields: [{ name: 'Month', type: 'DATE' }, { name: 'Item', type: 'TEXT' }, { name: 'V', type: 'NUMBER' }], rows };
};
