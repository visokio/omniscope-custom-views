// 400,000 answers (40 statements, 1 to 5 scale, 8 regions), for the performance test.
module.exports = function () {
  let s = 43; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; const rows = [];
  for (let i = 0; i < 400000; i++) { const q = Math.floor(rnd() * 40); rows.push(['Statement ' + (q + 1), 'Region ' + Math.floor(rnd() * 8), Math.max(1, Math.min(5, Math.round(1 + rnd() * 4 + (q % 5 - 2) * 0.3)))]); }
  return { fields: [{ name: 'Item', type: 'TEXT' }, { name: 'Region', type: 'TEXT' }, { name: 'Score', type: 'NUMBER' }], rows };
};
