#!/bin/bash
# 获取 GitHub 数据，输出 JSON
STATE_FILE="/root/.openclaw/workspace/scripts/github-monitor-state.json"
TOKEN="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"
REPO="openclaw/openclaw"
API="https://api.github.com/repos/$REPO"

# 读取上次状态
LAST_DATE=""
LAST_SHA=""
if [ -f "$STATE_FILE" ]; then
  LAST_DATE=$(python3 -c "import json;print(json.load(open('$STATE_FILE')).get('lastDate',''))" 2>/dev/null)
  LAST_SHA=$(python3 -c "import json;print(json.load(open('$STATE_FILE')).get('lastSha',''))" 2>/dev/null)
fi

SINCE_PARAM=""
if [ -n "$LAST_DATE" ]; then
  SINCE_PARAM="&since=$(python3 -c "import urllib.parse;print(urllib.parse.quote('$LAST_DATE'))")"
fi

# 获取 commits
COMMITS=$(curl -s -H "Authorization: token $TOKEN" -H "Accept: application/vnd.github.v3+json" \
  "$API/commits?per_page=100$SINCE_PARAM")

# 获取已合并 PRs
ALL_PRS=$(curl -s -H "Authorization: token $TOKEN" -H "Accept: application/vnd.github.v3+json" \
  "$API/pulls?state=closed&sort=updated&direction=desc&per_page=50")

# 用 python3 处理数据
python3 << PYEOF
import json, sys
from datetime import datetime, timedelta, timezone

try:
    commits = json.loads('''$COMMITS''')
except:
    commits = []
try:
    all_prs = json.loads('''$ALL_PRS''')
except:
    all_prs = []

if not isinstance(commits, list):
    commits = []
if not isinstance(all_prs, list):
    all_prs = []

# 去重 commits
last_sha = "$LAST_SHA"
if last_sha and commits:
    idx = next((i for i, c in enumerate(commits) if c.get('sha') == last_sha), -1)
    if idx >= 0:
        commits = commits[:idx]

# 过滤24h（首次运行）
last_date = "$LAST_DATE"
if not last_date:
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    commits = [c for c in commits if datetime.fromisoformat(c['commit']['author']['date'].replace('Z','+00:00')) >= cutoff]

# 已合并 PRs
merged_prs = [p for p in all_prs if p.get('merged_at')]
if last_date:
    cutoff = datetime.fromisoformat(last_date.replace('Z','+00:00'))
    merged_prs = [p for p in merged_prs if datetime.fromisoformat(p['merged_at'].replace('Z','+00:00')) >= cutoff]
else:
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    merged_prs = [p for p in merged_prs if datetime.fromisoformat(p['merged_at'].replace('Z','+00:00')) >= cutoff]

# 输出
result = {
    "commits": [{
        "sha": c["sha"][:7],
        "url": c["html_url"],
        "message": c["commit"]["message"].split("\\n")[0],
        "author": c["commit"]["author"].get("name", ""),
        "date": c["commit"]["author"].get("date", ""),
    } for c in commits],
    "prs": [{
        "number": p["number"],
        "url": p["html_url"],
        "title": p["title"],
        "author": p["user"]["login"],
        "merged_at": p["merged_at"],
        "body": (p.get("body") or "")[:500],
    } for p in merged_prs],
}

print(json.dumps(result, ensure_ascii=False))

# 保存状态
if commits or merged_prs:
    dates = []
    if commits:
        dates.append(datetime.fromisoformat(commits[0]["commit"]["author"]["date"].replace('Z','+00:00')))
    if merged_prs:
        dates.append(datetime.fromisoformat(merged_prs[0]["merged_at"].replace('Z','+00:00')))
    new_state = {
        "lastDate": max(dates).isoformat(),
        "lastSha": commits[0]["sha"] if commits else "$LAST_SHA",
    }
    with open("$STATE_FILE", "w") as f:
        json.dump(new_state, f, indent=2)
PYEOF
