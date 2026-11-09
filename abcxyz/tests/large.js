// 10,000 SKUs over 24 months (about 190,000 rows after dropping zero months), for the performance test.
module.exports = function () {
  let s = 59; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; const rows = [];
  for (let k = 0; k < 10000; k++) { const lvl = 1 + Math.floor(Math.pow(rnd(), 3) * 500), sporadic = rnd() < 0.3; for (let m = 0; m < 24; m++) { const u = sporadic ? (rnd() < 0.2 ? Math.round(lvl * rnd() * 4) : 0) : Math.max(0, Math.round(lvl * (0.6 + rnd() * 0.8))); if (u > 0) rows.push(['P' + k, new Date(Date.UTC(2024, 10 + m, 1)).toISOString().slice(0, 10), u]); } }
  return { fields: [{ name: 'Part', type: 'TEXT' }, { name: 'Month', type: 'DATE' }, { name: 'Qty', type: 'NUMBER' }], rows };
};
