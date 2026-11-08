"""Illustrative message data for the 3D Force Graph view (invented). messages.csv: who sent messages to whom in a
company of 60 people in six teams over a month, with the sender's team and the number of messages. Most messages
stay within a team; a few people link the teams."""
import csv, random
random.seed(7)
teams = ["Sales", "Marketing", "Engineering", "Operations", "Finance", "Support"]
first = ["Alex", "Bea", "Carlos", "Dana", "Eli", "Farah", "Gus", "Hana", "Ivo", "Jun", "Kai", "Lena", "Milo", "Nia",
         "Omar", "Pia", "Quin", "Rosa", "Sam", "Tara", "Uma", "Vic", "Wes", "Xena", "Yuri", "Zoe", "Amir", "Bo",
         "Cleo", "Dev"]
people = {}
for i in range(60):
    people[f"{first[i % 30]} {chr(65 + i // 30 * 7 + i % 7)}."] = teams[i % 6]
names = list(people)
links = {}
def add(a, b, n):
    if a != b:
        links[(a, b)] = links.get((a, b), 0) + n
for a in names:
    mates = [b for b in names if people[b] == people[a] and b != a]
    for b in random.sample(mates, 3):
        add(a, b, random.randint(3, 30))
# Bridges: one or two people per team talk to other teams.
for t in teams:
    members = [p for p in names if people[p] == t]
    for a in members[:2]:
        for b in random.sample([p for p in names if people[p] != t], 3):
            add(a, b, random.randint(1, 8))
rows = sorted([[a, b, people[a], n] for (a, b), n in links.items()])
with open("messages.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["From", "To", "Team", "Messages"])
    w.writerows(rows)
nodes = set(r[0] for r in rows) | set(r[1] for r in rows)
print(len(rows), len(nodes), sum(r[3] for r in rows), names[0], sum(1 for r in rows if r[0] == names[0] or r[1] == names[0]))
