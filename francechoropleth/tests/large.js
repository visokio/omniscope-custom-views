// 30,300 rows for the large-dataset test: 300 rows for each of the 101 department codes, Value 1 to 100 in turn,
// so every department's sum is 15,150 and the map is evenly coloured.
const fs = require('fs'), path = require('path');
module.exports = function () {
  const codes = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'regions_fr.json'), 'utf8')).departments.map(d => d.code);
  const rows = [];
  for (let i = 0; i < 300; i++) codes.forEach((c, k) => rows.push([c, ((i * 101 + k) % 100) + 1]));
  return { fields: [{ name: 'Code', type: 'TEXT' }, { name: 'Value', type: 'NUMBER' }], rows };
};
