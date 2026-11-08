"""Illustrative product portfolio for the Quadrant Matrix view (invented). products.csv: 40 product lines with
market growth %, relative market share, revenue and margin, by business unit, for a growth-share (BCG style)
matrix. customer_feedback.csv: 16 service attributes with importance and satisfaction scores (1 to 10) for an
importance-performance analysis."""
import csv, random
random.seed(27)
units = ["Consumer", "Professional", "Industrial", "Digital"]
rows = []
for i in range(40):
    u = random.choice(units); growth = random.gauss(6 if u == "Digital" else 3, 5); share = round(random.lognormvariate(-0.2, 0.7), 2)
    rev = round(random.lognormvariate(3.2 + 0.5 * min(share, 2), 0.5), 1); margin = round(random.gauss(22 + 6 * (share > 1), 6), 1)
    rows.append([f"{u[:3].upper()}-{i+1:02d}", u, round(growth, 1), share, rev, margin])
with open("products.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Product line", "Business unit", "Market growth %", "Relative market share", "Revenue (m)", "Margin %"]); w.writerows(rows)
attrs = ["Delivery speed", "Price", "Product range", "Website ease of use", "Returns process", "Stock availability", "Customer service", "Packaging",
         "Order tracking", "Payment options", "Loyalty scheme", "Product information", "Store staff", "Opening hours", "Click and collect", "App"]
fb = []
for a in attrs:
    fb.append([a, round(random.uniform(4.5, 9.5), 1), round(random.uniform(5, 9), 1), random.randint(300, 2400)])
with open("customer_feedback.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Attribute", "Importance", "Satisfaction", "Responses"]); w.writerows(fb)
print(len(rows), len(fb))
