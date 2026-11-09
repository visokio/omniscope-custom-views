// 1,000 stores (the view's data limit) for the large-dataset test, in five regions.
module.exports = function () {
  let s = 17; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647, rows = [];
  const regions = ['North', 'Midlands', 'South', 'Wales', 'Scotland'];
  for (let i = 0; i < 1000; i++) {
    const g = (rnd() + rnd() + rnd() - 1.5) * 10;
    rows.push(['Store ' + (i + 1), regions[i % 5], Math.round(g * 10) / 10, Math.round((7 + g / 10 + rnd()) * 10) / 10]);
  }
  return { fields: [{ name: 'Store', type: 'TEXT' }, { name: 'Region', type: 'TEXT' }, { name: 'Sales growth (%)', type: 'NUMBER' }, { name: 'Customer score', type: 'NUMBER' }], rows };
};
