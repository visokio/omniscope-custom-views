// 2,000 tickets over eight weeks, about 20,000 rows, for the large-dataset test.
module.exports = function () {
  let s = 29; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647, rows = [];
  const teams = ['Network', 'Accounts', 'Hardware', 'Software'], day0 = Date.UTC(2026, 8, 7, 8);
  const iso = ms => new Date(ms).toISOString();
  for (let i = 0; i < 2000; i++) {
    let t = day0 + Math.floor(rnd() * 54) * 86400000 + rnd() * 9 * 3600000;
    const n = 4 + Math.floor(rnd() * 12);
    for (let k = 0; k < n; k++) {
      const e = k % 2 ? 2 : (rnd() < 0.5 ? 1 : 0), len = (e === 2 ? 0.5 + rnd() * 2 : 1 + rnd() * 20) * 3600000;
      rows.push(['T-' + (i + 1), 'T-' + (i + 1), teams[i % 4], e, iso(t), iso(t + len)]);
      t += len;
    }
  }
  return { fields: [{ name: 'Ticket', type: 'TEXT' }, { name: 'Title', type: 'TEXT' }, { name: 'Team', type: 'TEXT' },
    { name: 'Emphasis', type: 'NUMBER' }, { name: 'Start', type: 'DATE' }, { name: 'End', type: 'DATE' }], rows };
};
