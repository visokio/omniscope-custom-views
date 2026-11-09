// 200,000 values across 40 groups for the performance test.
module.exports = function () {
  let s = 6; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; const rows = [];
  for (let i = 0; i < 200000; i++) { const g = Math.floor(rnd() * 40); rows.push(['Group ' + String(g).padStart(2, '0'), Math.round(Math.exp(Math.log(20 + g * 3) + (rnd() + rnd() + rnd() - 1.5) * 0.6) * 10) / 10]); }
  return { fields: [{ name: 'Group', type: 'TEXT' }, { name: 'Measure', type: 'NUMBER' }], rows };
};
