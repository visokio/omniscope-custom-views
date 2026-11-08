"""Illustrative online-retail orders for the RFM Segments view (invented). orders.csv: about 3,000 customers
and their orders from Nov 2024 to Oct 2026, with order value, region and acquisition channel. Customers join
throughout the period, buy at their own rate and some stop buying (churn), so every RFM segment is populated."""
import csv, random, datetime
random.seed(19)
d0, d1 = datetime.date(2024, 11, 1), datetime.date(2026, 10, 31)
span = (d1 - d0).days
rows = []; oid = 100000
for c in range(3000):
    cid = f"CU-{c+1:05d}"; region = random.choices(["London", "South", "Midlands", "North", "Scotland"], weights=[3, 3, 2, 3, 1])[0]
    ch = random.choices(["Search", "Social", "Email", "Referral"], weights=[4, 3, 2, 1])[0]
    join = d0 + datetime.timedelta(days=int(span * random.random() ** 0.8))
    rate = random.lognormvariate(-3.4, 0.9)  # orders per day
    basket = random.lognormvariate(3.7, 0.5) * (1.3 if ch == "Referral" else 1)
    stop = join + datetime.timedelta(days=int(random.expovariate(1 / 420))) if random.random() < 0.55 else d1
    t = join
    while t <= min(stop, d1):
        oid += 1; rows.append([f"O{oid}", cid, t.isoformat(), round(basket * random.lognormvariate(0, 0.35), 2), region, ch])
        t += datetime.timedelta(days=max(1, int(random.expovariate(rate))))
rows.sort(key=lambda r: r[2])
with open("orders.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Order ID", "Customer ID", "Order date", "Order value", "Region", "Channel"]); w.writerows(rows)
print(len(rows), "orders", len(set(r[1] for r in rows)), "customers")
