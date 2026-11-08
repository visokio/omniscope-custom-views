"""Illustrative visitor numbers for the Calendar view (invented). visits.csv: daily visitors to the three
galleries of a fictional museum in 2024 and 2025, one row per gallery per day. The museum is closed on Mondays
and from 24 to 26 December, so those days have no rows; visits rise at weekends and in the summer."""
import csv, datetime, math, random

random.seed(9)
galleries = {"Natural history": 1.0, "Modern art": 0.7, "Maritime": 0.5}
rows = []
day = datetime.date(2024, 1, 1)
while day.year < 2026:
    closed = day.weekday() == 0 or (day.month == 12 and 24 <= day.day <= 26)
    if not closed:
        season = 1 + 0.45 * math.sin((day.timetuple().tm_yday - 100) / 365 * 2 * math.pi)
        weekend = 1.6 if day.weekday() >= 5 else 1.0
        for g, w in galleries.items():
            rows.append([day.isoformat(), g, max(0, round(random.gauss(320 * w * season * weekend, 40 * w)))])
    day += datetime.timedelta(days=1)
with open("visits.csv", "w", newline="") as f:
    wr = csv.writer(f)
    wr.writerow(["Date", "Gallery", "Visitors"])
    wr.writerows(rows)
print(len(rows), "rows,", len({r[0] for r in rows}), "open days, visitors", sum(r[2] for r in rows))
