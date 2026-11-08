"""Illustrative office building for the 3D Building view. Not a real building; layout and figures invented.
office.csv: one row per zone per hour (08:00 to 18:00) of a working day. Floor 3 is crowded, floor 4 is
nearly empty, and east-facing zones warm up in the afternoon."""
import csv, random, math
random.seed(2)
ground = [("Reception", 0, 0, 14, 20, 0), ("Cafe", 14, 0, 14, 12, 40), ("Lifts and stairs", 28, 0, 6, 20, 0), ("Post room", 14, 12, 7, 8, 2), ("Security", 21, 12, 7, 8, 3), ("Gym", 34, 0, 6, 20, 12)]
upper = [("Open plan west", 0, 0, 16, 12, 48), ("Meeting rooms west", 0, 12, 8, 8, 16), ("Focus booths", 8, 12, 8, 8, 8), ("Lifts and stairs", 16, 0, 8, 20, 0),
         ("Open plan east", 24, 0, 16, 12, 48), ("Kitchen", 24, 12, 8, 8, 10), ("Meeting rooms east", 32, 12, 8, 8, 16)]
use = {0: 0.45, 1: 0.6, 2: 0.65, 3: 0.95, 4: 0.12}
with open("office.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Building", "Floor", "Zone", "X (m)", "Y (m)", "Width (m)", "Depth (m)", "Capacity", "Hour", "Occupancy (%)", "Temperature (C)", "Energy (kWh)"])
    for fl in range(5):
        for (z, x, y, wd, dp, cap) in (ground if fl == 0 else upper):
            for h in range(8, 19):
                day = math.exp(-((h - 12.5) ** 2) / 10)
                occ = 0 if cap == 0 else max(0, min(100, 100 * use[fl] * day * random.uniform(0.85, 1.15) * (1.2 if "Meeting" in z else 1)))
                east = x >= 24
                temp = 20.2 + 0.03 * occ + (1.8 * max(0, h - 13) / 5 if east else 0) - (0.8 if fl == 4 else 0) + random.uniform(-0.3, 0.3)
                kwh = (0.02 * wd * dp) * (0.4 + occ / 100) + (2 if z == "Gym" else 0)
                w.writerow(["HQ", fl, z, x, y, wd, dp, cap, h, round(occ, 1), round(temp, 1), round(kwh, 2)])
