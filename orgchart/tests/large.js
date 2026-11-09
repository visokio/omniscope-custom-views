// A 5,000-person random hierarchy for the performance test.
module.exports = function () {
  let s = 15; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; const rows = [['P0', null, 'Top', 'CEO', 'D0']];
  for (let i = 1; i < 5000; i++) { const p = Math.floor(Math.pow(rnd(), 1.6) * i); rows.push(['P' + i, 'P' + p, 'Person ' + i, 'Role ' + (i % 30), 'D' + (i % 6)]); }
  return { fields: [{ name: 'ID', type: 'TEXT' }, { name: 'Boss', type: 'TEXT' }, { name: 'Name', type: 'TEXT' }, { name: 'Title', type: 'TEXT' }, { name: 'Dept', type: 'TEXT' }], rows };
};
