"""Illustrative store data for the Beeswarm view (invented). stores.csv: 160 shops of a retail chain, with their
region, format, sales growth on the previous year (%) and average customer satisfaction score (out of 10)."""
import csv, random
random.seed(5)
regions = {"North": -1.0, "Midlands": 0.5, "South": 2.5, "Wales": -0.5, "Scotland": 1.0}
formats = {"High street": -2.0, "Retail park": 2.0, "Outlet": 0.0}
towns = ["Ashford", "Barton", "Calder", "Dunmore", "Eastwick", "Fenley", "Glenroy", "Hartwell", "Ivybridge", "Kirkby",
         "Langley", "Merton", "Newbold", "Oakham", "Penrith", "Quarry Bank", "Redhill", "Stanton", "Thornbury", "Upton"]
rows = []
for i in range(160):
    region = random.choice(list(regions))
    fmt = random.choices(list(formats), weights=[5, 3, 2])[0]
    growth = round(random.gauss(1.5 + regions[region] + formats[fmt], 3.2), 1)
    score = round(min(10, max(4, random.gauss(7.4 + growth / 12, 0.7))), 1)
    rows.append([f"{towns[i % len(towns)]} {i // len(towns) + 1}", region, fmt, growth, score])
with open("stores.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["Store", "Region", "Format", "Sales growth (%)", "Customer score"])
    w.writerows(rows)
print(len(rows), min(r[3] for r in rows), max(r[3] for r in rows))
