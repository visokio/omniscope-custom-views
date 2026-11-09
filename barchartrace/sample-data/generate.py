"""Illustrative monthly online orders by town for the Bar Chart Race (an invented retailer; figures invented).
orders.csv: 30 UK towns, July 2023 to June 2026, with region. Some towns grow faster after a local campaign."""
import csv, random, math
random.seed(17)
towns = {"Leeds": "North", "Manchester": "North", "Sheffield": "North", "Newcastle": "North", "York": "North", "Liverpool": "North",
         "Birmingham": "Midlands", "Nottingham": "Midlands", "Leicester": "Midlands", "Coventry": "Midlands", "Derby": "Midlands",
         "Bristol": "South West", "Exeter": "South West", "Bath": "South West", "Plymouth": "South West",
         "Brighton": "South East", "Reading": "South East", "Oxford": "South East", "Southampton": "South East", "Milton Keynes": "South East",
         "Camden": "London", "Hackney": "London", "Croydon": "London", "Islington": "London",
         "Glasgow": "Scotland", "Edinburgh": "Scotland", "Aberdeen": "Scotland", "Cardiff": "Wales", "Swansea": "Wales", "Belfast": "Northern Ireland"}
rows = []
for t, reg in towns.items():
    base = random.uniform(80, 400); g = random.uniform(0.005, 0.03); jump = random.choice([0, 0, 0, random.randint(10, 26)])
    for m in range(36):
        y, mo = 2023 + (6 + m) // 12, (6 + m) % 12 + 1
        v = base * math.exp(g * m) * (1.6 if jump and m >= jump else 1) * (1.35 if mo in (11, 12) else 1) * random.uniform(0.9, 1.1)
        rows.append([f"{y}-{mo:02d}-01", t, reg, round(v), round(v * random.uniform(38, 52), 2)])
with open("orders.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Month", "Town", "Region", "Orders", "Revenue (GBP)"]); w.writerows(rows)
