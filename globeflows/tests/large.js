// 3,000 random routes between 500 random places for the performance test.
module.exports = function () {
  let s = 17; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const P = []; for (let i = 0; i < 500; i++) P.push(['P' + i, Math.asin(2 * rnd() - 1) * 180 / Math.PI, rnd() * 360 - 180]);
  const rows = []; for (let i = 0; i < 3000; i++) { const a = P[Math.floor(rnd() * 500)], b = P[Math.floor(rnd() * 500)]; rows.push([a[0], a[1], a[2], b[0], b[1], b[2], Math.round(rnd() * 1000)]); }
  return { fields: ['From', 'From lat', 'From lon', 'To', 'To lat', 'To lon', 'Value'].map((n, i) => ({ name: n, type: [0, 3].includes(i) ? 'TEXT' : 'NUMBER' })), rows };
};
