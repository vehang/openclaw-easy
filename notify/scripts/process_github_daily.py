import json
from datetime import datetime, timezone, timedelta

with open('/root/.openclaw/workspace/notify/scripts/commits.json') as f:
    text = f.read()
    idx = text.find('[')
    if idx > 0:
        text = text[idx:]
    commits_data = json.loads(text)

with open('/root/.openclaw/workspace/notify/scripts/prs.json') as f:
    text = f.read()
    idx = text.find('[')
    if idx > 0:
        text = text[idx:]
    prs_data = json.loads(text)

last_sha = "ae9474b5fdc0c2f90a2b82356734d86637754d97"
now = datetime.now(timezone.utc)
cutoff = now - timedelta(hours=24)

new_commits = []
for c in commits_data:
    sha = c.get('sha', '')
    if sha == last_sha:
        break
    commit_date = c.get('commit', {}).get('author', {}).get('date', '')
    if commit_date:
        try:
            dt = datetime.fromisoformat(commit_date.replace('Z', '+00:00'))
            if dt >= cutoff:
                new_commits.append(c)
        except:
            pass

merged_prs = []
for pr in prs_data:
    merged_at = pr.get('merged_at')
    if merged_at:
        try:
            dt = datetime.fromisoformat(merged_at.replace('Z', '+00:00'))
            if dt >= cutoff:
                merged_prs.append(pr)
        except:
            pass

print("=== NEW COMMITS ===")
for c in new_commits:
    sha = c['sha'][:7]
    msg = c['commit']['message'].split('\n')[0]
    author = c.get('author', {}).get('login', c['commit']['author']['name'])
    date = c['commit']['author']['date']
    html_url = c.get('html_url', '')
    print(f"SHA: {sha}")
    print(f"MSG: {msg}")
    print(f"AUTHOR: {author}")
    print(f"DATE: {date}")
    print(f"URL: {html_url}")
    print("---")

print("\n=== MERGED PRs ===")
for pr in merged_prs:
    num = pr['number']
    title = pr['title']
    author = pr.get('user', {}).get('login', '')
    merged = pr.get('merged_at', '')
    html_url = pr.get('html_url', '')
    print(f"NUM: {num}")
    print(f"TITLE: {title}")
    print(f"AUTHOR: {author}")
    print(f"MERGED: {merged}")
    print(f"URL: {html_url}")
    print("---")

print(f"\nTotal new commits: {len(new_commits)}")
print(f"Total merged PRs: {len(merged_prs)}")

contributors = set()
for c in new_commits:
    contributors.add(c.get('author', {}).get('login', c['commit']['author']['name']))
for pr in merged_prs:
    contributors.add(pr.get('user', {}).get('login', ''))
print(f"Contributors: {', '.join(sorted(contributors))}")
