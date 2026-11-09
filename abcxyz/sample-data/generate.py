"""Illustrative SKU demand for the ABC-XYZ view (invented). sku_demand.csv: monthly units and revenue for about
1,200 products in five categories, Nov 2024 to Oct 2026. Value follows a long tail (a few products carry most
revenue); demand ranges from steady (staples) through seasonal to sporadic (spares, slow movers). Months with
no sales have no row."""
import csv, random, math, datetime
random.seed(31)
cats = {"Fasteners": (0.2, 3), "Electrical": (0.5, 12), "Tools": (0.8, 45), "Safety": (0.6, 18), "Spares": (1.8, 60)}
months = []; d = datetime.date(2024, 11, 1)
for i in range(24): months.append(d); d = datetime.date(d.year + (d.month == 12), d.month % 12 + 1, 1)
rows = []
for k in range(1200):
    cat = random.choices(list(cats), weights=[3, 3, 2, 2, 2])[0]; noise, price = cats[cat]
    sku = f"SKU-{k+1:05d}"; level = 400 * random.paretovariate(1.25) / 4; p = price * random.lognormvariate(0, .5)
    kind = random.random(); seasonal = cat == "Safety" and kind < .5
    for i, m in enumerate(months):
        if cat == "Spares" or kind > .85:  # intermittent demand
            u = round(level * random.expovariate(1) * 3) if random.random() < .25 else 0
        else:
            sea = 1 + (.6 * math.sin(2 * math.pi * (m.month - 3) / 12) if seasonal else 0)
            u = max(0, round(random.gauss(level * sea, level * noise * .5)))
        if u > 0: rows.append([sku, cat, m.isoformat(), u, round(u * p, 2)])
with open("sku_demand.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["SKU", "Category", "Month", "Units", "Revenue"]); w.writerows(rows)
print(len(rows))
