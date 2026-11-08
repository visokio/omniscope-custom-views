// 500,000 events from 120,000 users over six possible steps plus noise, for the performance test.
module.exports = function () {
  let s = 47; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; const rows = []; const A = ['Open', 'Browse', 'Select', 'Basket', 'Pay', 'Confirm'];
  for (let u = 0; u < 120000 && rows.length < 500000; u++) { let t = Date.UTC(2026, 0, 1) + Math.floor(rnd() * 3e10); for (let k = 0; k < A.length; k++) { rows.push(['u' + u, A[k], new Date(t).toISOString()]); if (rnd() < 0.3) rows.push(['u' + u, 'Help', new Date(t + 1000).toISOString()]); t += Math.floor(rnd() * 6e5); if (rnd() < 0.35) break; } }
  return { fields: [{ name: 'User', type: 'TEXT' }, { name: 'Action', type: 'TEXT' }, { name: 'At', type: 'DATE' }], rows };
};
