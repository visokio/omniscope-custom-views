"""Sample data for the Twitter View. posts.csv lists two public posts that X's developer documentation uses as
embedding examples (docs.x.com), by URL and by ID. The ID column is text: post IDs have up to 19 digits, more than
a number can hold exactly. The Team column is invented, to filter by."""
import csv
posts = [
    ("https://x.com/jack/status/20", "20", "jack", "Product"),
    ("https://x.com/Interior/status/463440424141459456", "463440424141459456", "Interior", "Marketing"),
]
with open("posts.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["Post URL", "Post ID", "Account", "Team"])
    w.writerows(posts)
print(len(posts), "posts")
