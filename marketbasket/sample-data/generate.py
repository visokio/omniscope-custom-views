"""Illustrative grocery baskets for the Market Basket view (invented). baskets.csv: about 6,000 baskets,
one row per product line, with department, store and date. Planted associations: pasta with sauce and
parmesan, burgers with buns and ketchup, tortilla chips with salsa, nappies with baby wipes, wine with
cheese, tea with biscuits; plus everyday items (milk, bread, bananas) that go with everything."""
import csv, random, datetime
random.seed(7)
DEPT = {"Milk": "Dairy", "Cheddar": "Dairy", "Parmesan": "Dairy", "Yoghurt": "Dairy", "Butter": "Dairy", "Eggs": "Dairy",
        "Bread": "Bakery", "Burger buns": "Bakery", "Croissants": "Bakery", "Biscuits": "Bakery",
        "Bananas": "Produce", "Apples": "Produce", "Salad leaves": "Produce", "Tomatoes": "Produce", "Avocados": "Produce", "Onions": "Produce",
        "Pasta": "Grocery", "Pasta sauce": "Grocery", "Ketchup": "Grocery", "Tortilla chips": "Grocery", "Salsa": "Grocery", "Tea": "Grocery", "Coffee": "Grocery", "Cereal": "Grocery",
        "Beef burgers": "Meat", "Chicken breasts": "Meat", "Sausages": "Meat",
        "Red wine": "Drinks", "Beer": "Drinks", "Orange juice": "Drinks", "Sparkling water": "Drinks",
        "Nappies": "Baby & household", "Baby wipes": "Baby & household",
        "Washing-up liquid": "Baby & household", "Kitchen roll": "Baby & household"}
base = {"Milk": .32, "Bread": .28, "Bananas": .24, "Eggs": .14, "Butter": .1, "Apples": .12, "Yoghurt": .1, "Cheddar": .1, "Salad leaves": .09, "Tomatoes": .11,
        "Onions": .1, "Coffee": .07, "Cereal": .08, "Orange juice": .08, "Sparkling water": .07, "Beer": .07, "Chicken breasts": .09, "Sausages": .06,
        "Croissants": .05, "Washing-up liquid": .04, "Kitchen roll": .05, "Avocados": .05, "Tea": .05, "Biscuits": .05, "Pasta": .04, "Red wine": .04,
        "Tortilla chips": .03, "Beef burgers": .03, "Nappies": .02, "Ketchup": .02, "Pasta sauce": .015, "Parmesan": .015, "Salsa": .01, "Burger buns": .01, "Baby wipes": .01}
missions = [(.10, ["Pasta", "Pasta sauce"], ["Parmesan", "Onions", "Red wine"]), (.07, ["Beef burgers", "Burger buns"], ["Ketchup", "Beer", "Salad leaves"]),
            (.06, ["Tortilla chips", "Salsa"], ["Avocados", "Beer"]), (.04, ["Nappies", "Baby wipes"], ["Milk", "Bananas"]),
            (.05, ["Red wine", "Cheddar"], ["Croissants"]), (.06, ["Tea", "Biscuits"], ["Milk"]), (.05, ["Coffee", "Croissants"], ["Orange juice"])]
stores = ["High Street", "Retail Park", "Station"]
rows = []; d0 = datetime.date(2026, 6, 1)
for b in range(6000):
    items = set(i for i, p in base.items() if random.random() < p)
    for p, core, extra in missions:
        if random.random() < p:
            items.update(core); items.update(e for e in extra if random.random() < .45)
    if random.random() < .03: items.discard("Beer")  # a few beer-free trips
    if "Beer" in items and "Nappies" in items and random.random() < .5: items.discard("Beer")
    if not items: items = {random.choice(list(base))}
    st = random.choices(stores, weights=[5, 3, 2])[0]; d = d0 + datetime.timedelta(days=random.randrange(91))
    for i in sorted(items): rows.append([f"B{b+1:05d}", i, DEPT[i], st, d.isoformat()])
with open("baskets.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Basket ID", "Product", "Department", "Store", "Date"]); w.writerows(rows)
print(len(rows), "lines")
