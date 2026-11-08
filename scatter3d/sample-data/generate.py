"""Generate illustrative sample data for the 3D Scatter view. Not real customers.
customers.csv: RFM-style customer segmentation, three clusters (as a Clustering block would output).
large.csv: 15,000 points for the performance test."""
import csv, random, math
random.seed(42)
segs = [("High value", 600, (18, 12), (24, 6), (2400, 700)),
        ("Regular", 900, (60, 25), (9, 3), (820, 260)),
        ("Lapsing", 500, (210, 60), (3, 1.5), (300, 140))]
regions = ["London", "South East", "North West", "Scotland", "Midlands", "Wales"]
with open("customers.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Customer ID", "Segment", "Region", "Recency (days)", "Orders per year", "Annual spend (GBP)", "Lifetime value (GBP)"])
    n = 1
    for name, k, rec, frq, mon in segs:
        for _ in range(k):
            r = max(1, random.gauss(*rec)); fq = max(1, random.gauss(*frq)); m = max(40, random.gauss(*mon) + 40 * fq)
            ltv = m * random.uniform(2.5, 4.5) * (1.4 if name == "High value" else 1.0)
            w.writerow([f"C{n:05d}", name, random.choice(regions), round(r), round(fq, 1), round(m, 2), round(ltv)])
            n += 1
with open("large.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Sensor reading", "Line", "Temperature", "Vibration", "Pressure", "Yield"])
    for i in range(15000):
        line = random.choice(["Line A", "Line B", "Line C"])
        t = random.gauss(70, 6); v = random.gauss(0.4, 0.1) + (t - 70) * 0.01; p = random.gauss(2.1, 0.2) + math.sin(t / 5) * 0.1
        w.writerow([f"R{i:06d}", line, round(t, 2), round(v, 3), round(p, 3), round(random.uniform(0.85, 0.99), 3)])
