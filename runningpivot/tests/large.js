// 20,000 records over 500 days and 10 stores for the large-dataset test: Units is 1 to 100 in turn, so the
// final running total of all units is 1,010,000.
module.exports = function () {
  const rows = [], start = Date.UTC(2024, 0, 1);
  for (let i = 0; i < 20000; i++) {
    const d = new Date(start + (i % 500) * 86400000).toISOString().slice(0, 10);
    rows.push([d, 'Store ' + String(i % 10).padStart(2, '0'), (i % 100) + 1]);
  }
  return { fields: [{ name: 'Day', type: 'DATE' }, { name: 'Store', type: 'TEXT' }, { name: 'Units', type: 'NUMBER' }], rows };
};
