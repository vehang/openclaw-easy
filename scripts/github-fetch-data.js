#!/usr/bin/env node
/**
 * 只负责拉取 GitHub 数据，输出 JSON 到 stdout
 */
const https = require('https');

const CONFIG = {
  owner: 'openclaw', repo: 'openclaw',
  token: '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',
  stateFile: '/root/.openclaw/workspace/scripts/github-monitor-state.json',
};

function get(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    https.get({
      hostname: u.hostname, path: u.pathname + u.search,
      headers: { 'User-Agent': 'bot', 'Accept': 'application/vnd.github.v3+json', 'Authorization': `token ${CONFIG.token}` },
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve([]); } });
    }).on('error', reject);
  });
}

async function main() {
  const fs = require('fs');
  let state = { lastSha: null, lastDate: null };
  try { state = JSON.parse(fs.readFileSync(CONFIG.stateFile, 'utf8')); } catch {}
  const since = state.lastDate || null;

  // Commits
  let commits = await get(`https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/commits?per_page=100${since ? `&since=${encodeURIComponent(since)}` : ''}`);
  if (!since && commits.length > 0) {
    const cutoff = new Date(Date.now() - 24*60*60*1000).toISOString();
    commits = commits.filter(c => new Date(c.commit.author.date) >= new Date(cutoff));
  }
  if (state.lastSha && commits.length > 0) {
    const i = commits.findIndex(c => c.sha === state.lastSha);
    if (i >= 0) commits = commits.slice(0, i);
  }

  // Merged PRs only
  const allPRs = await get(`https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/pulls?state=closed&sort=updated&direction=desc&per_page=50`);
  const prs = allPRs.filter(p => p.merged_at);
  const cutoff = since ? new Date(since) : new Date(Date.now() - 24*60*60*1000);
  const mergedPRs = prs.filter(p => new Date(p.merged_at) >= cutoff);

  // 输出 JSON
  const result = {
    commits: commits.map(c => ({
      sha: c.sha, url: c.html_url,
      message: c.commit.message.split('\n')[0],
      author: c.commit.author?.name || '',
      date: c.commit.author?.date || '',
    })),
    prs: mergedPRs.map(p => ({
      number: p.number, url: p.html_url,
      title: p.title, author: p.user.login,
      merged_at: p.merged_at,
      body: (p.body || '').slice(0, 500),
    })),
  };

  console.log(JSON.stringify(result));

  // 更新状态
  if (commits.length > 0 || mergedPRs.length > 0) {
    const dates = [];
    if (commits.length > 0) dates.push(new Date(commits[0].date).getTime());
    if (mergedPRs.length > 0) dates.push(new Date(mergedPRs[0].merged_at).getTime());
    state.lastDate = new Date(Math.max(...dates)).toISOString();
    if (commits.length > 0) state.lastSha = commits[0].sha;
    fs.writeFileSync(CONFIG.stateFile, JSON.stringify(state, null, 2));
  }
}
main().catch(e => { console.error(JSON.stringify({error: e.message})); process.exit(1); });
