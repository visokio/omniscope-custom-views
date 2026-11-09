"""Illustrative brand market share for the Slope Chart view (invented brands). brand_sales.csv: yearly sales
for 14 brands in 2022 to 2026 by channel. Two challengers grow fast, one leader slips, the rest drift."""
import csv, random
random.seed(6)
brands = {"Northwind": (120, -.03), "Aurora": (95, .01), "Bluebell": (80, .0), "Cobalt": (70, .14), "Driftwood": (64, -.06), "Ember": (52, .02), "Fjord": (45, .2),
          "Granite": (40, -.02), "Harbour": (33, .04), "Iris": (30, -.08), "Juniper": (26, .03), "Kestrel": (22, .1), "Lumen": (18, -.01), "Meadow": (15, .0)}
rows = []
for b, (base, g) in brands.items():
    for y in range(2022, 2027):
        for ch, w in (("Online", .45), ("Stores", .4), ("Wholesale", .15)):
            v = base * 1000 * w * (1 + g) ** (y - 2022) * random.gauss(1, .03) * (1.15 if ch == "Online" and b in ("Cobalt", "Fjord") else 1)
            rows.append([b, y, ch, round(v, 2)])
with open("brand_sales.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Brand", "Year", "Channel", "Sales"]); w.writerows(rows)
print(len(rows))
