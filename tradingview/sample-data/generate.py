"""Illustrative portfolio for the TradingView view (invented holdings). portfolio.csv: one row per holding, with the
TradingView symbol (exchange and ticker), the company, sector and region, and an invented holding value in pounds.
The symbols are real listings that TradingView's widgets can show (some exchanges, such as London and Tokyo, are
"only available on TradingView"), so the chart shows real market data; the holdings are not."""
import csv, random
random.seed(11)
holdings = [
    ("NASDAQ:AAPL", "Apple", "Technology", "North America"),
    ("NYSE:KO", "Coca-Cola", "Consumer staples", "North America"),
    ("NYSE:JNJ", "Johnson & Johnson", "Health care", "North America"),
    ("NYSE:NKE", "Nike", "Consumer discretionary", "North America"),
    ("NYSE:DIS", "Walt Disney", "Communication services", "North America"),
    ("EURONEXT:MC", "LVMH", "Consumer discretionary", "Europe"),
    ("EURONEXT:AIR", "Airbus", "Industrials", "Europe"),
    ("NYSE:TM", "Toyota (US listing)", "Consumer discretionary", "Asia"),
    ("BINANCE:BTCUSDT", "Bitcoin (in US tether)", "Crypto", "Global"),
]
rows = [[s, c, sec, reg, int(round(random.uniform(5, 60) * 10)) * 100] for s, c, sec, reg in holdings]
with open("portfolio.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["Symbol", "Company", "Sector", "Region", "Holding"])
    w.writerows(rows)
print(len(rows), sum(r[4] for r in rows))
