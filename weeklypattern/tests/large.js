// 400,000 timestamped events over two years, for the performance test (about 17,500 hourly buckets).
module.exports = function () {
  let s = 37; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; const rows = []; const t0 = Date.UTC(2024, 10, 4);
  for (let i = 0; i < 400000; i++) { const d = Math.floor(rnd() * 728); const h = Math.floor(8 + Math.pow(rnd(), 0.7) * 12); rows.push([new Date(t0 + d * 864e5 + h * 36e5 + Math.floor(rnd() * 36e5)).toISOString(), Math.round(rnd() * 100)]); }
  return { fields: [{ name: 'When', type: 'DATE' }, { name: 'Value', type: 'NUMBER' }], rows };
};
