"""Illustrative contact-centre contacts for the Weekly Pattern view (invented). contacts.csv: about 40,000
contacts over 26 weeks from 4 May 2026, with timestamp, channel, reason and handling minutes. Phone peaks
mid-morning and mid-afternoon on weekdays, heaviest on Mondays; chat runs into the evening; weekends are quiet."""
import csv, random, datetime, math
random.seed(8)
start = datetime.datetime(2026, 5, 4)
day_w = [1.35, 1.1, 1.05, 1.0, 0.85, 0.35, 0.2]
def hour_w(ch, h, wd):
    if ch == "Phone": return max(0, math.exp(-((h - 10) / 1.6) ** 2) + 0.8 * math.exp(-((h - 14.5) / 1.8) ** 2)) if 8 <= h < 18 or wd >= 5 and 9 <= h < 13 else 0
    if ch == "Chat": return (0.5 + 0.6 * math.exp(-((h - 20) / 2) ** 2) + 0.4 * math.exp(-((h - 12) / 3) ** 2)) if 7 <= h < 23 else 0.03
    return 0.3 + 0.4 * math.exp(-((h - 9) / 3) ** 2)  # email arrives around the clock
rows = []; cid = 0
for d in range(182):
    day = start + datetime.timedelta(days=d); wd = day.weekday()
    for ch, vol in (("Phone", 140), ("Chat", 60), ("Email", 30)):
        ws = [hour_w(ch, h, wd) for h in range(24)]; tot = sum(ws)
        n = int(random.gauss(vol * day_w[wd] * (1.15 if ch == "Chat" and wd >= 5 else 1), vol * 0.08))
        for _ in range(max(0, n)):
            h = random.choices(range(24), weights=ws)[0]; t = day + datetime.timedelta(hours=h, minutes=random.randrange(60), seconds=random.randrange(60))
            cid += 1; rows.append([f"C{cid:06d}", t.strftime("%Y-%m-%dT%H:%M:%S"), ch, random.choices(["Billing", "Delivery", "Returns", "Account", "Other"], weights=[3, 4, 2, 2, 1])[0], round(random.lognormvariate(1.8, 0.5), 1)])
with open("contacts.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Contact ID", "Received", "Channel", "Reason", "Handling minutes"]); w.writerows(rows)
print(len(rows))
