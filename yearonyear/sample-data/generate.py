"""Illustrative daily orders for the Year on Year view (invented). orders_daily.csv: daily orders and revenue
from 1 Jan 2023 to 31 Oct 2026 for three channels, with growth, a weekly rhythm, a December peak and a weak
spring in 2025."""
import csv, random, datetime, math
random.seed(9)
rows = []; d = datetime.date(2023, 1, 1); i = 0
while d <= datetime.date(2026, 10, 31):
    doy = d.timetuple().tm_yday; yr = d.year
    base = 400 * (1 + 0.08 * (yr - 2023)) * (1 + 0.25 * math.exp(-((doy - 345) / 12) ** 2) + 0.1 * math.sin(2 * math.pi * (doy - 80) / 365))
    if yr == 2025 and 60 <= doy <= 150: base *= 0.9
    base *= [1.05, 1.0, 1.0, 1.02, 1.1, 0.85, 0.8][d.weekday()]
    for ch, w in (("Online", .55), ("Stores", .35), ("Wholesale", .10)):
        n = max(0, round(random.gauss(base * w, (base * w) ** .5)))
        rows.append([d.isoformat(), ch, n, round(n * random.gauss(48, 3), 2)])
    d += datetime.timedelta(days=1)
with open("orders_daily.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Date", "Channel", "Orders", "Revenue"]); w.writerows(rows)
print(len(rows))
