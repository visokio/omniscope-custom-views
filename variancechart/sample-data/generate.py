"""Illustrative sales against budget for the Variance Chart view (invented). sales_budget.csv: monthly sales,
budget and prior-year sales for 2026 by region, product line and channel, plus operating costs and their
budget. North and Online run ahead of budget, Scotland and Wholesale behind; costs overrun in the summer."""
import csv, random, datetime
random.seed(5)
regions = {"London": 1.25, "South East": 1.0, "Midlands": .85, "North": .9, "Scotland": .7, "Wales": .45}
lines = {"Furniture": 1.0, "Lighting": .55, "Textiles": .4, "Kitchen": .75, "Garden": .5}
channels = {"Stores": .55, "Online": .35, "Wholesale": .10}
perf_r = {"London": 1.02, "South East": .99, "Midlands": 1.0, "North": 1.09, "Scotland": .88, "Wales": 1.03}
perf_l = {"Furniture": .97, "Lighting": 1.06, "Textiles": 1.0, "Kitchen": 1.04, "Garden": .93}
perf_c = {"Stores": .98, "Online": 1.10, "Wholesale": .84}
season = [.8, .78, .9, .95, 1.05, 1.1, 1.05, 1.0, .95, 1.0, 1.15, 1.35]
rows = []
for m in range(12):
    month = datetime.date(2026, m + 1, 1)
    for r, rw in regions.items():
        for l, lw in lines.items():
            for c, cw in channels.items():
                bud = 42000 * rw * lw * cw * season[m] * (1.3 if l == "Garden" and 3 <= m <= 7 else 1)
                act = bud * perf_r[r] * perf_l[l] * perf_c[c] * random.gauss(1, .06) * (1.04 if m >= 8 else 1)
                py = bud / random.uniform(1.03, 1.09)
                cost_b = bud * .62; cost = cost_b * random.gauss(1, .04) * (1.08 if 5 <= m <= 7 else 1)
                rows.append([month.isoformat(), r, l, c, round(act, 2), round(bud, 2), round(py, 2), round(cost, 2), round(cost_b, 2)])
with open("sales_budget.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Month", "Region", "Product line", "Channel", "Sales", "Budget", "Prior year", "Costs", "Cost budget"]); w.writerows(rows)
print(len(rows), "rows; sales", round(sum(r[4] for r in rows)), "budget", round(sum(r[5] for r in rows)))
