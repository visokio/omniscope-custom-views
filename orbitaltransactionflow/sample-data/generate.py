"""Illustrative intercompany transfers for the Orbital Transaction Flow view (invented).
transfers.csv: 240 payments over one working day between a group's central treasury and eight subsidiaries.
Subsidiaries sweep surplus cash to the treasury, the treasury funds them, and a few pay each other directly."""
import csv, random
from datetime import datetime, timedelta
random.seed(11)
TREASURY = "Group treasury"
subs = {"UK Retail": 1.6, "UK Wholesale": 1.0, "Ireland": 0.5, "France": 1.2, "Germany": 1.4, "Spain": 0.7,
        "Nordics": 0.6, "Benelux": 0.8}
names = list(subs)
start = datetime(2026, 3, 2, 8, 0)
rows = []
for i in range(240):
    t = start + timedelta(minutes=random.uniform(0, 600))
    kind = random.choices(["sweep", "fund", "inter"], weights=[5, 3, 2])[0]
    if kind == "sweep":
        s = random.choices(names, weights=list(subs.values()))[0]; frm, to = s, TREASURY
        amount = random.lognormvariate(10.6, 0.6) * subs[s]
    elif kind == "fund":
        s = random.choices(names, weights=[1 / v for v in subs.values()])[0]; frm, to = TREASURY, s
        amount = random.lognormvariate(10.3, 0.5)
    else:
        frm, to = random.sample(names, 2)
        amount = random.lognormvariate(9.4, 0.7)
    rows.append([t, frm, to, round(amount, 2)])
rows.sort(key=lambda r: r[0])
with open("transfers.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["Transfer ID", "Time", "From", "To", "Amount (£)"])
    for i, (t, frm, to, a) in enumerate(rows):
        w.writerow([f"TR-{1001 + i}", t.strftime("%Y-%m-%dT%H:%M:%S"), frm, to, a])
print(len(rows), round(sum(r[3] for r in rows), 2))
