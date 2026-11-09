"""Illustrative freight network for the Force Coordinate Graph view (invented). routes.csv: 100 depots of a
fictional parcel carrier, each with a map position (km east and north of a reference point), its region and its
daily capacity, and the routes between them with the number of shipments a week.

One row per route (Depot -> Linked depot). Every depot also has one row with an empty Linked depot, so depots with
no outgoing route are still drawn. The depot's own columns (region, position, capacity) repeat on all its rows."""
import csv, math, random
random.seed(11)
regions = {  # centre (east km, north km)
    "North": (330, 690), "East": (560, 410), "South": (300, 90), "West": (90, 380), "Central": (320, 380)}
syll = ["Ash", "Brad", "Carn", "Dun", "Elm", "Fair", "Glen", "Hol", "Ivy", "Kel", "Lang", "Mar", "Nor", "Oak",
        "Pen", "Red", "Stan", "Thorn", "Up", "Wey"]
ends = ["ford", "ton", "by", "ham", "field", "wick", "bridge", "mouth", "ley", "stow"]
names = set()
def town():
    while True:
        n = random.choice(syll) + random.choice(ends)
        if n not in names:
            names.add(n)
            return n
depots = []  # name, region, east, north, capacity, is_hub
for r, (cx, cy) in regions.items():
    depots.append([town() + " Hub", r, cx, cy, random.randint(9000, 12000), True])
    for i in range(19):
        a, d = random.uniform(0, 2 * math.pi), abs(random.gauss(0, 70)) + 25
        depots.append([town(), r, round(cx + d * math.cos(a)), round(cy + d * math.sin(a)),
                       random.randint(400, 2500), False])
hubs = {d[1]: d for d in depots if d[5]}
routes = {}
def add(a, b, w):
    if a is not b:
        routes[(a[0], b[0])] = routes.get((a[0], b[0]), 0) + w
for d in depots:
    if d[5]:
        for h in hubs.values():
            add(d, h, random.randint(800, 2000))
    else:
        add(d, hubs[d[1]], random.randint(60, 400))
        for _ in range(random.choice([0, 1, 1, 2])):  # direct trunk routes to depots in other regions
            other = random.choice([x for x in depots if x[1] != d[1] and not x[5]])
            add(d, other, random.randint(10, 120))
by_name = {d[0]: d for d in depots}
rows = []
for d in depots:
    rows.append([d[0], "", d[1], d[2], d[3], d[4], ""])
for (a, b), w in sorted(routes.items()):
    d = by_name[a]
    rows.append([a, b, d[1], d[2], d[3], d[4], w])
with open("routes.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["Depot", "Linked depot", "Region", "East (km)", "North (km)", "Capacity", "Shipments"])
    w.writerows(rows)
print(len(depots), "depots,", len(routes), "routes,", len(rows), "rows,", sum(routes.values()), "shipments")
