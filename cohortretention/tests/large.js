// ~200,000 order rows (40,000 customers over 36 months) for the performance test.
module.exports = function () {
  const rows = []; let s = 9; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  let id = 0;
  for (let m = 0; m < 36; m++) for (let c = 0; c < 1100; c++) {
    id++; for (let k = 0; k < 36 - m; k++) if (k === 0 || rnd() < 0.3 * Math.exp(-0.1 * k) + 0.1) {
      const d = new Date(Date.UTC(2023, m + k, 1 + Math.floor(rnd() * 27)));
      rows.push(['K' + id, d.toISOString().slice(0, 10), Math.round(rnd() * 8000) / 100]);
    }
  }
  return { fields: [{ name: 'Customer ID', type: 'TEXT' }, { name: 'Order date', type: 'DATE' }, { name: 'Order value (GBP)', type: 'NUMBER' }], rows };
};
