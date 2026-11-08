// 40 floors x 50 zones (2,000 boxes) for the performance test.
module.exports = function () {
  let s = 8; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; const rows = [];
  for (let f = 0; f < 40; f++) for (let i = 0; i < 50; i++) rows.push([f, 'Z' + i, (i % 10) * 6, Math.floor(i / 10) * 6, 5.5, 5.5, Math.round(rnd() * 100)]);
  return { fields: [{ name: 'Floor', type: 'NUMBER' }, { name: 'Zone', type: 'TEXT' }, { name: 'X', type: 'NUMBER' }, { name: 'Y', type: 'NUMBER' }, { name: 'W', type: 'NUMBER' }, { name: 'D', type: 'NUMBER' }, { name: 'Load', type: 'NUMBER' }], rows };
};
