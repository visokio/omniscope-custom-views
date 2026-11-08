"""Illustrative API log for the JSON Tree view (invented). orders_api.csv: 60 responses from a fictional order
service, one row each, with the time received, endpoint, HTTP status and the JSON body as text."""
import csv, json, random

random.seed(5)
products = [("SKU-1001", "Desk lamp", 34.0), ("SKU-1002", "Notebook, A5", 4.5), ("SKU-1003", "Office chair", 149.0),
            ("SKU-1004", "Monitor arm", 59.0), ("SKU-1005", "Cable tidy", 7.25), ("SKU-1006", "Whiteboard", 89.0)]
cities = [("Leeds", "LS1"), ("Bristol", "BS1"), ("Glasgow", "G1"), ("Cardiff", "CF10"), ("Norwich", "NR1")]
rows = []
for i in range(60):
    t = f"2025-06-{1 + i // 6:02d}T{8 + (i % 6) * 2:02d}:{random.randint(0, 59):02d}:00Z"
    oid = f"ORD-{20250 + i}"
    if i % 10 == 7:
        body = {"error": {"code": "STOCK_UNAVAILABLE", "message": "Not enough stock for SKU-1003",
                          "requestId": f"req-{9000 + i}"}}
        rows.append([t, "POST /orders", 409, json.dumps(body)])
        continue
    lines = []
    for sku, name, price in random.sample(products, random.randint(1, 4)):
        q = random.randint(1, 5)
        lines.append({"sku": sku, "name": name, "quantity": q, "unitPrice": price})
    city, pc = random.choice(cities)
    body = {
        "orderId": oid,
        "status": random.choice(["confirmed", "shipped", "delivered"]),
        "customer": {"id": f"C-{random.randint(100, 999)}", "type": random.choice(["business", "personal"]),
                     "address": {"city": city, "postcode": f"{pc} {random.randint(1, 9)}AB", "country": "GB"}},
        "lines": lines,
        "total": round(sum(l["quantity"] * l["unitPrice"] for l in lines), 2),
        "giftWrap": random.random() < 0.2,
        "voucher": None if random.random() < 0.7 else f"SAVE{random.choice([5, 10, 15])}",
    }
    rows.append([t, "GET /orders/" + oid, 200, json.dumps(body)])
with open("orders_api.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["Received", "Endpoint", "Status", "Body"])
    w.writerows(rows)
print(len(rows), "responses")
