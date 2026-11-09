"""Illustrative weekly website sessions for the Seasonal Decomposition view (invented). sessions.csv: daily
sessions by traffic source from Nov 2023 to Oct 2026, with growth that slows, a yearly pattern (summer dip,
November and December peak), a two-week outage in March 2025 and a campaign spike in September 2026."""
import csv, random, datetime, math
random.seed(4)
rows = []; d = datetime.date(2023, 11, 6); i = 0
while d <= datetime.date(2026, 10, 25):
    doy = d.timetuple().tm_yday
    trend = 20000 * (1 + 0.5 * (1 - math.exp(-i / 500)))
    sea = 1 + 0.18 * math.cos(2 * math.pi * (doy - 340) / 365) - 0.06 * math.exp(-((doy - 215) / 20) ** 2)
    v = trend * sea * random.gauss(1, 0.03)
    if datetime.date(2025, 3, 10) <= d <= datetime.date(2025, 3, 23): v *= 0.55
    if datetime.date(2026, 9, 14) <= d <= datetime.date(2026, 9, 20): v *= 1.6
    for src, w in (("Search", .5), ("Direct", .25), ("Social", .15), ("Email", .1)):
        rows.append([d.isoformat(), src, round(v * w / 7)])
    d += datetime.timedelta(days=1); i += 1
with open("sessions.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Date", "Source", "Sessions"]); w.writerows(rows)
print(len(rows))
