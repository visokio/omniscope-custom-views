"""Illustrative daily bookings for the Target Tracker view (invented). bookings.csv: daily bookings value by team
for the year to 31 Oct 2026 (financial-year style tracking against an annual target), with a weekly rhythm,
a slow start and a strong autumn."""
import csv, random, datetime, math
random.seed(45)
rows = []; d = datetime.date(2026, 1, 1)
while d <= datetime.date(2026, 10, 31):
    doy = d.timetuple().tm_yday
    base = 31000 * (0.8 + 0.4 * doy / 304) * [1.1, 1.05, 1.0, 1.0, 1.15, 0.35, 0.2][d.weekday()]
    for team, w in (("North", .3), ("South", .4), ("Partners", .3)):
        rows.append([d.isoformat(), team, round(base * w * random.gauss(1, .15), 2)])
    d += datetime.timedelta(days=1)
with open("bookings.csv", "w", newline="") as f:
    wr = csv.writer(f); wr.writerow(["Date", "Team", "Bookings"]); wr.writerows(rows)
print(len(rows), round(sum(r[2] for r in rows)))
