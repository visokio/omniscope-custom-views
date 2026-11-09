// 50,000 rows x 15 numeric fields for the performance test.
module.exports = function () {
  let s = 2; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; const g = () => (rnd() + rnd() + rnd() + rnd() - 2);
  const fields = []; for (let j = 0; j < 15; j++) fields.push({ name: 'M' + String(j).padStart(2, '0'), type: 'NUMBER' });
  const rows = []; for (let i = 0; i < 50000; i++) { const a = g(), b = g(); const r = []; for (let j = 0; j < 15; j++) r.push(a * (j % 3) + b * (j % 5 === 0 ? 2 : -0.5) + g()); rows.push(r); }
  return { fields, rows };
};
