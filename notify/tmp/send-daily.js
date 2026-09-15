const https = require('https');
const CONFIG = {
  appId: 'cli_a91476e0a5f8dbc0',
  appSecret: 'CRV8phtp1hTE7sz5tpwlCfGXnaIEvWCV',
  openId: 'ou_7172afb8fa3c2f51bb02b6af097a4b27',
};

function post(path, data, token) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const headers = { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) };
    if (token) headers.Authorization = `Bearer ${token}`;
    const req = https.request({ hostname: 'open.feishu.cn', path, method: 'POST', headers }, (r) => {
      let b = ''; r.on('data', c => b += c); r.on('end', () => resolve(JSON.parse(b)));
    });
    req.on('error', reject); req.write(body); req.end();
  });
}

const prs = [
  ['149012','修复依赖代理信任欺骗漏洞（2026.7.33）','RomneyDa'],
  ['148984','修复 Codex 目录控制调用过慢时显示各阶段耗时','steipete'],
  ['148699','重构测试：复用 Google Chat 运行时夹具','steipete'],
  ['149035','修复测试：区分账号健康与模型可用性','steipete'],
  ['149049','修复测试：恢复思维路由认证夹具','vincentkoc'],
  ['149040','改进飞书：加快长单元格文本表格的预处理','steipete'],
  ['149020','测试网关：将目录发布与定时启动隔离','vincentkoc'],
  ['147589','重构 SSH：移除未使用的隧道句柄元数据','vincentkoc'],
  ['146009','修复多行 /steer 消息丢失首行之外内容的问题','masatohoshino'],
  ['149038','修复：恢复 Copilot 仅凭据登录选项','steipete'],
  ['149001','修复 CI：修复 Copilot 契约与配置失败诊断','vincentkoc'],
  ['148773','改进会话：复用编译的记录元数据查询','vincentkoc'],
  ['149023','测试：刷新模型设置夹具并保护只读认证读取','steipete'],
  ['148949','重构：复用网页搜索请求准备工作','steipete'],
  ['149016','修复 CI：移除重复的 Copilot 认证元数据','vincentkoc'],
  ['148644','重构网关：集中化设备令牌拒绝响应','vincentkoc'],
  ['148883','修复：压缩提交共同作者中省略自动化服务别名','roboclaw-bot'],
  ['143500','改进网关：仅在重载请求时加载定时任务','vincentkoc'],
  ['148981','测试插件：对齐 Copilot 认证选择注册表预期','vincentkoc'],
  ['149004','测试代理：对齐认证夹具与运行时存储读取','vincentkoc'],
];

// [sha, 概括, 作者, 类别]
const commits = [
  ['e00500a6','修复 Codex 目录控制调用过慢时显示各阶段耗时','Peter Steinberger','修复'],
  ['faf4e68f','重构测试：复用 Google Chat 运行时侦听器','Peter Steinberger','重构'],
  ['c0be2659','修复测试：区分账号健康与模型可用性','Peter Steinberger','修复'],
  ['ed264cc3','修复测试：恢复思维路由认证夹具','Vincent Koc','修复'],
  ['f1957d9e','改进飞书：加快长单元格文本表格预处理','Peter Steinberger','性能优化'],
  ['178f9139','测试网关：将模型发布与定时启动隔离','Vincent Koc','测试'],
  ['92877d15','重构 SSH：移除未使用的隧道句柄元数据','Vincent Koc','重构'],
  ['88696dc1','修复多行 /steer 消息丢失首行之外内容','Masato Hoshino','修复'],
  ['80936b09','修复：恢复 Copilot 仅凭据登录选项','Peter Steinberger','修复'],
  ['84114b5a','改进会话：复用编译的记录元数据查询','Vincent Koc','性能优化'],
  ['f31b4192','修复 CI：修复 Copilot 契约与配置失败诊断','Vincent Koc','修复'],
  ['1226eecf','测试：对齐模型认证与设置夹具','Peter Steinberger','测试'],
  ['5590248a','重构：复用网页搜索请求上下文','Peter Steinberger','重构'],
  ['ba441dd2','修复 CI：移除重复 Copilot 认证元数据','Vincent Koc','修复'],
  ['d872aaba','测试代理：认证夹具对齐运行时存储读取','Vincent Koc','测试'],
  ['2f00b4e3','改进：减少提醒维护期间的数据获取','Peter Steinberger','性能优化'],
  ['9eeb47e4','修复定时任务：会话清理空闲时跳过可用性检查','Ayaan Zaidi','修复'],
  ['fa324f25','修复认证：防护 GitHub Copilot 设备流授权端点','Vincent Koc','修复'],
  ['7df9f83f','修复代理：防止前台执行被提前恢复中断','Ayaan Zaidi','修复'],
  ['0a40e770','修复 Copilot：移除已退役的 Raptor mini 模型','Vincent Koc','修复'],
  ['0b792cf9','改进飞书：减少含表格文档的准备工作','Peter Steinberger','性能优化'],
  ['3c6800b2','改进：减少记录参与者时的数据库操作','Peter Steinberger','性能优化'],
  ['0f86e027','测试：插件断言中接受 Bun 错误标签','Peter Steinberger','测试'],
  ['ee97b51e','修复模型：明确已存账号健康与目录状态','Ayaan Zaidi','修复'],
  ['2b8c9f1a','测试插件：对齐 Copilot 认证选择注册表预期','Vincent Koc','测试'],
  ['649610c8','修复频道：拒绝空整数频道添加选项','NIO','修复'],
  ['77124fdb','修复 UI：聊天导航后保留归档撤销','Peter Steinberger','修复'],
  ['27292a11','新功能：macOS 与 iOS 聊天中显示引用来源预览','Peter Steinberger','新功能'],
  ['1335104d','修复：聊天流式传输时避免冗余标签页更新','Peter Steinberger','修复'],
  ['013f409f','测试问答：通过 Crabline 运行 Discord','Dallin Romney','测试'],
  ['00a45555','性能优化：worker 下载期间预准备项目运行时','Peter Steinberger','性能优化'],
  ['237563a4','改进：减少配置文件元数据操作的数据获取','Peter Steinberger','性能优化'],
  ['163354b2','改进技能：减少文件编辑高峰期的轮询','Peter Steinberger','性能优化'],
  ['b5f3f506','测试自动回复：压缩回复分发矩阵','Dallin Romney','测试'],
  ['1fa47a01','测试工具：压缩文档镜像场景','Dallin Romney','测试'],
  ['5e3dc693','测试出站：压缩消息操作矩阵','Dallin Romney','测试'],
  ['1c69a3fe','测试矩阵：压缩提及夹具矩阵','Dallin Romney','测试'],
  ['55947755','改进：避免工作树清理时重复读取模板','Peter Steinberger','性能优化'],
  ['140ae965','改进：减少重复的会话读取停顿','Peter Steinberger','性能优化'],
  ['d0c80521','改进：全新 mDNS 安装跳过旧版迁移扫描','Peter Steinberger','性能优化'],
  ['baf188fe','修复 CI：选择测试消费者时保留已变更测试','Vincent Koc','修复'],
  ['8618ee31','修复 UI：仅在打开时加载系统繁忙状态','Vincent Koc','修复'],
  ['03c158fb','新功能：Android 聊天中显示引用来源预览','Peter Steinberger','新功能'],
  ['a10df27f','修复模型：新登录在设置验证期间保持有效','Ayaan Zaidi','修复'],
  ['0eff93e4','修复认证：OpenRouter 登录返回本地网关','Ayaan Zaidi','修复'],
  ['f97823d6','修复模型：设置页面间共享账号连接','Ayaan Zaidi','修复'],
  ['b585f460','重构 AI：移除未使用的整形测试传输设置','Vincent Koc','重构'],
  ['151a13a3','性能优化：提供者选择时复用策略准备','Peter Steinberger','性能优化'],
  ['1d2b236b','修复设置：省略模型默认值时激活自定义提供者','Ayaan Zaidi','修复'],
  ['b818f745','重构用量：规范化 Claude 响应到用量窗口','Peter Steinberger','重构'],
];

const order = ['新功能','修复','性能优化','重构','文档','测试','构建','杂项','其他'];
const icons = { '新功能':'✨','修复':'🐛','性能优化':'⚡','重构':'♻️','文档':'📝','测试':'🧪','构建':'🔧','杂项':'🔨','其他':'📦' };

function commitLine([sha, txt, author]) {
  return `[${sha}](https://github.com/openclaw/openclaw/commit/${sha}) ${txt} — ${author}`;
}
function prLine([num, txt, author]) {
  return `✅ [#${num}](https://github.com/openclaw/openclaw/pull/${num}) ${txt} — ${author}`;
}

const elements = [];
elements.push({ tag: 'div', text: { tag: 'lark_md', content: `**🔀 合并请求（${prs.length} 个）**` } });
for (const p of prs) elements.push({ tag: 'div', text: { tag: 'lark_md', content: prLine(p) } });
elements.push({ tag: 'hr' });
elements.push({ tag: 'div', text: { tag: 'lark_md', content: `**📊 代码提交（${commits.length} 条）**` } });
for (const cat of order) {
  const list = commits.filter(c => c[3] === cat);
  if (!list.length) continue;
  const lines = list.map(commitLine);
  elements.push({ tag: 'div', text: { tag: 'lark_md', content: `${icons[cat]} **${cat}**（${list.length}）\n${lines.join('\n')}` } });
}
const authors = {};
for (const c of commits) authors[c[2]] = (authors[c[2]] || 0) + 1;
const authorStr = Object.entries(authors).sort((a,b)=>b[1]-a[1]).map(([n,c])=>`${n}(${c})`).join('、');
elements.push({ tag: 'hr' });
elements.push({ tag: 'div', text: { tag: 'lark_md', content: `**👥 贡献者统计**：${authorStr}` } });
elements.push({ tag: 'note', elements: [{ tag: 'plain_text', content: 'openclaw/openclaw 每日监控 · 2026-09-15' }] });

const card = {
  config: { wide_screen_mode: true },
  header: { template: 'purple', title: { tag: 'plain_text', content: '🐙 OpenClaw 仓库日报 - 2026-09-15' } },
  elements,
};

async function main() {
  const t = await post('/open-apis/auth/v3/tenant_access_token/internal', { app_id: CONFIG.appId, app_secret: CONFIG.appSecret });
  if (!t.tenant_access_token) throw new Error('token failed: ' + JSON.stringify(t));
  const res = await post('/open-apis/im/v1/messages?receive_id_type=open_id',
    { receive_id: CONFIG.openId, msg_type: 'interactive', content: JSON.stringify(card) }, t.tenant_access_token);
  if (res.code !== 0) throw new Error('send failed: ' + JSON.stringify(res));
  console.log('✅ sent', res.data?.message_id || '');
}
main().catch(e => { console.error('❌', e.message); process.exit(1); });
