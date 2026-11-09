"""Illustrative market data for the Marimekko view: a fictional market with invented brands and figures.
market.csv: sales by quarter, region, segment and brand for 2025."""
import csv, random
random.seed(8)
segments = {"Mainstream": 1.0, "Value": 0.7, "Premium": 0.45, "Online": 0.38, "Convenience": 0.22, "Food service": 0.15}
brands = {"Our brand": {"Premium": 0.28, "Online": 0.22, "Mainstream": 0.12, "Value": 0.04, "Convenience": 0.09, "Food service": 0.06},
          "Competitor A": {"Premium": 0.10, "Online": 0.14, "Mainstream": 0.26, "Value": 0.12, "Convenience": 0.2, "Food service": 0.18},
          "Competitor B": {"Premium": 0.22, "Online": 0.12, "Mainstream": 0.16, "Value": 0.08, "Convenience": 0.14, "Food service": 0.1},
          "Private label": {"Premium": 0.05, "Online": 0.10, "Mainstream": 0.18, "Value": 0.42, "Convenience": 0.1, "Food service": 0.2},
          "Competitor C": {"Premium": 0.14, "Online": 0.08, "Mainstream": 0.1, "Value": 0.1, "Convenience": 0.16, "Food service": 0.12},
          "Competitor D": {"Premium": 0.06, "Online": 0.16, "Mainstream": 0.06, "Value": 0.08, "Convenience": 0.1, "Food service": 0.08},
          "Competitor E": {"Premium": 0.08, "Online": 0.06, "Mainstream": 0.05, "Value": 0.06, "Convenience": 0.08, "Food service": 0.14},
          "Competitor F": {"Premium": 0.04, "Online": 0.07, "Mainstream": 0.04, "Value": 0.05, "Convenience": 0.07, "Food service": 0.07},
          "Competitor G": {"Premium": 0.03, "Online": 0.05, "Mainstream": 0.03, "Value": 0.05, "Convenience": 0.06, "Food service": 0.05}}
regions = {"London": 1.2, "South East": 1.0, "North": 0.9, "Midlands": 0.8, "Scotland": 0.5, "Wales": 0.3}
with open("market.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Quarter", "Region", "Segment", "Brand", "Sales (GBP)", "Units"])
    for q in ["2025 Q1", "2025 Q2", "2025 Q3", "2025 Q4"]:
        for r, rw in regions.items():
            for s, sw in segments.items():
                for b, share in brands.items():
                    v = 1_000_000 * sw * rw * share[s] * random.uniform(0.85, 1.15) * (1.15 if (b == "Our brand" and q >= "2025 Q3" and s == "Online") else 1)
                    w.writerow([q, r, s, b, round(v), round(v / random.uniform(3, 9))])
