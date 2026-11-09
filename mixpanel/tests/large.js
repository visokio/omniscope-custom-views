// 20,000 records: the tracker reads no data, so it must behave the same however large the report's data is.
module.exports = function () {
  const rows = [];
  for (let i = 0; i < 20000; i++) rows.push(['Team ' + (i % 40), i % 100]);
  return { fields: [{ name: 'Team', type: 'TEXT' }, { name: 'Sessions', type: 'NUMBER' }], rows };
};
