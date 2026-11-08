// 50 columns x 40 stack categories x 10 rows each, for the performance test.
module.exports = function () {
  let s = 5; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; const rows = [];
  for (let c = 0; c < 50; c++) for (let k = 0; k < 40; k++) for (let i = 0; i < 10; i++) rows.push(['Column ' + c, 'Series ' + k, Math.round(rnd() * 1000 * (1 + (c % 7)))]);
  return { fields: [{ name: 'Col', type: 'TEXT' }, { name: 'Ser', type: 'TEXT' }, { name: 'V', type: 'NUMBER' }], rows };
};
