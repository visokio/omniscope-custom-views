// Records 30 years apart: more years than the view draws.
module.exports = function () {
  return { fields: [{ name: 'Day', type: 'DATE' }, { name: 'Amount', type: 'NUMBER' }], rows: [['1995-03-01', 1], ['2025-03-01', 2]] };
};
