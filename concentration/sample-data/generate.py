"""Illustrative customer revenue for the Concentration view (invented). customers.csv: 2,400 B2B customers with
annual revenue by segment and region. Enterprise revenue is highly concentrated in a few accounts; small
business revenue is spread more evenly."""
import csv, random
random.seed(52)
rows = []
for i in range(2400):
    seg = random.choices(["Enterprise", "Mid-market", "Small business"], weights=[1, 3, 8])[0]
    a = {"Enterprise": 1.05, "Mid-market": 1.6, "Small business": 2.6}[seg]
    scale = {"Enterprise": 40000, "Mid-market": 9000, "Small business": 1500}[seg]
    rev = scale * random.paretovariate(a)
    rows.append([f"CUST-{i+1:05d}", seg, random.choice(["North", "South", "East", "West"]), round(min(rev, scale * 400), 2)])
with open("customers.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Customer", "Segment", "Region", "Revenue"]); w.writerows(rows)
print(len(rows))
