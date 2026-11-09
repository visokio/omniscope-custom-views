"""Illustrative sales for the Price Volume Mix bridge: an invented food and drink manufacturer.
sales.csv: monthly units and revenue by product and region for 2023 to 2025. From 2024 to 2025 prices rise
about 4%, total units dip, the mix shifts towards premium lines, three products launch and two are dropped."""
import csv, random
random.seed(6)
cats = {"Premium": (6.5, 0.9), "Core": (3.2, 2.5), "Value": (1.6, 3.0), "Snacks": (2.2, 1.6)}
products = []
for c, (price, vol) in cats.items():
    for i in range(6 if c != "Snacks" else 4):
        products.append({"name": f"{c} {['Oat', 'Berry', 'Citrus', 'Cocoa', 'Ginger', 'Honey'][i]}", "cat": c, "p": price * random.uniform(0.8, 1.25), "v": vol * random.uniform(0.6, 1.4)})
products += [{"name": n, "cat": c, "p": p, "v": v, "launch": 2025} for n, c, p, v in [("Premium Matcha", "Premium", 7.4, 0.5), ("Core Protein", "Core", 3.9, 0.9), ("Snacks Seed Bar", "Snacks", 2.6, 0.8)]]
products[13]["end"] = 2024; products[19]["end"] = 2024
regions = {"North": 1.0, "South": 1.2, "London": 0.9, "Scotland": 0.5, "Wales": 0.3}
with open("sales.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Year", "Month", "Product", "Category", "Region", "Units", "Revenue (GBP)"])
    for y in (2023, 2024, 2025):
        for p in products:
            if p.get("launch", 0) > y or p.get("end", 9999) < y: continue
            pf = 1 + {2023: -0.03, 2024: 0, 2025: 0.04}[y] * random.uniform(0.6, 1.4)
            vf = {2023: 1.0, 2024: 1.0, 2025: (1.10 if p["cat"] == "Premium" else 0.93)}[y]
            for m in range(1, 13):
                for r, rw in regions.items():
                    u = max(0, round(p["v"] * 1000 * rw * vf * random.uniform(0.85, 1.15)))
                    w.writerow([str(y), f"{y}-{m:02d}", p["name"], p["cat"], r, u, round(u * p["p"] * pf * random.uniform(0.98, 1.02), 2)])
