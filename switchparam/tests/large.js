// Large case: 3,000 distinct customers (invented), to check the view shows only the first values.
module.exports = function () {
  var rows = [], regions = ["North", "South", "East", "West"];
  for (var i = 0; i < 6000; i++) rows.push(["Customer " + ("000" + (i % 3000 + 1)).slice(-4), regions[i % 4], (i % 7) * 10 + 5]);
  return { fields: [{ name: "Customer", type: "TEXT" }, { name: "Region", type: "TEXT" }, { name: "Sales", type: "NUMBER" }], rows: rows };
};
