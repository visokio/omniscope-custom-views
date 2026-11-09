"""Illustrative subscription customers for the Survival Curve view (invented). subscriptions.csv: 4,000
customers who started between Nov 2024 and Oct 2026, with plan, channel, region, start date and end date
(blank while still subscribed, as of 31 Oct 2026). Monthly plans churn steadily, annual plans mostly at
renewal (12 and 24 months), and customers acquired through a discount partner churn faster."""
import csv, random, datetime, math
random.seed(11)
asof = datetime.date(2026, 10, 31); start0 = datetime.date(2024, 11, 1)
rows = []
for i in range(4000):
    plan = random.choices(["Monthly", "Annual", "Family"], weights=[5, 3, 2])[0]
    ch = random.choices(["Direct", "Partner", "Discount site"], weights=[5, 3, 2])[0]
    reg = random.choice(["North", "South", "Midlands", "Scotland", "Wales"])
    s = start0 + datetime.timedelta(days=random.randrange((asof - start0).days))
    mult = {"Direct": 1.0, "Partner": 1.1, "Discount site": 1.8}[ch]
    if plan == "Monthly":
        life = random.expovariate(mult / 330)  # days
        if random.random() < .12 * mult: life = random.uniform(20, 45)  # trial drop-off
    elif plan == "Family":
        life = random.expovariate(mult / 700)
    else:
        life = None; t = 0
        while life is None:
            t += 365
            if random.random() < .30 * mult: life = t + random.uniform(-10, 20)
            elif t > 2000: life = 9999
        if random.random() < .04: life = random.uniform(30, 300)  # early cancellations
    end = s + datetime.timedelta(days=max(1, int(life)))
    rows.append([f"C{i+1:05d}", plan, ch, reg, s.isoformat(), end.isoformat() if end <= asof else ""])
with open("subscriptions.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Customer ID", "Plan", "Channel", "Region", "Start date", "End date"]); w.writerows(rows)
print(len(rows), sum(1 for r in rows if r[5]), "ended")
