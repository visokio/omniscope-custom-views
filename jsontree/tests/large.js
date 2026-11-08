// 5,000 records, each a small JSON object, for the large-dataset test (the view shows the first 500).
module.exports = function () {
  const rows = [];
  for (let i = 0; i < 5000; i++) rows.push(['R' + i, JSON.stringify({ id: i, tags: ['a', 'b'], nested: { even: i % 2 === 0 } })]);
  return { fields: [{ name: 'Id', type: 'TEXT' }, { name: 'Payload', type: 'TEXT' }], rows };
};
