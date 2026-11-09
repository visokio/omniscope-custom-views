"""Illustrative office list for the Web view (invented offices and staff numbers). offices.csv: one row per office,
with two web addresses each: an OpenStreetMap map of the city (an embeddable page) and the city's Wikipedia article.
The coordinates are the city centres, rounded."""
import csv, random
random.seed(3)
cities = [
    ("London", "United Kingdom", "Europe", 51.507, -0.128),
    ("Paris", "France", "Europe", 48.857, 2.352),
    ("Berlin", "Germany", "Europe", 52.520, 13.405),
    ("Madrid", "Spain", "Europe", 40.417, -3.704),
    ("New York", "United States", "Americas", 40.713, -74.006),
    ("Toronto", "Canada", "Americas", 43.653, -79.383),
    ("Tokyo", "Japan", "Asia Pacific", 35.676, 139.650),
    ("Sydney", "Australia", "Asia Pacific", -33.869, 151.209),
]
def map_url(lat, lon, d=0.06):
    return ("https://www.openstreetmap.org/export/embed.html?bbox="
            f"{lon - d:.3f}%2C{lat - d / 2:.3f}%2C{lon + d:.3f}%2C{lat + d / 2:.3f}&layer=mapnik&marker={lat:.3f}%2C{lon:.3f}")
rows = [[c, country, region, random.randint(8, 120), map_url(lat, lon),
         "https://en.wikipedia.org/wiki/" + {"New York": "New_York_City"}.get(c, c)] for c, country, region, lat, lon in cities]
with open("offices.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["Office", "Country", "Region", "Staff", "Map", "Article"])
    w.writerows(rows)
print(len(rows))
