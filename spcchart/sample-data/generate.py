"""Illustrative emergency department attendances for the SPC Control Chart. Not real patients or figures.
attendances.csv: ~5,700 rows over 104 weeks from Monday 1 July 2024. Weekly mean wait is about 240
minutes, one bad week (week 30), and a process change from week 66 (Monday 6 October 2025) after which
waits fall to about 200 minutes. 'Within 4 hours' is 1 if the wait was 240 minutes or less."""
import csv, random, datetime
random.seed(5)
start = datetime.date(2024, 7, 1)
with open("attendances.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Attendance ID", "Arrival date", "Week commencing", "Department", "Triage category", "Wait (minutes)", "Within 4 hours", "Admitted"])
    n = 0
    for wk in range(104):
        level = 240 if wk < 66 else 200
        level += random.gauss(0, 7) + (55 if wk == 30 else 0)
        for _ in range(random.randint(48, 62)):
            day = start + datetime.timedelta(days=7 * wk + random.randint(0, 6))
            dept = random.choices(["Main ED", "Urgent Treatment Centre"], weights=[3, 2])[0]
            tri = random.choices(["1 Immediate", "2 Very urgent", "3 Urgent", "4 Standard", "5 Non-urgent"], weights=[1, 4, 8, 6, 2])[0]
            wait = max(10, round(random.gauss(level + (25 if dept == "Main ED" else -35), 55)))
            n += 1
            w.writerow([f"A{n:06d}", day.isoformat(), (start + datetime.timedelta(days=7 * wk)).isoformat(), dept, tri, wait, 1 if wait <= 240 else 0, random.choices(["Yes", "No"], weights=[1, 3])[0]])

# weekly.csv: one row per week (as an Aggregate block would produce), used for the server demo.
import collections
rows = list(csv.DictReader(open("attendances.csv")))
g = collections.OrderedDict()
for r in rows: g.setdefault(r["Week commencing"], []).append(r)
with open("weekly.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Week commencing", "Attendances", "Average wait (minutes)", "Seen within 4 hours (%)"])
    for k, v in sorted(g.items()):
        waits = [int(x["Wait (minutes)"]) for x in v]
        w.writerow([k, len(v), round(sum(waits) / len(waits), 1), round(100 * sum(int(x["Within 4 hours"]) for x in v) / len(v), 1)])
