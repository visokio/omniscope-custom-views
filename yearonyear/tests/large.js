// 450,000 orders over five years (the query aggregates them to periods), for the performance test.
module.exports = function () {
  let s = 53; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; const rows = []; const t0 = Date.UTC(2021, 10, 1), span = 1826;
  for (let i = 0; i < 450000; i++) { const d = Math.floor(Math.pow(rnd(), 0.9) * span); rows.push([new Date(t0 + d * 864e5).toISOString().slice(0, 10), Math.round(20 + rnd() * 80)]); }
  return { fields: [{ name: 'Day', type: 'DATE' }, { name: 'Amount', type: 'NUMBER' }], rows };
};
