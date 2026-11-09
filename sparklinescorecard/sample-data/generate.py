"""Illustrative weekly store performance for the Sparkline Scorecard. Stores and figures are invented.
stores.csv: 16 stores, 26 weeks from 5 January 2026, with sales, a weekly target and transactions."""
import csv, random, math, datetime
random.seed(44)
stores = {"Manchester Central": ("North", 1.25, 0.004), "Leeds City": ("North", 1.0, -0.006), "Newcastle": ("North", 0.85, 0.002),
          "Birmingham": ("Midlands", 1.3, 0.001), "Nottingham": ("Midlands", 0.9, -0.010), "Leicester": ("Midlands", 0.8, 0.006),
          "London West End": ("London", 1.8, 0.003), "London Stratford": ("London", 1.6, 0.008), "London Docklands": ("London", 1.1, -0.004), "Croydon": ("London", 0.7, -0.012),
          "Bristol": ("South", 1.05, 0.005), "Brighton": ("South", 0.75, 0.0), "Southampton": ("South", 0.8, -0.003),
          "Glasgow": ("Scotland", 1.1, 0.002), "Edinburgh": ("Scotland", 1.0, 0.007), "Cardiff": ("Wales", 0.85, -0.002)}
start = datetime.date(2026, 1, 5)
with open("stores.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Week", "Store", "Region", "Sales (GBP)", "Target (GBP)", "Transactions"])
    for wk in range(26):
        season = 1 + 0.08 * math.sin(wk / 4.0)
        for s, (reg, size, trend) in stores.items():
            target = round(40000 * size * (1 + 0.004 * wk))
            sales = 40000 * size * season * (1 + trend * wk) * random.uniform(0.93, 1.07)
            w.writerow([(start + datetime.timedelta(days=7 * wk)).isoformat(), s, reg, round(sales), target, round(sales / random.uniform(28, 36))])
