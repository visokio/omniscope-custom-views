"""Illustrative data for the Spain Force Dot Density Map (invented). charging_points.csv: 600 electric vehicle
charging points of an imaginary network on mainland Spain and the Balearic Islands, placed around towns in
proportion to their size, with the charger type and the charging sessions in an average month."""
import csv, json, random
random.seed(11)
# (town, region, latitude, longitude, weight)
towns = [("Madrid", "Madrid", 40.42, -3.70, 30), ("Barcelona", "Catalonia", 41.39, 2.17, 22),
         ("Valencia", "Valencian Community", 39.47, -0.38, 10), ("Seville", "Andalusia", 37.39, -5.98, 9),
         ("Zaragoza", "Aragon", 41.65, -0.89, 7), ("Malaga", "Andalusia", 36.72, -4.42, 7),
         ("Murcia", "Murcia", 37.99, -1.13, 5), ("Palma", "Balearic Islands", 39.57, 2.65, 5),
         ("Bilbao", "Basque Country", 43.26, -2.93, 6), ("Alicante", "Valencian Community", 38.35, -0.48, 5),
         ("Cordoba", "Andalusia", 37.89, -4.78, 4), ("Valladolid", "Castile and Leon", 41.65, -4.72, 4),
         ("Vigo", "Galicia", 42.24, -8.72, 4), ("Gijon", "Asturias", 43.53, -5.66, 3),
         ("A Coruna", "Galicia", 43.36, -8.41, 3), ("Granada", "Andalusia", 37.18, -3.60, 3),
         ("Pamplona", "Navarre", 42.81, -1.64, 3), ("Santander", "Cantabria", 43.46, -3.80, 2),
         ("Salamanca", "Castile and Leon", 40.97, -5.66, 2), ("Toledo", "Castile-La Mancha", 39.86, -4.02, 2),
         ("Badajoz", "Extremadura", 38.88, -6.97, 2), ("Logrono", "La Rioja", 42.47, -2.45, 2),
         ("Albacete", "Castile-La Mancha", 38.99, -1.86, 2), ("Burgos", "Castile and Leon", 42.34, -3.70, 2),
         ("Leon", "Castile and Leon", 42.60, -5.57, 2), ("Caceres", "Extremadura", 39.47, -6.37, 1),
         ("Huesca", "Aragon", 42.14, -0.41, 1), ("Teruel", "Aragon", 40.34, -1.11, 1),
         ("Soria", "Castile and Leon", 41.76, -2.47, 1), ("Lleida", "Catalonia", 41.62, 0.62, 2),
         ("Girona", "Catalonia", 41.98, 2.82, 2), ("Tarragona", "Catalonia", 41.12, 1.25, 2),
         ("Almeria", "Andalusia", 36.84, -2.46, 2), ("Huelva", "Andalusia", 37.26, -6.95, 1),
         ("Jaen", "Andalusia", 37.78, -3.79, 1), ("Lugo", "Galicia", 43.01, -7.56, 1),
         ("Ourense", "Galicia", 42.34, -7.86, 1), ("Ciudad Real", "Castile-La Mancha", 38.99, -3.93, 1),
         ("Cuenca", "Castile-La Mancha", 40.07, -2.13, 1), ("Vitoria-Gasteiz", "Basque Country", 42.85, -2.67, 2)]
types = {"Standard": (0.55, 60), "Fast": (0.33, 140), "Ultra-fast": (0.12, 260)}

# Keep points on land: the map outline the view draws.
geo = json.load(open("../spain_peninsula.json"))["geometry"]["coordinates"]
def inside(lon, lat):
    for poly in geo:
        ring, c = poly[0], False
        j = len(ring) - 1
        for i in range(len(ring)):
            xi, yi = ring[i]; xj, yj = ring[j]
            if (yi > lat) != (yj > lat) and lon < (xj - xi) * (lat - yi) / (yj - yi) + xi:
                c = not c
            j = i
        if c:
            return True
    return False

rows, weights = [], [t[4] for t in towns]
for i in range(600):
    town, region, lat0, lon0, _ = random.choices(towns, weights=weights)[0]
    while True:
        lat, lon = lat0 + random.gauss(0, 0.07), lon0 + random.gauss(0, 0.09)
        if inside(lon, lat):
            break
    kind = random.choices(list(types), weights=[v[0] for v in types.values()])[0]
    sessions = max(5, round(random.gauss(types[kind][1], types[kind][1] * 0.3)))
    rows.append([f"CP-{i + 1:04d}", town, region, kind, round(lat, 4), round(lon, 4), sessions])
with open("charging_points.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["Charging point", "Town", "Region", "Charger type", "Latitude", "Longitude", "Sessions per month"])
    w.writerows(rows)
print(len(rows), sum(r[6] for r in rows), {k: sum(1 for r in rows if r[3] == k) for k in types},
      sum(1 for r in rows if r[2] == "Andalusia"))
