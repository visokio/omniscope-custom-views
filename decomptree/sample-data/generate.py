"""Illustrative order data for the Decomposition Tree. Not real figures.
orders.csv: 12,000 orders. Planted patterns: London and Online drive revenue; deliveries from the
Leeds warehouse with the carrier QuickShip are much slower than the rest."""
import csv, random
random.seed(11)
regions = {"London": 1.6, "South East": 1.2, "North West": 1.0, "Midlands": 0.9, "Scotland": 0.7, "Wales": 0.5, "North East": 0.6}
channels = {"Online": 1.5, "Store": 1.0, "Marketplace": 0.6, "Phone": 0.3}
cats = {"Electronics": 2.2, "Home": 1.3, "Garden": 0.9, "Fashion": 1.1, "Toys": 0.6, "Grocery": 0.5}
ctypes = ["New", "Returning", "Loyalty member"]
carriers = ["QuickShip", "ParcelPro", "RoyalPost", "SwiftVan"]
warehouses = ["Leeds", "Milton Keynes", "Bristol", "Glasgow"]
def pick(d): return random.choices(list(d), weights=list(d.values()))[0]
with open("orders.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Order ID", "Region", "Channel", "Category", "Customer type", "Carrier", "Warehouse", "Revenue (GBP)", "Margin (GBP)", "Delivery days", "Late"])
    for i in range(12000):
        r, ch, c = pick(regions), pick(channels), pick(cats)
        rev = round(random.lognormvariate(3.6, 0.6) * cats[c] * (1.25 if ch == "Online" else 1), 2)
        car, wh = random.choice(carriers), random.choice(warehouses)
        days = max(1, round(random.gauss(2.4, 0.8) + (3.5 if (car == "QuickShip" and wh == "Leeds") else 0) + (0.6 if r == "Scotland" else 0)))
        w.writerow([f"O{i:06d}", r, ch, c, random.choices(ctypes, weights=[3, 5, 2])[0], car, wh, rev, round(rev * random.uniform(0.12, 0.38), 2), days, "Yes" if days > 4 else "No"])
