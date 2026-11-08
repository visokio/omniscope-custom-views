"""Illustrative orders for the Running Pivot view (invented). orders.csv: 1,200 orders of a fictional
garden-supplies company in 2025, with the order date, region, channel, units and sales value. Sales rise
towards the spring and summer."""
import csv, random

random.seed(4)
regions = {"North": 0.8, "Midlands": 1.0, "South": 1.3, "Wales": 0.5}
season = [0.5, 0.6, 1.0, 1.5, 1.8, 1.7, 1.5, 1.2, 0.9, 0.7, 0.6, 1.0]
rows = []
for i in range(1200):
    month = random.choices(range(1, 13), weights=season)[0]
    region = random.choices(list(regions), weights=list(regions.values()))[0]
    channel = random.choices(["Online", "Garden centre"], weights=[3, 2])[0]
    units = random.randint(1, 12)
    rows.append([f"2025-{month:02d}-{random.randint(1, 28):02d}", region, channel, units,
                 round(units * random.uniform(8, 30), 2)])
rows.sort()
with open("orders.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["Order date", "Region", "Channel", "Units", "Sales"])
    w.writerows(rows)
print(len(rows), "orders, sales", round(sum(r[4] for r in rows), 2), "units", sum(r[3] for r in rows))
for reg in regions:
    print(reg, sum(r[3] for r in rows if r[1] == reg))
