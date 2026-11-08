"""Illustrative container flows between major ports for the Globe Flows view. Volumes are invented;
port coordinates are approximate. shipments.csv: one row per route per month for 2025 (TEU = containers)."""
import csv, random
random.seed(3)
P = {"Shanghai": (31.23, 121.47, "East Asia"), "Ningbo": (29.87, 121.55, "East Asia"), "Shenzhen": (22.54, 114.06, "East Asia"), "Busan": (35.10, 129.04, "East Asia"),
     "Hong Kong": (22.30, 114.17, "East Asia"), "Kaohsiung": (22.61, 120.27, "East Asia"), "Tokyo": (35.62, 139.78, "East Asia"),
     "Singapore": (1.26, 103.84, "South East Asia"), "Port Klang": (3.00, 101.39, "South East Asia"), "Tanjung Pelepas": (1.36, 103.55, "South East Asia"),
     "Colombo": (6.95, 79.85, "South Asia"), "Mumbai": (18.95, 72.95, "South Asia"), "Jebel Ali": (25.01, 55.06, "Middle East"), "Jeddah": (21.48, 39.17, "Middle East"),
     "Rotterdam": (51.95, 4.14, "Europe"), "Antwerp": (51.26, 4.40, "Europe"), "Hamburg": (53.55, 9.97, "Europe"), "Felixstowe": (51.96, 1.35, "Europe"),
     "Southampton": (50.90, -1.40, "Europe"), "Valencia": (39.44, -0.32, "Europe"), "Piraeus": (37.94, 23.63, "Europe"), "Algeciras": (36.13, -5.44, "Europe"), "Tangier Med": (35.88, -5.50, "Africa"),
     "Los Angeles": (33.74, -118.27, "North America"), "Long Beach": (33.75, -118.19, "North America"), "Vancouver": (49.29, -123.11, "North America"),
     "New York": (40.67, -74.04, "North America"), "Savannah": (32.08, -81.09, "North America"), "Manzanillo": (19.05, -104.31, "Latin America"), "Santos": (-23.96, -46.33, "Latin America"),
     "Durban": (-29.87, 31.03, "Africa"), "Lagos": (6.44, 3.36, "Africa"), "Sydney": (-33.97, 151.21, "Oceania"), "Melbourne": (-37.83, 144.92, "Oceania")}
lanes = {("East Asia", "Europe"): 9, ("East Asia", "North America"): 10, ("South East Asia", "Europe"): 4, ("East Asia", "South East Asia"): 6, ("East Asia", "Middle East"): 3,
         ("Europe", "North America"): 3, ("East Asia", "Oceania"): 2, ("East Asia", "Latin America"): 2, ("Europe", "Africa"): 1.5, ("South Asia", "Europe"): 1.5,
         ("East Asia", "Africa"): 1.2, ("Middle East", "South Asia"): 1.5, ("Europe", "Latin America"): 1, ("North America", "East Asia"): 3, ("Europe", "East Asia"): 3.5}
rows = []
for (ra, rb), w in lanes.items():
    A = [p for p in P if P[p][2] == ra]; B = [p for p in P if P[p][2] == rb]
    for a in A:
        for b in random.sample(B, min(len(B), 3)):
            base = w * random.uniform(400, 1400) * (1.6 if a in ("Shanghai", "Singapore", "Ningbo") else 1)
            for m in range(1, 13):
                rows.append([f"2025-{m:02d}-01", a, ra, P[a][0], P[a][1], b, rb, P[b][0], P[b][1], round(base * random.uniform(0.75, 1.25))])
with open("shipments.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Month", "Origin port", "Origin region", "Origin latitude", "Origin longitude", "Destination port", "Destination region", "Destination latitude", "Destination longitude", "Containers (TEU)"])
    w.writerows(rows)
# pre-aggregated version, one row per route, for the server demo
agg = {}
for r in rows:
    k = (r[1], r[5]); a = agg.setdefault(k, r[1:9] + [0]); a[8] += r[9]
with open("routes.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Origin port", "Origin region", "Origin latitude", "Origin longitude", "Destination port", "Destination region", "Destination latitude", "Destination longitude", "Containers (TEU)"])
    w.writerows(agg.values())
print(len(rows), "rows,", len(agg), "routes")
