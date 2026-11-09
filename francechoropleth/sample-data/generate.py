"""Illustrative order data for the France Choropleth view (invented). orders.csv: 2,000 orders of a fictional
retailer in 2025, one row per order, with the department (official name and INSEE code), its region, the sales
channel, the order value and a satisfaction score from 1 to 5. Department names and codes are read from
../regions_fr.json; the figures are random."""
import csv, json, os, random

random.seed(11)
HERE = os.path.dirname(os.path.abspath(__file__))
REGIONS = {
    "Auvergne-Rhône-Alpes": "01 03 07 15 26 38 42 43 63 69 73 74",
    "Bourgogne-Franche-Comté": "21 25 39 58 70 71 89 90",
    "Bretagne": "22 29 35 56",
    "Centre-Val de Loire": "18 28 36 37 41 45",
    "Corse": "2A 2B",
    "Grand Est": "08 10 51 52 54 55 57 67 68 88",
    "Hauts-de-France": "02 59 60 62 80",
    "Île-de-France": "75 77 78 91 92 93 94 95",
    "Normandie": "14 27 50 61 76",
    "Nouvelle-Aquitaine": "16 17 19 23 24 33 40 47 64 79 86 87",
    "Occitanie": "09 11 12 30 31 32 34 46 48 65 66 81 82",
    "Pays de la Loire": "44 49 53 72 85",
    "Provence-Alpes-Côte d'Azur": "04 05 06 13 83 84",
    "Outre-mer": "971 972 973 974 976",
}
region_of = {code: r for r, codes in REGIONS.items() for code in codes.split()}
with open(os.path.join(HERE, "..", "regions_fr.json")) as f:
    depts = [(d["code"], d["name"]) for d in json.load(f)["departments"]]
assert sorted(region_of) == sorted(c for c, _ in depts), "region table does not cover every department"

# Each department gets a weight (how many orders it sends) and a typical basket; a few large cities weigh more.
big = {"75": 6, "13": 4, "69": 4, "59": 4, "33": 3, "31": 3, "92": 3, "44": 2.5, "06": 2.5, "67": 2}
weight = {c: big.get(c, 1) * random.uniform(0.4, 1.6) for c, _ in depts}
basket = {c: random.uniform(45, 110) for c, _ in depts}
codes = [c for c, _ in depts]
names = dict(depts)
channels = ["Online", "Store", "Phone"]
rows = []
for i in range(2000):
    c = random.choices(codes, weights=[weight[x] for x in codes])[0]
    ch = random.choices(channels, weights=[5, 4, 1])[0]
    sales = round(max(5.0, random.gauss(basket[c], basket[c] * 0.35)), 2)
    score = min(5, max(1, round(random.gauss(3.9 if ch != "Phone" else 3.4, 0.8))))
    date = f"2025-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}"
    rows.append([date, names[c], c, region_of[c], ch, sales, score])
rows.sort()
with open(os.path.join(HERE, "orders.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["Order date", "Department", "Department code", "Region", "Channel", "Sales", "Satisfaction"])
    w.writerows(rows)
print(len(rows), "orders,", len({r[2] for r in rows}), "departments, total", round(sum(r[5] for r in rows), 2))
