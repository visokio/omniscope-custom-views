// A 140 by 140 grid (19,600 cells, the most the view asks for) of a wavy function, for the performance test.
module.exports = function () {
  const rows = [];
  for (let a = 0; a < 140; a++) for (let b = 0; b < 140; b++) rows.push([a, b, Math.sin(a / 14) * Math.cos(b / 20) * 50 + a * 0.3]);
  return { fields: [{ name: 'A', type: 'NUMBER' }, { name: 'B', type: 'NUMBER' }, { name: 'V', type: 'NUMBER' }], rows };
};
