// Post IDs for the edge cases: generateArgs.ids (strings or numbers), one record each, plus 20,000 records with
// generateArgs.large (Account cycles through four values, IDs 1000 + n).
module.exports = function (args) {
  if (args.large) {
    const rows = [];
    for (let i = 0; i < 20000; i++) rows.push([String(1000 + i), ['North', 'South', 'East', 'West'][i % 4]]);
    return { fields: [{ name: 'Post ID', type: 'TEXT' }, { name: 'Account', type: 'TEXT' }], rows };
  }
  const ids = args.ids || [];
  const type = ids.length && typeof ids[0] === 'number' ? 'NUMBER' : 'TEXT';
  return { fields: [{ name: 'Post ID', type }], rows: ids.map((v) => [v]) };
};
