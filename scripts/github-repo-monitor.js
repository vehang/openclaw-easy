#!/usr/bin/env node
const https = require('https');

const CONFIG = {
  owner: 'openclaw',
  repo: 'openclaw',
  githubToken: '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',
  githubApi: 'https://api.github.com',
  appId: 'cli_a91476e0a5f8dbc0',
  appSecret: 'CRV8phtp1hTE7sz5tpwlCfGXnaIEvWCV',
  chatId: 'oc_ffc3e3276fcf68d1759933ec0e494ae8',
  stateFile: '/root/.openclaw/workspace/scripts/github-monitor-state.json',
};

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    https.get({
      hostname: u.hostname,
      path: u.pathname + u.search,
      headers: {
        'User-Agent': 'OpenClaw-NotifyBot',
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${CONFIG.githubToken}`,
      },
    }, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
    }).on('error', reject);
  });
}

function loadState() {
  const fs = require('fs');
  try { return JSON.parse(fs.readFileSync(CONFIG.stateFile, 'utf8')); }
  catch { return { lastSha: null, lastDate: null }; }
}
function saveState(s) {
  require('fs').writeFileSync(CONFIG.stateFile, JSON.stringify(s, null, 2));
}

function classifyCommit(msg) {
  const m = msg.toLowerCase();
  const conv = m.match(/^(\w[\w-]*)\(?([^\)]*)\)?:\s*/);
  const t = conv ? conv[1] : '';
  if (['feat','feature'].includes(t) || ['add','new','implement','support','introduce','create'].some(k=>m.includes(k))) return '✨ 新功能';
  if (['fix','bugfix'].includes(t) || ['fix','bug','patch','resolve','issue','crash','error'].some(k=>m.includes(k))) return '🐛 修复';
  if (['perf','performance'].includes(t) || ['perf','optim','speed','fast','improve','reduce'].some(k=>m.includes(k))) return '⚡ 性能优化';
  if (['refactor'].includes(t)) return '♻️ 重构';
  if (['docs','doc'].includes(t)) return '📝 文档';
  if (['test','tests'].includes(t)) return '🧪 测试';
  if (['ci','build'].includes(t)) return '🔧 构建';
  if (['style'].includes(t)) return '🎨 样式';
  if (['breaking','remove','deprecat','drop'].some(k=>m.includes(k))) return '⚠️ 破坏性变更';
  if (['chore','maint'].includes(t)) return '🔨 杂项';
  return '📦 其他';
}

function trunc(msg, len = 70) {
  const l = msg.split('\n')[0];
  return l.length <= len ? l : l.slice(0, len - 1) + '…';
}

async function fetchCommits(since) {
  const url = `${CONFIG.githubApi}/repos/${CONFIG.owner}/${CONFIG.repo}/commits?per_page=100${since ? `&since=${encodeURIComponent(since)}` : ''}`;
  const res = await httpsGet(url);
  if (res.message === 'Rate Limit Exceeded' || res.message?.includes('rate limit')) throw new Error('限速');
  return Array.isArray(res) ? res : [];
}

async function fetchMergedPRs(since) {
  const url = `${CONFIG.githubApi}/repos/${CONFIG.owner}/${CONFIG.repo}/pulls?state=closed&sort=updated&direction=desc&per_page=50`;
  const res = await httpsGet(url);
  const all = (Array.isArray(res) ? res : []).filter(p => p.merged_at);
  const cutoff = since ? new Date(since) : new Date(Date.now() - 24*60*60*1000);
  return all.filter(pr => new Date(pr.merged_at) >= cutoff);
}

function buildCard(commits, prs) {
  if (commits.length === 0 && prs.length === 0) return null;
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const elements = [];

  // 已合并PR
  if (prs.length > 0) {
    elements.push({
      tag: 'div',
      fields: [
        { is_short: true, text: { tag: 'lark_md', content: '**🔀 合并请求**' } },
        { is_short: true, text: { tag: 'lark_md', content: `共 ${prs.length} 个` } }
      ]
    });
    for (const pr of prs) {
      elements.push({
        tag: 'div',
        text: { tag: 'lark_md', content: `• ✅ [#${pr.number}](${pr.html_url}) ${trunc(pr.title, 60)} — ${pr.user.login}` }
      });
    }
    elements.push({ tag: 'hr' });
  }

  // 提交
  if (commits.length > 0) {
    const groups = {};
    for (const c of commits) {
      const cat = classifyCommit(c.commit.message);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(c);
    }
    const order = ['⚠️ 破坏性变更','✨ 新功能','🐛 修复','⚡ 性能优化','♻️ 重构','📝 文档','🧪 测试','🎨 样式','🔧 构建','🔨 杂项','📦 其他'];
    const sorted = Object.keys(groups).sort((a,b) => {
      const ai = order.indexOf(a), bi = order.indexOf(b);
      return (ai===-1?99:ai)-(bi===-1?99:bi);
    });

    const highCount = groups['✨ 新功能']?.length || 0
      + (groups['🐛 修复']?.length || 0)
      + (groups['⚡ 性能优化']?.length || 0)
      + (groups['⚠️ 破坏性变更']?.length || 0);

    elements.push({
      tag: 'div',
      fields: [
        { is_short: true, text: { tag: 'lark_md', content: '**📊 代码提交**' } },
        { is_short: true, text: { tag: 'lark_md', content: `共 ${commits.length} 次 · 重点 ${highCount} 项` } }
      ]
    });

    for (const cat of sorted) {
      const items = groups[cat];
      elements.push({
        tag: 'div',
        fields: [
          { is_short: true, text: { tag: 'lark_md', content: `**${cat}** (${items.length})` } },
          { is_short: true, text: { tag: 'lark_md', content: '' } }
        ]
      });
      for (const item of items) {
        const sha = item.sha.slice(0, 7);
        const author = item.commit.author?.name || '';
        const link = item.html_url || `https://github.com/${CONFIG.owner}/${CONFIG.repo}/commit/${item.sha}`;
        const line = author
          ? `• [\`${sha}\`](${link}) ${trunc(item.commit.message, 65)} — ${author}`
          : `• [\`${sha}\`](${link}) ${trunc(item.commit.message, 65)}`;
        elements.push({ tag: 'div', text: { tag: 'lark_md', content: line } });
      }
    }

    // 贡献者
    const authors = {};
    for (const c of commits) {
      const n = c.commit.author?.name || '未知';
      authors[n] = (authors[n] || 0) + 1;
    }
    const authorStr = Object.entries(authors).sort((a,b)=>b[1]-a[1]).map(([n,c])=>`${n}(${c})`).join('、');
    elements.push({ tag: 'hr' });
    elements.push({ tag: 'div', text: { tag: 'lark_md', content: `**👥 贡献者**: ${authorStr}` } });
  }

  elements.push({ tag: 'note', elements: [{ tag: 'plain_text', content: `openclaw/openclaw 每日监控 · ${dateStr}` }] });

  return {
    config: { wide_screen_mode: true },
    header: {
      template: 'purple',
      title: { tag: 'plain_text', content: `🐙 OpenClaw 仓库日报 - ${dateStr}` }
    },
    elements,
  };
}

async function getFeishuToken() {
  const res = await new Promise((resolve, reject) => {
    const d = JSON.stringify({ app_id: CONFIG.appId, app_secret: CONFIG.appSecret });
    const req = https.request({
      hostname: 'open.feishu.cn',
      path: '/open-apis/auth/v3/tenant_access_token/internal',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d) },
    }, (r) => { let b=''; r.on('data',c=>b+=c); r.on('end',()=>resolve(JSON.parse(b))); });
    req.on('error', reject); req.write(d); req.end();
  });
  return res.tenant_access_token;
}

async function sendCard(card) {
  const token = await getFeishuToken();
  const d = JSON.stringify({ receive_id: CONFIG.chatId, msg_type: 'interactive', content: JSON.stringify(card) });
  const res = await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'open.feishu.cn',
      path: '/open-apis/im/v1/messages?receive_id_type=chat_id',
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d) },
    }, (r) => { let b=''; r.on('data',c=>b+=c); r.on('end',()=>resolve(JSON.parse(b))); });
    req.on('error', reject); req.write(d); req.end();
  });
  if (res.code !== 0) throw new Error(`发送失败: ${res.code} ${res.msg}`);
}

async function main() {
  const state = loadState();
  const since = state.lastDate || null;
  console.log(`获取范围: ${since || '首次运行(近24小时)'}`);

  let commits = await fetchCommits(since);
  if (!since && commits.length > 0) {
    const cutoff = new Date(Date.now() - 24*60*60*1000).toISOString();
    commits = commits.filter(c => new Date(c.commit.author.date) >= new Date(cutoff));
  }
  if (state.lastSha && commits.length > 0) {
    const i = commits.findIndex(c => c.sha === state.lastSha);
    if (i >= 0) commits = commits.slice(0, i);
  }

  const prs = await fetchMergedPRs(since);

  if (commits.length === 0 && prs.length === 0) {
    console.log('无新变更，跳过');
    return;
  }

  console.log(`提交: ${commits.length}, 已合并PR: ${prs.length}`);
  const card = buildCard(commits, prs);
  if (!card) return;

  await sendCard(card);
  console.log('✅ 已发送');

  const dates = [];
  if (commits.length > 0) dates.push(new Date(commits[0].commit.author.date).getTime());
  if (prs.length > 0) dates.push(new Date(prs[0].merged_at).getTime());
  const latestDate = new Date(Math.max(...dates)).toISOString();
  const latestSha = commits.length > 0 ? commits[0].sha : state.lastSha;
  saveState({ lastSha: latestSha, lastDate: latestDate });
  console.log(`状态已更新: ${latestDate.slice(0,19)}`);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
