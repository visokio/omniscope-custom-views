"""Illustrative data for the Strata view (invented). tickets.csv: two weeks of an IT service desk, 120 tickets.
Each ticket's rows are stretches of time in one state: Queued (emphasis 0), Waiting on requester (1) or Being
worked (2). Reply and Escalation rows are moments: a time in Moment time and no Start or End."""
import csv, random
from datetime import datetime, timedelta
random.seed(7)
teams = {"Network": ["VPN drops every hour", "Wi-Fi slow on floor 3", "Firewall rule for supplier",
                     "Printer VLAN change", "Remote site link down"],
         "Accounts": ["New starter accounts", "Password reset loop", "Mailbox access for leaver",
                      "Group membership request", "Two-factor token lost"],
         "Hardware": ["Laptop will not charge", "Monitor flickers", "Docking station swap",
                      "Replace broken keyboard", "Phone screen cracked"],
         "Software": ["Licence renewal", "Spreadsheet add-in crashes", "Install design tools",
                      "Update finance app", "Browser plug-in blocked"]}
day0 = datetime(2026, 10, 5)
last = datetime(2026, 10, 16, 18)
workdays = [day0 + timedelta(days=d) for d in range(12) if (day0 + timedelta(days=d)).weekday() < 5]
rows = []
fmt = lambda t: t.strftime("%Y-%m-%d %H:%M:%S")

def next_open(t):
    """The next time the desk is open (weekdays 8:00 to 18:00), at or after t."""
    while t.weekday() >= 5 or t.hour >= 18 or t.hour < 8:
        t = (t + timedelta(days=1)).replace(hour=8, minute=0) if t.hour >= 8 or t.weekday() >= 5 else t.replace(hour=8, minute=0)
    return t + timedelta(minutes=random.uniform(0, 40))

def stretch(ticket, label, team, state, t, end):
    emphasis = {"Queued": 0, "Waiting on requester": 1, "Being worked": 2}[state]
    rows.append([ticket, label, team, state, emphasis, fmt(t), fmt(end), "", ""])

for i in range(120):
    team = random.choice(list(teams))
    ticket = f"T-{1040 + i}"
    label = f"{ticket} {random.choice(teams[team])}"
    t = random.choice(workdays) + timedelta(hours=random.uniform(8, 17.5))
    # Queued, then worked; after work the ticket closes, waits on the requester, or goes back to the queue.
    state, rounds = "Queued", 0
    while True:
        if state == "Queued":
            end = t + timedelta(hours=random.uniform(0.2, 5))
        elif state == "Waiting on requester":
            end = t + timedelta(hours=random.uniform(1, 30))
        else:
            t2 = next_open(t)
            if t2 > t:  # out of hours: the ticket stays in the queue until the desk opens
                stretch(ticket, label, team, "Queued", t, t2)
                t = t2
            end = t + timedelta(hours=random.uniform(0.3, 2.5))
            if random.random() < 0.7:
                rows.append([ticket, "", "", "", "", "", "", fmt(t + (end - t) * random.uniform(0.3, 0.95)), "Reply"])
        if end > last:  # the export runs at 18:00 on the second Friday
            end = last
        stretch(ticket, label, team, state, t, end)
        t = end
        if t >= last:
            break
        if state == "Being worked":
            rounds += 1
            if rounds >= 3 or random.random() < 0.45:
                break
            state = random.choice(["Waiting on requester", "Waiting on requester", "Queued"])
            if state == "Queued" and random.random() < 0.5:
                rows.append([ticket, "", "", "", "", "", "", fmt(t + timedelta(minutes=2)), "Escalation"])
        else:
            state = "Being worked"
rows.sort(key=lambda r: (r[0], r[5] or r[7]))
with open("tickets.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["Ticket", "Title", "Team", "State", "Emphasis", "Start", "End", "Moment time", "Moment"])
    w.writerows(rows)
stretch = [r for r in rows if r[5]]
print(len(rows), "rows,", len(stretch), "stretches,", len({r[0] for r in rows}), "tickets,",
      {t: len({r[0] for r in stretch if r[2] == t}) for t in teams},
      sum(1 for r in rows if r[8] == "Reply"), "replies", sum(1 for r in rows if r[8] == "Escalation"), "escalations",
      min(r[5] for r in stretch), max(r[6] for r in stretch))
