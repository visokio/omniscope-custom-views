"""Illustrative order data (invented) for the workflow control views' tests and demo project.
orders.csv: 240 orders over two years, with region, product, units and sales value. With --upload, also
new-orders.csv: 30 further orders, the kind of file a viewer would upload."""
import csv, random, sys

random.seed(11)
regions = {"North": 0.8, "South": 1.2, "East": 1.0, "West": 0.9}
products = {"Widgets": 42.0, "Gizmos": 18.5, "Sprockets": 64.0}


def orders(n, year_from, start_id):
    rows = []
    for i in range(n):
        region = random.choice(list(regions))
        product = random.choice(list(products))
        units = max(1, int(random.gauss(10, 5) * regions[region]))
        year = random.choice([year_from, year_from + 1])
        rows.append([f"{year}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}", year, region, product, units,
                     round(units * products[product], 2)])
    rows.sort()
    return [[f"O{start_id + i:04d}"] + r for i, r in enumerate(rows)]


def write(name, rows):
    with open(name, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["Order ID", "Order date", "Year", "Region", "Product", "Units", "Sales"])
        w.writerows(rows)
    print(name, len(rows), round(sum(r[-1] for r in rows), 2))


write("orders.csv", orders(240, 2024, 1))
if "--upload" in sys.argv:
    write("new-orders.csv", orders(30, 2025, 241))
