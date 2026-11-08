// Many products (1,500 by default) in ten categories for the large-dataset tests. Every 100th product has a negative
// revenue (refunds), which the view leaves out and counts in its note. generateArgs.n changes the number of products.
module.exports = function (args) {
  const n = (args && args.n) || 1500;
  let s = 23; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647, rows = [];
  for (let i = 0; i < n; i++) {
    const revenue = (i + 1) % 100 === 0 ? -50 : Math.round(Math.exp(rnd() * 6) * 100) / 10;
    rows.push(['Product ' + (i + 1), 'Category ' + ((i % 10) + 1), revenue]);
  }
  return { fields: [{ name: 'Product', type: 'TEXT' }, { name: 'Category', type: 'TEXT' }, { name: 'Revenue', type: 'NUMBER' }], rows };
};
