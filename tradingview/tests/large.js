// 20,000 trades for the large-dataset test: ten symbols in turn, so the Max symbol is known (NYSE:T9).
module.exports = function () {
  const rows = [];
  for (let i = 0; i < 20000; i++) rows.push(['NYSE:T' + (i % 10), (i % 100) + 1]);
  return { fields: [{ name: 'Symbol', type: 'TEXT' }, { name: 'Quantity', type: 'NUMBER' }], rows };
};
