"""Illustrative delivery jobs for the Density Scatter (invented). deliveries.csv: 40,000 jobs from two fleets:
e-bikes (short, quick, steady) and vans (longer, slower, spread out by traffic). Late = 1 when the delivery took
longer than the promised time (20 minutes plus 2.5 minutes per km)."""
import csv, random, math
random.seed(19)
with open("deliveries.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Fleet", "Region", "Hour", "Distance (km)", "Delivery time (minutes)", "Late", "Customer rating"])
    for i in range(40000):
        bike = random.random() < 0.55
        d = random.lognormvariate(math.log(2.2), 0.45) if bike else random.lognormvariate(math.log(9), 0.55)
        h = random.randint(8, 21); rush = 1.35 if h in (8, 9, 17, 18) else 1.0
        t = (6 + 3.4 * d) * random.lognormvariate(0, 0.12) if bike else (14 + 2.4 * d * rush) * random.lognormvariate(0, 0.22)
        late = 1 if t > 20 + 2.5 * d else 0
        w.writerow(["E-bike" if bike else "Van", random.choice(["North", "South", "London", "Midlands"]), h, round(d, 2), round(t, 1), late, max(1, min(5, round(4.6 - 1.4 * late + random.gauss(0, 0.5))))])
