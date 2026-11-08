// 40,000 cases (about 200,000 events) over 12 activities for the performance test.
module.exports = function () {
  let s = 41; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; const rows = [], A = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  for (let c = 0; c < 40000; c++) { let t = Date.UTC(2025, 0, 1) + c * 6e4; let i = 0; while (i < A.length) { rows.push(['K' + c, A[i], new Date(t).toISOString()]); t += 36e5 * (1 + rnd() * 5); i += 1 + (rnd() < 0.3 ? 1 : 0); if (rnd() < 0.05 && i > 2) i -= 2; if (rows.length > 199000) break; } if (rows.length > 199000) break; }
  return { fields: [{ name: 'Case', type: 'TEXT' }, { name: 'Act', type: 'TEXT' }, { name: 'When', type: 'DATE' }], rows };
};
