// 300,000 machines with a numeric age in days, a failure flag and 12 models, for the performance test (and the Other group).
module.exports = function () {
  let s = 5; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; const rows = [];
  for (let i = 0; i < 300000; i++) { const m = Math.floor(Math.pow(rnd(), 1.5) * 12); const life = -Math.log(rnd()) * (400 + m * 60); const obs = rnd() * 1500; rows.push([Math.round(Math.min(life, obs)), life <= obs ? 'Yes' : 'No', 'Model ' + String.fromCharCode(65 + m)]); }
  return { fields: [{ name: 'Age days', type: 'NUMBER' }, { name: 'Failed', type: 'TEXT' }, { name: 'Model', type: 'TEXT' }], rows };
};
