"""Illustrative orders for the Cohort Retention view. Not real customers or figures.
orders.csv: customers acquired monthly from January 2025 to June 2026. Monthly retention decays from
about 45% to about 15%; customers acquired from October 2025 (when an illustrative loyalty scheme starts)
retain about 9 points better, and Referral customers retain better than Paid social."""
import csv, random, math, datetime
random.seed(21)
chan = {"Paid social": -0.06, "Search": 0.0, "Email": 0.03, "Referral": 0.08}
rows = []
cid = 0
for m in range(18):
    y, mo = 2025 + (m // 12), m % 12 + 1
    for _ in range(random.randint(200, 280)):
        cid += 1; ch = random.choices(list(chan), weights=[4, 4, 2, 1.5])[0]
        lift = (0.09 if m >= 9 else 0) + chan[ch]
        for k in range(0, 18 - m):
            r = 1.0 if k == 0 else max(0.02, 0.33 * math.exp(-0.22 * (k - 1)) + 0.12 + lift)
            if random.random() < r:
                yy, mm = y + (mo - 1 + k) // 12, (mo - 1 + k) % 12 + 1
                for _ in range(1 if random.random() < 0.75 else 2):
                    day = random.randint(1, 28)
                    rows.append([f"C{cid:05d}", f"{yy}-{mm:02d}-{day:02d}", round(random.lognormvariate(3.4, 0.45), 2), ch])
random.shuffle(rows)
with open("orders.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Customer ID", "Order date", "Order value (GBP)", "Channel"]); w.writerows(rows)
