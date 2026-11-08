// 20,000 sales over 12 products for the large-dataset test: Sales is 1 to 100 in turn, so the total is 1,010,000.
module.exports = function () {
  const rows = [];
  for (let i = 0; i < 20000; i++) rows.push(['Product ' + String((i % 12) + 1).padStart(2, '0'), (i % 100) + 1]);
  return { fields: [{ name: 'Product', type: 'TEXT' }, { name: 'Sales', type: 'NUMBER' }], rows };
};
