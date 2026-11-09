// A large network for the large-dataset test: 10,000 links (the view's data limit) between 2,000 people in 8 teams.
// With { people: 4000 } it makes more nodes than the view draws, for the limit test.
module.exports = function (args) {
  const people = (args && args.people) || 2000, linksN = (args && args.links) || 10000;
  let s = 29; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647, rows = [], seen = new Set();
  const teams = ['Sales', 'Marketing', 'Engineering', 'Operations', 'Finance', 'Support', 'Legal', 'Design'];
  for (let i = 0; rows.length < linksN && i < linksN * 3; i++) {
    const a = rows.length < people ? rows.length : Math.floor(rnd() * people);
    const same = rnd() < 0.85, team = a % 8;
    let b = same ? Math.floor(rnd() * (people / 8)) * 8 + team : Math.floor(rnd() * people);
    if (b === a) b = (a + 8) % people;
    const k = a + '>' + b; if (seen.has(k)) continue; seen.add(k);
    rows.push(['P' + a, 'P' + b, teams[team], 1 + Math.floor(rnd() * 30)]);
  }
  return { fields: [{ name: 'From', type: 'TEXT' }, { name: 'To', type: 'TEXT' }, { name: 'Team', type: 'TEXT' }, { name: 'Messages', type: 'NUMBER' }], rows };
};
