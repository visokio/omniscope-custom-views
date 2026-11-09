"""Illustrative monthly sales by product for the Bump Chart. Products and figures are invented.
sales.csv: 24 products, January 2025 to June 2026, by region. 'Aero Bottle' launches in June 2025 and
climbs to first place; 'Classic Kettle' slowly loses its lead."""
import csv, random, math
random.seed(13)
names = ["Classic Kettle", "Trail Runner", "Aero Bottle", "Smart Plug", "Daily Planner", "Desk Lamp", "Cast Iron Pan", "Yoga Mat", "Bluetooth Speaker", "Coffee Grinder",
         "Rain Jacket", "Air Fryer", "Plant Pot Set", "Travel Mug", "Wireless Mouse", "Bamboo Towels", "Kids Scooter", "Phone Stand", "Wool Socks", "Water Filter",
         "Notebook Pack", "LED Strip", "Garden Hose", "Sunglasses"]
base = {n: 100 - i * 3.5 for i, n in enumerate(names)}
regions = {"North": 0.9, "South": 1.1, "London": 1.3, "Scotland": 0.5}
with open("sales.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Month", "Region", "Product", "Units sold", "Revenue (GBP)"])
    for m in range(18):
        y, mo = 2025 + m // 12, m % 12 + 1
        for n in names:
            b = base[n] * (1 + 0.04 * math.sin((m + len(n)) / 2.5))
            if n == "Aero Bottle": b = 0 if m < 5 else 30 + (m - 5) * 11
            if n == "Classic Kettle": b *= (1 - 0.035 * m)
            if n == "Air Fryer": b *= 1 + 0.6 * (1 if mo in (11, 12) else 0)
            if n == "Rain Jacket": b *= 1.5 if mo in (10, 11, 2, 3) else 0.8
            if b <= 0: continue
            for r, rw in regions.items():
                u = max(1, round(b * rw * random.uniform(0.85, 1.15) * 10))
                w.writerow([f"{y}-{mo:02d}-01", r, n, u, round(u * random.uniform(18, 26), 2)])
