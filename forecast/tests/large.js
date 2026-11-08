// 400,000 transactions over four years of days, for the performance test (aggregated to weeks by the query).
module.exports = function () {
  let s = 21; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; const rows = []; const t0 = Date.UTC(2022, 0, 3);
  for (let i = 0; i < 400000; i++) { const d = Math.floor(rnd() * 1456); const boost = 1 + 0.4 * Math.sin(2 * Math.PI * d / 364); rows.push([new Date(t0 + d * 864e5).toISOString().slice(0, 10), Math.round(rnd() * 100 * boost * (1 + d / 2000))]); }
  return { fields: [{ name: 'Day', type: 'DATE' }, { name: 'Amount', type: 'NUMBER' }], rows };
};
