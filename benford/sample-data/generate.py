"""Illustrative supplier payments for the Benford view (invented). payments.csv: 20,000 payments to 120 suppliers
with approver, cost centre, date and amount. Most amounts follow Benford's law (spread over several orders of
magnitude). Planted anomalies: one approver splits invoices to stay just under a 5,000 approval limit (amounts
starting 46 to 49), and one supplier bills many round amounts starting with 7 and 8."""
import csv, random, datetime, math
random.seed(41)
sup = [f"Supplier {i:03d}" for i in range(1, 121)]
appr = [f"Approver {c}" for c in "ABCDEFGH"]
cc = ["Facilities", "IT", "Marketing", "Operations", "Logistics"]
rows = []; d0 = datetime.date(2026, 1, 1)
for i in range(20000):
    s = random.choice(sup); a = random.choice(appr); c = random.choice(cc)
    amt = 10 ** random.uniform(1.3, 5.2)
    if a == "Approver E" and random.random() < 0.22: amt = random.uniform(4600, 4999); s = random.choice(sup[:10])
    if s == "Supplier 077" and random.random() < 0.6: amt = random.choice([700, 750, 800, 850, 7000, 7500, 8000, 8500]) * random.choice([1, 1, 1.0])
    rows.append([f"P{i+1:06d}", s, a, c, (d0 + datetime.timedelta(days=random.randrange(300))).isoformat(), round(amt, 2)])
with open("payments.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Payment ID", "Supplier", "Approver", "Cost centre", "Payment date", "Amount"]); w.writerows(rows)
print(len(rows))
