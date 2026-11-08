"""Illustrative purchases for the Index Heatmap view (invented). purchases.csv: 30,000 purchases with product
category, customer age band, region and channel. Some combinations are over-represented (younger customers
buy more gaming and fashion online, older customers more garden and books)."""
import csv, random
random.seed(61)
ages = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"]
cats = ["Fashion", "Gaming", "Electronics", "Home", "Garden", "Books", "Beauty", "Sport"]
pref = {"Fashion": [2, 1.6, 1.1, .9, .7, .5], "Gaming": [2.6, 1.8, 1, .6, .35, .2], "Electronics": [1.2, 1.3, 1.2, 1, .8, .6], "Home": [.5, .9, 1.2, 1.2, 1.1, 1], "Garden": [.2, .5, .9, 1.3, 1.6, 1.8],
        "Books": [.8, .8, .9, 1, 1.3, 1.7], "Beauty": [1.5, 1.3, 1.1, .9, .8, .7], "Sport": [1.3, 1.4, 1.2, 1, .7, .4]}
aw = [12, 22, 21, 18, 15, 12]
rows = []
for i in range(30000):
    a = random.choices(range(6), weights=aw)[0]; c = random.choices(cats, weights=[pref[k][a] for k in cats])[0]
    rows.append([f"T{i+1:06d}", c, ages[a], random.choice(["North", "South", "Midlands", "Scotland"]), random.choices(["Online", "Store"], weights=[1.5 - a * .15, 1])[0], round(random.lognormvariate(3.4, .6), 2)])
with open("purchases.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Transaction", "Category", "Age band", "Region", "Channel", "Spend"]); w.writerows(rows)
print(len(rows))
