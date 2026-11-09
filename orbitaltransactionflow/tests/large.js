// Invented transfers for the large-dataset tests: n transactions (default 2,500) between a treasury and 39 entities.
module.exports = function (args) {
  const n = (args && args.n) || 2500;
  let s = 23; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647, rows = [];
  const names = ['Treasury'].concat(Array.from({ length: 39 }, (_, i) => 'Entity ' + String(i + 1).padStart(2, '0')));
  const t0 = Date.UTC(2026, 2, 2, 8);
  for (let i = 0; i < n; i++) {
    const a = rnd() < 0.5 ? 0 : 1 + Math.floor(rnd() * 39);
    let b = a === 0 ? 1 + Math.floor(rnd() * 39) : (rnd() < 0.7 ? 0 : 1 + Math.floor(rnd() * 39));
    rows.push(['T' + (i + 1), new Date(t0 + i * 7000).toISOString(), names[a], names[b], 100 + Math.round(rnd() * 9900)]);
  }
  return { fields: [{ name: 'Transfer ID', type: 'TEXT' }, { name: 'Time', type: 'DATE' }, { name: 'From', type: 'TEXT' },
    { name: 'To', type: 'TEXT' }, { name: 'Amount', type: 'NUMBER' }], rows };
};
