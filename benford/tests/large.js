// 500,000 log-uniform amounts (which follow Benford's law) across 400 cost centres, for the performance test.
module.exports = function () {
  let s = 17; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; const rows = [];
  for (let i = 0; i < 500000; i++) rows.push([Math.round(Math.pow(10, 1 + rnd() * 5) * 100) / 100, 'CC' + Math.floor(rnd() * 400)]);
  return { fields: [{ name: 'Value', type: 'NUMBER' }, { name: 'Centre', type: 'TEXT' }], rows };
};
