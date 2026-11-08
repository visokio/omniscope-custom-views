"""Illustrative sales for the Bubble Chart view (invented). sales.csv: 900 order lines of an outdoor equipment shop,
with the product, its category, the sales channel, the revenue (in pounds) and the units sold."""
import csv, random
random.seed(11)
catalogue = {
    "Tents": [("Ridge 2 tent", 240), ("Dome 4 tent", 380), ("Tunnel 6 tent", 520), ("Bivvy bag", 95)],
    "Sleeping": [("Down sleeping bag", 210), ("Summer sleeping bag", 70), ("Air mattress", 85), ("Camp pillow", 18),
                 ("Foam mat", 25)],
    "Clothing": [("Waterproof jacket", 160), ("Fleece", 55), ("Walking trousers", 60), ("Base layer", 35),
                 ("Wool socks", 14), ("Sun hat", 20)],
    "Footwear": [("Walking boots", 140), ("Trail shoes", 110), ("Sandals", 45), ("Gaiters", 30)],
    "Cooking": [("Gas stove", 65), ("Pan set", 40), ("Water filter", 50), ("Mug", 9), ("Cool box", 75)],
    "Navigation": [("Compass", 25), ("GPS handheld", 280), ("Head torch", 35), ("Map case", 15)],
}
popularity = {"Tents": 0.7, "Sleeping": 1.0, "Clothing": 1.6, "Footwear": 1.1, "Cooking": 0.9, "Navigation": 0.6}
products = [(c, p, price) for c, items in catalogue.items() for p, price in items]
weights = [popularity[c] * random.uniform(0.4, 1.6) for c, _, _ in products]
rows = []
for i in range(900):
    cat, prod, price = random.choices(products, weights=weights)[0]
    channel = random.choices(["Online", "Shop"], weights=[3, 2])[0]
    units = 1 + int(random.expovariate(0.7)) if price < 50 else random.choice([1, 1, 1, 2])
    revenue = round(units * price * random.uniform(0.85, 1.0), 2)
    rows.append([f"O{10001 + i}", prod, cat, channel, units, revenue])
with open("sales.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["Order", "Product", "Category", "Channel", "Units", "Revenue"])
    w.writerows(rows)
print(len(rows), "rows,", len({r[1] for r in rows}), "products, revenue", round(sum(r[5] for r in rows), 2))
