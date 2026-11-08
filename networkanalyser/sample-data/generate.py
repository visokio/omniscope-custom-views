"""Illustrative data for the Network Analyser. Not real accounts.
payments.csv: account-to-account and account-to-merchant payments with three planted rings of
  accounts that pass money around in circles, two mule accounts bridging them, and a cash-out account.
large.csv: a 4,000-node scale-free network (preferential attachment) for the performance test."""
import csv, random
random.seed(7)
rows = []
accounts = [f"ACC-{i:04d}" for i in range(1, 361)]
merchants = ["Grocer North", "Grocer South", "Fuel Stop", "City Rail", "Coffee House", "Bookshop", "Pharmacy", "Gym Club",
             "Electric Co", "Water Co", "Mobile Net", "Broadband Ltd", "Cinema", "Pizza Place", "Hardware Store", "Florist",
             "Taxi Firm", "Hotel Group", "Airline", "Pet Shop", "Garden Centre", "Bakery", "Butcher", "Opticians"]
def pay(a, b, lo, hi, ch):
    rows.append([a, b, round(random.uniform(lo, hi), 2), f"2026-{random.randint(1,10):02d}-{random.randint(1,28):02d}", ch])
for a in accounts:
    for m in random.sample(merchants, random.randint(3, 7)):
        for _ in range(random.randint(1, 3)): pay(a, m, 5, 120, "Card")
    if random.random() < 0.5:
        pay(a, random.choice(accounts), 10, 300, "Faster Payment")
rings = []
pool = accounts[:]
random.shuffle(pool)
for r in range(3):
    members = [pool.pop() for _ in range(random.randint(6, 9))]
    rings.append(members)
    for _ in range(4):
        for i, a in enumerate(members):
            pay(a, members[(i + 1) % len(members)], 900, 4800, "Faster Payment")
            if random.random() < 0.5: pay(a, random.choice(members), 900, 4800, "Faster Payment")
mules = ["ACC-MULE-1", "ACC-MULE-2"]
cashout = "ACC-CASHOUT"
for i, ring in enumerate(rings):
    for a in random.sample(ring, 3): pay(a, mules[i % 2], 2000, 9000, "Faster Payment")
for m in mules:
    for _ in range(6): pay(m, cashout, 5000, 15000, "International")
    pay(m, random.choice(merchants), 10, 50, "Card")
random.shuffle(rows)
with open("payments.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Payer", "Payee", "Amount (GBP)", "Date", "Channel"]); w.writerows(rows)
with open("rings.txt", "w") as f:
    for i, r in enumerate(rings): f.write(f"ring {i+1}: {' '.join(r)}\n")
    f.write(f"mules: {' '.join(mules)} cash-out: {cashout}\n")
edges, deg = [], [1, 1]
edges.append((0, 1))
for v in range(2, 4000):
    tot = sum(deg)
    for _ in range(2):
        x = random.uniform(0, tot); acc = 0
        for u, d in enumerate(deg):
            acc += d
            if acc >= x: break
        edges.append((v, u)); deg[u] += 1
    deg.append(2)
with open("large.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["From", "To", "Weight"])
    for a, b in edges: w.writerow([f"N{a}", f"N{b}", random.randint(1, 10)])
