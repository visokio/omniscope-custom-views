// 300,000 scored records for the performance test.
module.exports = function () {
  let s = 33; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; const rows = [];
  for (let i = 0; i < 300000; i++) { const y = rnd() < 0.1 ? 1 : 0; const z = (rnd() + rnd() + rnd() - 1.5) * 0.25 + (y ? 0.62 : 0.32); rows.push([y, Math.max(0, Math.min(1, z))]); }
  return { fields: [{ name: 'Fraud', type: 'NUMBER' }, { name: 'Score', type: 'NUMBER' }], rows };
};
