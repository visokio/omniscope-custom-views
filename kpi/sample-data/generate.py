"""Illustrative order data for the KPI view (invented). orders.csv: 400 orders from one year, with region, product,
channel, sales value, units and the discount given."""
import csv, random
random.seed(7)
regions = {"North": 0.8, "South": 1.2, "East": 1.0, "West": 0.9}
products = {"Widgets": 42.0, "Gizmos": 18.5, "Sprockets": 64.0, "Doohickeys": 9.9}
channels = ["Online", "Store", "Partner"]
rows = []
for i in range(400):
    region = random.choice(list(regions))
    product = random.choice(list(products))
    channel = random.choices(channels, weights=[5, 3, 2])[0]
    units = max(1, int(random.gauss(12, 6) * regions[region]))
    discount = round(max(0.0, random.gauss(6 if channel == "Partner" else 3, 2)), 1)
    sales = round(units * products[product] * (1 - discount / 100), 2)
    month = random.randint(1, 12)
    rows.append([f"2025-{month:02d}-{random.randint(1, 28):02d}", region, product, channel, units, sales, discount])
rows.sort()
with open("orders.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["Order date", "Region", "Product", "Channel", "Units", "Sales", "Discount (%)"])
    w.writerows(rows)
print(len(rows), round(sum(r[5] for r in rows), 2))
