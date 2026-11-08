"""Illustrative insurance-claims event log for the Process Map (invented). claims.csv: about 2,500 claims and
their steps with timestamps. About 40% need more information (a rework loop back to assessment), 10% go
through a fraud check, a quarter are rejected and some of those are appealed."""
import csv, random, datetime
random.seed(23)
rows = []
t0 = datetime.datetime(2026, 1, 5, 8, 0)
def step(cid, act, t, ch, team): rows.append([cid, act, t.strftime("%Y-%m-%dT%H:%M:%SZ"), ch, team])
for i in range(2500):
    cid = f"CL-{i+1:05d}"; ch = random.choices(["Online", "Phone", "Broker"], weights=[5, 3, 2])[0]
    t = t0 + datetime.timedelta(hours=random.uniform(0, 24 * 120)); team = random.choice(["Team A", "Team B", "Team C"])
    H = lambda lo, hi: datetime.timedelta(hours=random.uniform(lo, hi))
    step(cid, "Claim received", t, ch, team)
    t += H(0.2, 8 if ch == "Online" else 30); step(cid, "Registered", t, ch, team)
    if random.random() < 0.10: t += H(24, 120); step(cid, "Fraud check", t, ch, team)
    t += H(4, 72); step(cid, "Assessed", t, ch, team)
    loops = 0
    while random.random() < (0.40 if loops == 0 else 0.25) and loops < 3:
        t += H(1, 6); step(cid, "Information requested", t, ch, team)
        t += H(24, 240); step(cid, "Information received", t, ch, team)
        t += H(4, 48); step(cid, "Assessed", t, ch, team); loops += 1
    approved = random.random() < 0.75
    if not approved:
        t += H(1, 24); step(cid, "Rejected", t, ch, team)
        if random.random() < 0.3:
            t += H(48, 400); step(cid, "Appeal received", t, ch, team)
            t += H(24, 200); step(cid, "Assessed", t, ch, team)
            approved = random.random() < 0.5
            if not approved: t += H(1, 24); step(cid, "Rejected", t, ch, team)
    if approved:
        t += H(1, 24); step(cid, "Approved", t, ch, team)
        t += H(12, 96 if team != "Team C" else 240); step(cid, "Payment issued", t, ch, team)
    t += H(1, 48); step(cid, "Closed", t, ch, team)
with open("claims.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Claim ID", "Activity", "Timestamp", "Channel", "Team"]); w.writerows(rows)
print(len(rows), "events")
