// 10,000 sites (the view's data limit) for the large-dataset test, scattered around ten towns.
module.exports = function () {
  let s = 23; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647, rows = [];
  const towns = [[40.42, -3.70], [41.39, 2.17], [39.47, -0.38], [37.39, -5.98], [41.65, -0.89],
    [36.72, -4.42], [43.26, -2.93], [41.65, -4.72], [42.24, -8.72], [38.99, -1.86]];
  const kinds = ['Standard', 'Fast', 'Ultra-fast'];
  for (let i = 0; i < 10000; i++) {
    const t = towns[i % towns.length], g = () => (rnd() + rnd() + rnd() - 1.5) * 0.5;
    rows.push(['S' + (i + 1), kinds[i % 3], Math.round((t[0] + g()) * 1e4) / 1e4, Math.round((t[1] + g()) * 1e4) / 1e4]);
  }
  return { fields: [{ name: 'Site', type: 'TEXT' }, { name: 'Charger type', type: 'TEXT' }, { name: 'Latitude', type: 'NUMBER' }, { name: 'Longitude', type: 'NUMBER' }], rows };
};
