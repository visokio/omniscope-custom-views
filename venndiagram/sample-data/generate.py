"""Illustrative customer data for the Venn Diagram view (invented). customers.csv: 600 customers of an online
shop, with their orders in the last 12 months, average basket value and days since their last order."""
import csv, random
random.seed(11)
segments = ["Consumer", "Small business", "Trade"]
regions = ["North", "South", "East", "West"]
rows = []
for i in range(600):
    segment = random.choices(segments, weights=[6, 3, 1])[0]
    engaged = random.random()
    orders = max(0, int(random.gauss(4 + 10 * engaged, 3)))
    basket = round(random.lognormvariate(3.9 + (0.5 if segment == "Trade" else 0), 0.45), 2)
    days = int(random.expovariate(1 / (15 + 120 * (1 - engaged)))) if orders else random.randint(366, 700)
    rows.append([f"C{1001 + i}", random.choice(regions), segment, orders, basket, days])
with open("customers.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["Customer", "Region", "Segment", "Orders (12 months)", "Average basket", "Days since last order"])
    w.writerows(rows)
a = {r[0] for r in rows if r[3] > 10}
b = {r[0] for r in rows if r[4] > 80}
c = {r[0] for r in rows if r[5] <= 30}
print(len(rows), "A", len(a), "B", len(b), "C", len(c), "ABC", len(a & b & c), "none", len(rows) - len(a | b | c))
