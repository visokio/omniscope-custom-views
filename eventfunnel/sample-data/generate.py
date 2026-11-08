"""Illustrative web shop event log for the Event Funnel view (invented). events.csv: about 8,000 visitors in
October 2026 and their events (visited, searched, viewed product, added to basket, started checkout, purchased,
viewed help), with channel and device. Email visitors convert best; mobile loses many at checkout."""
import csv, random, datetime
random.seed(17)
rows = []; t0 = datetime.datetime(2026, 10, 1)
P = {"Search": [.78, .45, .55, .62], "Social": [.6, .3, .45, .5], "Email": [.85, .55, .65, .7]}
for u in range(8000):
    uid = f"U{u+1:05d}"; ch = random.choices(list(P), weights=[5, 3, 2])[0]; dev = random.choices(["Mobile", "Desktop"], weights=[6, 4])[0]
    t = t0 + datetime.timedelta(minutes=random.randrange(31 * 24 * 60))
    ev = lambda name, dt: rows.append([uid, name, (t + dt).strftime("%Y-%m-%dT%H:%M:%S"), ch, dev])
    ev("Visited site", datetime.timedelta(0)); s = datetime.timedelta(0)
    if random.random() < .35: s += datetime.timedelta(seconds=random.randrange(20, 200)); ev("Searched", s)
    steps = ["Viewed product", "Added to basket", "Started checkout", "Purchased"]
    for i, name in enumerate(steps):
        p = P[ch][i] * (0.7 if dev == "Mobile" and name == "Purchased" else 1)
        if random.random() > p: break
        s += datetime.timedelta(seconds=int(random.lognormvariate(4.5 + i * .4, .8)))
        if name == "Started checkout" and random.random() < .15: s += datetime.timedelta(days=random.randrange(1, 9))  # comes back later
        if random.random() < .1: ev("Viewed help", s - datetime.timedelta(seconds=5))
        ev(name, s)
        if name == "Viewed product" and random.random() < .4: ev("Viewed product", s + datetime.timedelta(seconds=40))
rows.sort(key=lambda r: (r[2], r[0]))
with open("events.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Visitor", "Event", "Time", "Channel", "Device"]); w.writerows(rows)
print(len(rows))
