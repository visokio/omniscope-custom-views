"""Illustrative contact-centre calls for the Ridgeline view. Not real figures.
calls.csv: 15,000 calls over four weeks; wait time (seconds) depends on the hour of day (longer and more
spread at lunchtime and from 17:00) and on the team."""
import csv, random, math
random.seed(31)
hours = list(range(8, 20))
load = {8: 0.6, 9: 0.9, 10: 1.0, 11: 1.1, 12: 1.6, 13: 1.5, 14: 1.0, 15: 0.9, 16: 1.1, 17: 1.7, 18: 1.4, 19: 0.8}
teams = {"Billing": 1.15, "Technical support": 1.35, "New customers": 0.7, "Retention": 0.9}
days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
with open("calls.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Date", "Day", "Hour", "Team", "Wait (seconds)", "Handling time (minutes)"])
    for i in range(15000):
        h = random.choices(hours, weights=[load[x] for x in hours])[0]
        t = random.choices(list(teams), weights=[3, 3, 2, 1])[0]
        d = random.randint(1, 28); day = days[(d + 2) % 7]
        med = 40 * load[h] ** 2 * teams[t] * (1.25 if day == "Mon" else 1)
        wait = round(random.lognormvariate(math.log(med), 0.55 + 0.15 * (load[h] > 1.3)))
        w.writerow([f"2026-02-{d:02d}", day, f"{h:02d}:00", t, wait, round(random.lognormvariate(math.log(6), 0.4), 1)])
