"""Illustrative delivery times for the Distribution view (invented). deliveries.csv: 12,000 deliveries with
hours from order to delivery, carrier and service level; a right-skewed distribution with a long tail."""
import csv, random
random.seed(66)
rows = []
for i in range(12000):
    car = random.choices(["Carrier A", "Carrier B", "Carrier C"], weights=[5, 3, 2])[0]; svc = random.choices(["Standard", "Express"], weights=[3, 1])[0]
    base = (20 if svc == "Express" else 46) * {"Carrier A": 1, "Carrier B": 1.15, "Carrier C": .95}[car]
    h = base * random.lognormvariate(0, .32) + (random.expovariate(1 / 60) if random.random() < .04 else 0)
    rows.append([f"D{i+1:06d}", car, svc, round(h, 1)])
with open("deliveries.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Delivery", "Carrier", "Service", "Hours to deliver"]); w.writerows(rows)
print(len(rows))
