"""Illustrative customer tiers for the Transition Matrix view (invented). customer_tiers.csv: the loyalty tier
of 5,000 customers at the end of 2024, 2025 and 2026 (Platinum, Gold, Silver, Bronze, or Lapsed), with region.
Most customers stay in their tier; some move up or down one step; a few lapse or return."""
import csv, random
random.seed(58)
T = ["Platinum", "Gold", "Silver", "Bronze", "Lapsed"]
rows = []
for i in range(5000):
    t = random.choices(range(5), weights=[6, 14, 25, 35, 20])[0]; reg = random.choice(["North", "South", "East", "West"])
    for y in (2024, 2025, 2026):
        if y > 2024:
            r = random.random()
            if t == 4: t = 3 if r < .12 else 4
            elif r < .62: pass
            elif r < .78: t = max(0, t - 1)
            elif r < .94: t = min(3, t + 1)
            else: t = 4
        rows.append([f"C{i+1:05d}", y, T[t], reg])
with open("customer_tiers.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Customer", "Year", "Tier", "Region"]); w.writerows(rows)
print(len(rows))
