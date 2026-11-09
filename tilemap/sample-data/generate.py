"""Illustrative data for the Tile Map view (invented). us_sales.csv: 2026 sales, customers and growth by US
state (full state names) and month. uk_regions.csv: a customer satisfaction score and response count by UK
region and quarter."""
import csv, random
random.seed(14)
states = {"Alabama": 5, "Alaska": .7, "Arizona": 7.4, "Arkansas": 3, "California": 39, "Colorado": 5.9, "Connecticut": 3.6, "Delaware": 1, "District of Columbia": .7,
 "Florida": 22, "Georgia": 11, "Hawaii": 1.4, "Idaho": 1.9, "Illinois": 12.5, "Indiana": 6.8, "Iowa": 3.2, "Kansas": 2.9, "Kentucky": 4.5, "Louisiana": 4.6, "Maine": 1.4,
 "Maryland": 6.2, "Massachusetts": 7, "Michigan": 10, "Minnesota": 5.7, "Mississippi": 2.9, "Missouri": 6.2, "Montana": 1.1, "Nebraska": 2, "Nevada": 3.2, "New Hampshire": 1.4,
 "New Jersey": 9.3, "New Mexico": 2.1, "New York": 19.6, "North Carolina": 10.7, "North Dakota": .8, "Ohio": 11.8, "Oklahoma": 4, "Oregon": 4.2, "Pennsylvania": 13,
 "Rhode Island": 1.1, "South Carolina": 5.3, "South Dakota": .9, "Tennessee": 7, "Texas": 30, "Utah": 3.4, "Vermont": .6, "Virginia": 8.7, "Washington": 7.8,
 "West Virginia": 1.8, "Wisconsin": 5.9, "Wyoming": .6}
west = {"California", "Washington", "Oregon", "Nevada", "Arizona", "Utah", "Colorado", "Idaho", "Texas"}
rows = []
for s, pop in states.items():
    g = random.gauss(0.12 if s in west else 0.04, 0.05)
    for m in range(1, 11):
        sales = pop * 21000 * random.gauss(1, .08) * (1 + g * m / 10)
        rows.append([s, f"2026-{m:02d}-01", round(sales, 2), round(sales / random.uniform(180, 260))])
with open("us_sales.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["State", "Month", "Sales", "Customers"]); w.writerows(rows)
regions = {"Scotland": 7.9, "Northern Ireland": 7.6, "North East": 7.2, "North West": 7.4, "Yorkshire and The Humber": 7.3, "East Midlands": 7.5, "West Midlands": 7.1,
           "Wales": 7.8, "East of England": 7.6, "London": 6.8, "South East": 7.7, "South West": 8.1}
uk = []
for r, base in regions.items():
    for q in ("2026 Q1", "2026 Q2", "2026 Q3"):
        n = random.randint(300, 1400) * (3 if r == "London" else 1)
        uk.append([r, q, round(random.gauss(base, .12), 2), n])
with open("uk_regions.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Region", "Quarter", "Satisfaction", "Responses"]); w.writerows(uk)
print(len(rows), len(uk))
