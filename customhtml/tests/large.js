// 10,000 records in 250 groups, each record carrying its group's HTML, for the large-dataset test
// (one block per group: the view shows the first 200 of 250).
module.exports = function () {
  const rows = [];
  for (let i = 0; i < 10000; i++) { const g = i % 250; rows.push(['G' + String(g).padStart(3, '0'), '<p class="g">Group ' + g + '</p>']); }
  return { fields: [{ name: 'Group', type: 'TEXT' }, { name: 'Html', type: 'TEXT' }], rows };
};
