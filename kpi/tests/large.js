// 20,000 orders for the large-dataset test: Sales is 1 to 100 in turn, so the total is known (1,010,000).
module.exports = function () {
  const regions = ['North', 'South', 'East', 'West'], rows = [];
  for (let i = 0; i < 20000; i++) rows.push([regions[i % 4], (i % 100) + 1]);
  return { fields: [{ name: 'Region', type: 'TEXT' }, { name: 'Sales', type: 'NUMBER' }], rows };
};
