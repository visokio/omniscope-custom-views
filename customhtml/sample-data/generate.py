"""Illustrative product catalogue for the Custom HTML view (invented). products.csv: 24 products of a fictional
office supplier, with category, price, stock, and a ready-made HTML card for each product (Card)."""
import csv, html, random

random.seed(3)
catalogue = {
    "Lighting": ["Desk lamp", "Floor lamp", "Clip light", "LED strip"],
    "Furniture": ["Office chair", "Standing desk", "Bookcase", "Filing cabinet", "Footrest"],
    "Stationery": ["Notebook, A5", "Gel pens (10)", "Sticky notes", "Ring binder", "Highlighters (6)"],
    "Tech": ["Monitor arm", "USB-C hub", "Wireless mouse", "Keyboard", "Webcam"],
    "Storage": ["Cable tidy", "Desk organiser", "Archive box", "Drawer unit", "Locker"],
}
colours = {"Lighting": "#eda100", "Furniture": "#2a78d6", "Stationery": "#1baf7a", "Tech": "#6250d6", "Storage": "#eb6834"}
rows = []
n = 0
for cat, items in catalogue.items():
    for name in items:
        n += 1
        price = round(random.uniform(3, 60) if cat in ("Stationery", "Storage") else random.uniform(15, 320), 2)
        stock = random.choice([0, random.randint(1, 15), random.randint(16, 400)])
        stock_html = ("<span style='color:#b3261e'>Out of stock</span>" if stock == 0 else
                      f"<span style='color:#8a5a00'>Only {stock} left</span>" if stock <= 15 else f"{stock} in stock")
        card = (f"<div style='border-left:4px solid {colours[cat]};padding:6px 10px;margin:4px 0;'>"
                f"<div style='font-size:15px;font-weight:bold'>{html.escape(name)}</div>"
                f"<div style='color:#666'>{cat} &middot; P-{100 + n}</div>"
                f"<div style='margin-top:4px'><b>&pound;{price:,.2f}</b> &middot; {stock_html}</div></div>")
        rows.append([f"P-{100 + n}", name, cat, price, stock, card])
with open("products.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["Product code", "Product", "Category", "Price", "Stock", "Card"])
    w.writerows(rows)
print(len(rows), "products")
