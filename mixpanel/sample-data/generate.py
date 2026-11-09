"""Sample data for the Mixpanel tracker (invented). The view reads no data: it only needs a report to sit in.
report_usage.csv is a small table of report sessions by team and week, so the demo report has something to click."""
import csv, random
random.seed(5)
teams = ["Sales", "Finance", "Operations", "Marketing"]
rows = []
for week in range(1, 13):
    for team in teams:
        rows.append([f"2025-W{week:02d}", team, random.randint(5, 60), round(random.uniform(2, 15), 1)])
with open("report_usage.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["Week", "Team", "Sessions", "Minutes per session"])
    w.writerows(rows)
print(len(rows))
