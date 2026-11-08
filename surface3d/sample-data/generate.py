"""Illustrative yield curves for the 3D Surface view (invented, not market data). yield_curves.csv: a monthly
yield curve from Jan 2022 to Oct 2026 at 12 maturities, generated from a smooth level, slope and curvature
that move over time (rates rise, the curve inverts, then normalises). demand_grid.csv: illustrative weekly
bookings by price point and weeks before travel, for a response surface."""
import csv, math, random, datetime
random.seed(2)
mats = [0.25, 0.5, 1, 2, 3, 5, 7, 10, 15, 20, 25, 30]
rows = []; d = datetime.date(2022, 1, 1); m = 0
while d <= datetime.date(2026, 10, 1):
    t = m / 57
    level = 2.0 + 3.0 / (1 + math.exp(-(m - 14) / 3.5)) - 0.6 * max(0, t - 0.6)
    slope = 1.6 - 3.0 * math.exp(-((m - 24) / 9) ** 2) - 0.3 * t
    curv = 0.8 * math.sin(m / 9)
    for tau in mats:
        lam = 1.8; f = (1 - math.exp(-tau / lam)) / (tau / lam)
        y = level + slope * f * -1 + curv * (f - math.exp(-tau / lam)) + random.gauss(0, 0.03)
        rows.append([d.isoformat(), tau, round(y, 3)])
    m += 1; d = datetime.date(d.year + (d.month == 12), d.month % 12 + 1, 1)
with open("yield_curves.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Month", "Maturity (years)", "Yield %"]); w.writerows(rows)
g = []
for price in range(60, 210, 10):
    for wk in range(0, 27):
        demand = 220 * math.exp(-((price - 80 - 3 * wk) / 55) ** 2) * (0.4 + 0.6 * math.exp(-((wk - 8) / 7) ** 2)) * random.gauss(1, 0.04)
        g.append([price, wk, round(demand, 1)])
with open("demand_grid.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Price", "Weeks before travel", "Bookings"]); w.writerows(g)
print(len(rows), len(g))
