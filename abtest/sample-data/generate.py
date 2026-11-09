"""Illustrative checkout experiment for the A/B Test view (invented). checkout_test.csv: 36,000 visitors
randomly assigned to three checkout designs over four weeks, with device, visitor type, whether they
converted (1/0) and order value. The one-page checkout lifts conversion, mostly on mobile; express pay
makes little difference."""
import csv, random, datetime
random.seed(29)
rows = []; d0 = datetime.date(2026, 9, 7)
base = {"Mobile": .082, "Desktop": .128, "Tablet": .10}
lift = {"A: current checkout": {"Mobile": 1, "Desktop": 1, "Tablet": 1}, "B: one-page checkout": {"Mobile": 1.22, "Desktop": 1.04, "Tablet": 1.1}, "C: express pay": {"Mobile": 1.04, "Desktop": 1.0, "Tablet": 1.02}}
for i in range(36000):
    v = random.choice(list(lift)); dev = random.choices(list(base), weights=[55, 37, 8])[0]; vt = random.choices(["New", "Returning"], weights=[6, 4])[0]
    p = base[dev] * lift[v][dev] * (1.25 if vt == "Returning" else .85)
    conv = 1 if random.random() < p else 0
    val = round(random.lognormvariate(4.1, .45) * (1.15 if dev == "Desktop" else 1), 2) if conv else 0
    rows.append([f"V{i+1:06d}", v, dev, vt, (d0 + datetime.timedelta(days=random.randrange(28))).isoformat(), conv, val])
with open("checkout_test.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Visitor ID", "Variant", "Device", "Visitor type", "First visit", "Converted", "Order value"]); w.writerows(rows)
import collections
c = collections.defaultdict(lambda: [0, 0])
for r in rows: c[r[1]][0] += 1; c[r[1]][1] += r[5]
for k, (n, s) in sorted(c.items()): print(k, n, s, round(s / n, 4))
