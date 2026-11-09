"""Illustrative product portfolio for Motion Bubbles: a growth-share matrix over time.
portfolio.csv: 18 invented products in four business units, quarterly from Q1 2021 to Q2 2026: relative
market share (our share divided by the largest competitor's), market growth (% a year) and revenue (GBP m).
Products follow a life cycle: question mark, star, cash cow, then dog."""
import csv, random, math, datetime
random.seed(4)
units = ["Home", "Health", "Outdoor", "Digital"]
rows = []
for i in range(18):
    name = ["Aurora", "Beacon", "Cobalt", "Delta", "Ember", "Fjord", "Garnet", "Harbour", "Iris", "Juniper", "Kestrel", "Lumen", "Meridian", "Nova", "Orchid", "Pioneer", "Quartz", "Ridge"][i]
    unit = units[i % 4]; start = random.uniform(-0.6, 0.9); speed = random.uniform(0.025, 0.06); base = random.uniform(5, 30)
    for q in range(22):
        life = start + speed * q
        share = math.exp(-1.6 + 2.6 * (1 / (1 + math.exp(-4 * (life - 0.3)))) - 1.2 * max(0, life - 1.1)) * random.uniform(0.92, 1.08)
        growth = 32 * math.exp(-1.8 * max(0, life)) - 4 + random.uniform(-1.5, 1.5)
        revenue = base * share * (1 + 0.6 * max(0, growth) / 30) * random.uniform(0.95, 1.05)
        d = datetime.date(2021 + q // 4, 3 * (q % 4) + 1, 1)
        rows.append([d.isoformat(), name, unit, round(share, 3), round(growth, 1), round(revenue, 2)])
with open("portfolio.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Quarter", "Product", "Business unit", "Relative market share", "Market growth (%)", "Revenue (GBP m)"]); w.writerows(rows)
