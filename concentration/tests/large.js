// 150,000 items with long-tailed values, for the performance test.
module.exports = function () {
  let s = 71; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; const rows = [];
  for (let i = 0; i < 150000; i++) rows.push(['I' + i, Math.round(100 / Math.pow(rnd() + 1e-6, 0.6))]);
  return { fields: [{ name: 'Id', type: 'TEXT' }, { name: 'Amount', type: 'NUMBER' }], rows };
};
