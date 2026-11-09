"""Illustrative store metrics for the Correlation Matrix (invented). stores.csv: 600 stores, built from three
hidden factors (store size, location quality, service quality) so that real-looking correlations appear."""
import csv, random
random.seed(5)
N = lambda: random.gauss(0, 1)
with open("stores.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["Store", "Region", "Store size (sq m)", "Staff hours per week", "Weekly footfall", "Conversion rate (%)", "Average basket (GBP)", "Weekly sales (GBP)",
                "Customer satisfaction", "Returns rate (%)", "Distance to competitor (km)", "Online share of sales (%)", "Car parking spaces"])
    for i in range(600):
        size, loc, svc = N(), N(), N()
        area = max(150, 900 + 320 * size)
        staff = max(60, 420 + 140 * size + 25 * N())
        foot = max(800, 9000 + 2600 * size + 2200 * loc + 900 * N())
        conv = min(60, max(4, 22 + 4.5 * svc + 2 * loc + 3 * N()))
        basket = max(8, 34 + 5 * size + 3 * N())
        sales = foot * conv / 100 * basket
        sat = min(10, max(1, 7.2 + 0.9 * svc - 0.35 * (foot / 4000 - 2.3) + 0.5 * N()))
        ret = max(0.5, 6.5 - 1.3 * svc + 0.9 * N())
        dist = max(0.1, 2.5 + 1.2 * loc + 1.4 * N())
        online = min(70, max(2, 24 - 5.5 * loc + 5 * N()))
        park = max(0, round(120 + 60 * size - 40 * loc + 30 * N()))
        w.writerow([f"S{i:03d}", random.choice(["North", "South", "Midlands", "London", "Scotland", "Wales"]), round(area), round(staff), round(foot), round(conv, 1), round(basket, 2), round(sales),
                    round(sat, 1), round(ret, 1), round(dist, 1), round(online, 1), park])
