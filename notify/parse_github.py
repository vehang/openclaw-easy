import json
from datetime import datetime, timedelta, timezone

with open('/tmp/commits.json') as f:
    commits = json.load(f)
with open('/tmp/prs.json') as f:
    prs = json.load(f)

now = datetime.now(timezone.utc)
cutoff = now - timedelta(hours=24)

recent_commits = []
for c in commits:
    date_str = c['commit']['committer']['date']
    dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    if dt >= cutoff:
        recent_commits.append({
            'sha': c['sha'],
            'short_sha': c['sha'][:7],
            'message': c['commit']['message'].split('\n')[0],
            'author': c['commit']['author']['name'],
            'date': dt.isoformat(),
            'url': c['html_url']
        })

recent_prs = []
for p in prs:
    if not p.get('merged_at'):
        continue
    merged_str = p['merged_at']
    dt = datetime.fromisoformat(merged_str.replace('Z', '+00:00'))
    if dt >= cutoff:
        recent_prs.append({
            'number': p['number'],
            'title': p['title'],
            'author': p['user']['login'],
            'merged_at': dt.isoformat(),
            'url': p['html_url']
        })

contributors = set()
for c in recent_commits:
    contributors.add(c['author'])
for p in recent_prs:
    contributors.add(p['author'])

result = {
    'commit_count': len(recent_commits),
    'pr_count': len(recent_prs),
    'contributor_count': len(contributors),
    'commits': recent_commits,
    'prs': recent_prs,
    'contributors': list(contributors),
    'latest_sha': commits[0]['sha'] if commits else None,
    'today': datetime.now(timezone(timedelta(hours=8))).strftime('%Y-%m-%d')
}

print(json.dumps(result, ensure_ascii=False))
