"""Illustrative monthly sales for the Forecast view (invented). sales_history.csv: monthly sales from Jan 2019
to Oct 2026 by region and category, with growth, a strong December peak, a summer peak for Garden, and noise.
daily_visits.csv: a year of daily website visits with a weekly pattern, for the daily test."""
import csv, random, datetime, math
random.seed(3)
regions = {"North": 1.0, "South": 1.3, "East": 0.8, "West": 0.9}
cats = {"Home": 1.0, "Garden": 0.6, "Gifts": 0.5}
sea = {"Home": [.85, .8, .95, 1, 1, .95, .95, 1, 1, 1.05, 1.15, 1.3], "Garden": [.5, .55, .9, 1.4, 1.7, 1.6, 1.4, 1.1, .8, .6, .5, .45], "Gifts": [.6, .7, .7, .75, .8, .75, .7, .7, .8, .95, 1.6, 2.9]}
rows = []
m = 0; d = datetime.date(2019, 1, 1)
while d <= datetime.date(2026, 10, 1):
    for r, rw in regions.items():
        for c, cw in cats.items():
            trend = 1 + 0.006 * m
            v = 52000 * rw * cw * trend * sea[c][d.month - 1] * random.gauss(1, 0.045)
            rows.append([d.isoformat(), r, c, round(v, 2)])
    m += 1; d = datetime.date(d.year + (d.month == 12), d.month % 12 + 1, 1)
with open("sales_history.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Month", "Region", "Category", "Sales"]); w.writerows(rows)
vis = []
d = datetime.date(2025, 11, 1)
for i in range(365):
    wd = d.weekday(); v = 4000 * (1 + i / 900) * [1.1, 1.08, 1.05, 1.0, .95, .7, .75][wd] * random.gauss(1, .05)
    vis.append([d.isoformat(), round(v)]); d += datetime.timedelta(days=1)
with open("daily_visits.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Date", "Visits"]); w.writerows(vis)
print(len(rows), len(vis))
