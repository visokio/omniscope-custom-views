// 500,000 users in two arms with a small true uplift, for the performance test (aggregated on the query side).
module.exports = function () {
  let s = 31; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; const rows = [];
  for (let i = 0; i < 500000; i++) { const arm = rnd() < 0.5 ? 'Control' : 'Treatment'; const dev = rnd() < 0.6 ? 'Mobile' : 'Desktop'; rows.push([arm, dev, rnd() < (arm === 'Control' ? 0.05 : 0.053) ? 1 : 0]); }
  return { fields: [{ name: 'Arm', type: 'TEXT' }, { name: 'Device', type: 'TEXT' }, { name: 'Clicked', type: 'NUMBER' }], rows };
};
