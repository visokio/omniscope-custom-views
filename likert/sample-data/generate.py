"""Illustrative employee survey for the Likert view (invented). survey_responses.csv: 640 respondents in five
departments answering 10 agreement statements (one row per answer, some "Prefer not to say"). enps.csv: the
same respondents' 0 to 10 answer to "How likely are you to recommend working here?"."""
import csv, random
random.seed(12)
Q = [("I understand how my work contributes to our goals", .9), ("I have the tools I need to do my job well", .3), ("My manager gives me useful feedback", .4),
     ("I feel recognised for good work", -.2), ("Workload in my team is manageable", -.5), ("I see a path to grow my career here", -.3),
     ("Communication from leadership is clear", 0.0), ("I would recommend our products to a friend", .7), ("My team works well together", .8), ("I intend to be working here in two years", .2)]
D = {"Sales": -.2, "Operations": -.4, "Technology": .2, "Finance": .1, "Customer service": -.1}
S = ["Strongly disagree", "Disagree", "Neither agree nor disagree", "Agree", "Strongly agree"]
rows = []; en = []
for i in range(640):
    rid = f"R{i+1:04d}"; dep = random.choices(list(D), weights=[3, 4, 2, 1, 3])[0]; ten = random.choice(["Under 1 year", "1 to 3 years", "3 to 5 years", "Over 5 years"])
    mood = random.gauss(0, .7) + D[dep]
    for q, b in Q:
        if random.random() < .03: rows.append([rid, dep, ten, q, "Prefer not to say"]); continue
        x = b + mood + (-.5 if q.startswith("Workload") and dep == "Operations" else 0) + random.gauss(0, .9)
        a = 0 if x < -1.4 else 1 if x < -.45 else 2 if x < .25 else 3 if x < 1.3 else 4
        rows.append([rid, dep, ten, q, S[a]])
    en.append([rid, dep, ten, max(0, min(10, round(7 + 2.2 * mood + random.gauss(0, 1.6))))])
with open("survey_responses.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Respondent", "Department", "Tenure", "Question", "Answer"]); w.writerows(rows)
with open("enps.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["Respondent", "Department", "Tenure", "Recommend score"]); w.writerows(en)
print(len(rows), len(en))
