// 10,000 records for the large-dataset test. X, Y and Z cycle through 0-99 at different rates, so each set
// (value above 50) holds exactly half the records and the eight regions add up to 10,000.
module.exports = function () {
  const rows = [];
  for (let i = 0; i < 10000; i++) rows.push([i % 100, Math.floor(i / 100) % 100, (i * 7) % 100]);
  return { fields: [{ name: 'X', type: 'NUMBER' }, { name: 'Y', type: 'NUMBER' }, { name: 'Z', type: 'NUMBER' }], rows };
};
