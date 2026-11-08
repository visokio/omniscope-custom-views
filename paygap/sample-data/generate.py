"""Illustrative employee pay for the Pay Gap view (invented company). employees.csv: 1,800 employees with
gender, department, grade, working pattern, hourly pay and bonus paid in the last 12 months. Pay rises with
grade; men are over-represented in senior grades and women in part-time roles, which produces a gap even
though pay within a grade is similar."""
import csv, random
random.seed(21)
depts = {"Operations": .35, "Sales": .2, "Technology": .15, "Finance": .1, "Customer service": .2}
share_f = {"Operations": .35, "Sales": .45, "Technology": .3, "Finance": .55, "Customer service": .7}
grades = [("G1", 11.5), ("G2", 14.0), ("G3", 18.0), ("G4", 25.0), ("G5", 38.0), ("G6", 60.0)]
rows = []
for i in range(1800):
    dep = random.choices(list(depts), weights=list(depts.values()))[0]
    g = "Female" if random.random() < share_f[dep] else "Male"
    w = [30, 26, 20, 13, 8, 3] if g == "Female" else [22, 22, 21, 18, 11, 6]
    gi = random.choices(range(6), weights=w)[0]; gname, base = grades[gi]
    pt = random.random() < (.32 if g == "Female" else .08)
    pay = base * random.gauss(1, .08) * (0.97 if pt else 1) * (1.08 if dep == "Technology" else 1)
    bonus = 0.0
    if random.random() < (.55 + .06 * gi) * (0.8 if pt else 1): bonus = round(pay * 1950 * random.uniform(.02, .06 + .03 * gi) * (0.6 if pt else 1), 2)
    rows.append([f"E{i+1:05d}", g, dep, gname, "Part-time" if pt else "Full-time", round(pay, 2), bonus])
if True:  # a handful of records with gender not recorded
    for r in random.sample(rows, 12): r[1] = "Not stated"
with open("employees.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Employee ID", "Gender", "Department", "Grade", "Working pattern", "Hourly pay", "Bonus paid"]); w.writerows(rows)
import statistics as st
m = [r[5] for r in rows if r[1] == "Male"]; fm = [r[5] for r in rows if r[1] == "Female"]
print(len(rows), "mean gap", round(1 - st.mean(fm) / st.mean(m), 4), "median gap", round(1 - st.median(fm) / st.median(m), 4))
