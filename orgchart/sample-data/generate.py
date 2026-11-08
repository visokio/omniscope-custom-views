"""Illustrative organisation for the Org Chart: an invented company of about 125 people (names are random
combinations, not real people). people.csv: ID, manager ID, name, title, department, location, annual cost."""
import csv, random
random.seed(12)
first = ["Amelia", "Oliver", "Isla", "Noah", "Ava", "Leo", "Mia", "Arthur", "Freya", "Oscar", "Grace", "Harry", "Lily", "Jack", "Evie", "George", "Sofia", "Theo", "Ivy", "Finley",
         "Priya", "Arjun", "Aisha", "Omar", "Zara", "Ravi", "Mei", "Chen", "Kofi", "Ama", "Siobhan", "Callum", "Niamh", "Rhys", "Ffion", "Dylan", "Elif", "Mateo", "Lucia", "Tomasz"]
last = ["Patel", "Smith", "Jones", "Williams", "Brown", "Taylor", "Davies", "Evans", "Wilson", "Thomas", "Roberts", "Khan", "Ali", "Walker", "Wright", "Robinson", "Thompson", "White",
        "Hughes", "Edwards", "Green", "Hall", "Wood", "Harris", "Lewis", "Martin", "Jackson", "Clarke", "Clark", "Turner", "Hill", "Scott", "Cooper", "Morris", "Ward", "Moore", "King", "Watson", "Baker", "Okafor"]
used = set()
def name():
    while True:
        n = random.choice(first) + " " + random.choice(last)
        if n not in used: used.add(n); return n
rows, nid = [], [0]
def add(mgr, title, dept, loc, cost):
    nid[0] += 1; i = f"E{nid[0]:04d}"; rows.append([i, mgr, name(), title, dept, loc, round(cost, -2)]); return i
ceo = add("", "Chief Executive", "Executive", "London", 260000)
depts = {"Sales": (["UK", "Europe", "North America"], "Account Executive", 3), "Marketing": (["Brand", "Digital", "Events"], "Marketing Specialist", 2),
         "Engineering": (["Platform", "Data", "Mobile", "Security"], "Software Engineer", 4), "Finance": (["Accounting", "FP&A"], "Analyst", 2),
         "Operations": (["Support", "Logistics", "Facilities"], "Coordinator", 3), "People": (["Recruitment", "People Partners"], "People Advisor", 2)}
locs = ["London", "Manchester", "Edinburgh", "Bristol", "Remote"]
for d, (teams, role, size) in depts.items():
    head = add(ceo, "Director of " + d, d, "London", 165000)
    for t in teams:
        mgr = add(head, t + " Manager", d, random.choice(locs[:4]), 88000)
        n = random.randint(size + 1, size + 6)
        lead = None
        if n > 6: lead = add(mgr, "Senior " + role, d, random.choice(locs), 72000)
        for k in range(n):
            add(lead if (lead and k % 2) else mgr, ("Senior " if random.random() < 0.25 else "") + role, d, random.choice(locs), random.uniform(38000, 68000))
with open("people.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Employee ID", "Manager ID", "Name", "Job title", "Department", "Location", "Annual cost (GBP)"]); w.writerows(rows)
print(len(rows), "people")
