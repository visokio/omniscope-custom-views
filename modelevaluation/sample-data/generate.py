"""Illustrative churn-model scores for the Model Evaluation view (as the Prediction block might output).
scores.csv: 8,000 customers, about 18% churned; 'Churn probability' is a good model, 'Baseline score' a weaker one."""
import csv, random
random.seed(9)
segs = ["Consumer", "Small business", "Enterprise"]
with open("scores.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Customer ID", "Segment", "Tenure (months)", "Churned", "Churn probability", "Baseline score"])
    for i in range(8000):
        churn = random.random() < 0.18
        p = random.betavariate(4.2, 2.6) if churn else random.betavariate(1.6, 6.5)
        b = random.betavariate(2.6, 3.2) if churn else random.betavariate(2.0, 3.8)
        w.writerow([f"K{i:05d}", random.choices(segs, weights=[6, 3, 1])[0], random.randint(1, 96) if not churn else random.randint(1, 30), "Yes" if churn else "No", round(p, 4), round(b, 4)])
