"""Illustrative sales for the Custom View Demo (invented). sales.csv: 300 sales of a fictional bakery chain,
with shop, product, quarter, quantity and value."""
import csv, random

random.seed(2)
shops = ["Harbour Street", "Market Square", "Station Road", "Mill Lane"]
products = {"Sourdough": 4.2, "Croissant": 1.8, "Bagel": 1.5, "Rye loaf": 3.9, "Cinnamon bun": 2.6, "Baguette": 2.1}
popularity = [5, 6, 3, 2, 4, 4]
rows = []
for i in range(300):
    shop = random.choice(shops)
    product = random.choices(list(products), weights=popularity)[0]
    qty = random.randint(5, 40)
    rows.append([shop, product, f"Q{random.randint(1, 4)}", qty, round(qty * products[product], 2)])
rows.sort()
with open("sales.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["Shop", "Product", "Quarter", "Quantity", "Sales"])
    w.writerows(rows)
totals = {}
for r in rows:
    totals[r[1]] = round(totals.get(r[1], 0) + r[4], 2)
print(len(rows), "sales", totals)
