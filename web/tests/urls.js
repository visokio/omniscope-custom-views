// Web addresses for the edge cases: generateArgs.urls, one record each; or 20,000 records with generateArgs.large
// (one map address per record, Region cycling through four values).
module.exports = function (args) {
  if (args.large) {
    const rows = [];
    for (let i = 0; i < 20000; i++) rows.push(['https://www.openstreetmap.org/export/embed.html?bbox=' + i, ['North', 'South', 'East', 'West'][i % 4]]);
    return { fields: [{ name: 'Map', type: 'TEXT' }, { name: 'Region', type: 'TEXT' }], rows };
  }
  return { fields: [{ name: 'Address', type: 'TEXT' }], rows: (args.urls || []).map((u) => [u]) };
};
