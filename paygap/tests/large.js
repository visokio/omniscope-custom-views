// 200,000 employees in 50 sites, for the performance test.
module.exports = function () {
  let s = 61; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; const rows = [];
  for (let i = 0; i < 200000; i++) { const f = rnd() < 0.45; rows.push([f ? 'F' : 'M', Math.round((10 + Math.pow(rnd(), 2) * 50) * (f ? 0.92 : 1) * 100) / 100, rnd() < 0.5 ? Math.round(rnd() * 3000) : 0, 'Site ' + Math.floor(rnd() * 50)]); }
  return { fields: [{ name: 'Sex', type: 'TEXT' }, { name: 'Rate', type: 'NUMBER' }, { name: 'Bonus', type: 'NUMBER' }, { name: 'Site', type: 'TEXT' }], rows };
};
