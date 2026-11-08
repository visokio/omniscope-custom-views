// Daily records ending in 2025, 10 a day on every day, Amount 1 to 100 in turn, for the large-dataset tests:
// ten years (2016 to 2025, 36,530 records) by default, or { years: n }.
module.exports = function (args) {
  const years = (args && args.years) || 10;
  const rows = [], start = Date.UTC(2026 - years, 0, 1), end = Date.UTC(2026, 0, 1);
  let i = 0;
  for (let t = start; t < end; t += 86400000) {
    const d = new Date(t).toISOString().slice(0, 10);
    for (let k = 0; k < 10; k++) rows.push([d, (i++ % 100) + 1]);
  }
  return { fields: [{ name: 'Day', type: 'DATE' }, { name: 'Amount', type: 'NUMBER' }], rows };
};
