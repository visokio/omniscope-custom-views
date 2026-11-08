// 300,000 transactions from 80,000 customers, for the performance test.
module.exports = function () {
  let s = 13; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; const rows = []; const t0 = Date.UTC(2025, 0, 1);
  for (let i = 0; i < 300000; i++) { const c = Math.floor(Math.pow(rnd(), 1.6) * 80000); rows.push(['K' + c, new Date(t0 + Math.floor(rnd() * 600) * 864e5).toISOString().slice(0, 10), Math.round(rnd() * 20000) / 100]); }
  return { fields: [{ name: 'Cust', type: 'TEXT' }, { name: 'Day', type: 'DATE' }, { name: 'Amount', type: 'NUMBER' }], rows };
};
