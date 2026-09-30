#!/usr/bin/env node
// OpenClaw 仓库日报推送
const https = require('https');
const APP_ID = 'cli_a91476e0a5f8dbc0';
const APP_SECRET = 'CRV8phtp1hTE7sz5tpwlCfGXnaIEvWCV';
const USER_ID = 'ou_7172afb8fa3c2f51bb02b6af097a4b27';

function postJSON(url, body, headers) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = JSON.stringify(body);
    const req = https.request({ hostname: u.hostname, path: u.pathname + u.search, method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }, headers || {}) },
      res => { let b = ''; res.on('data', c => b += c); res.on('end', () => { try { resolve(JSON.parse(b)); } catch (e) { reject(new Error(b)); } }); });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

const BASE = 'https://github.com/openclaw/openclaw';
const prLine = (n, txt, who) => `✅ [#${n}](${BASE}/pull/${n}) ${txt} — ${who}`;
const coLine = (sha, txt, who) => `[${sha}](${BASE}/commit/${sha}) ${txt} — ${who}`;

const prs = [
  prLine(161813, '等待前序更新的停止回执，完善更新流程', 'steipete'),
  prLine(161868, '修复无效规范重读后网关写入未落盘问题', 'steipete'),
  prLine(161870, '简化旧版迁移结果处理逻辑', 'steipete'),
  prLine(161864, '完成 UI 库与外壳第三轮代码清理', 'steipete'),
  prLine(161862, '修复 macOS 运行时固件未通过静态检查', 'roboclaw-bot'),
  prLine(161579, '等待运行时隔离健康写入完成', 'steipete'),
  prLine(160812, '修复持久会话重试导致节点宿主冻结', 'RileyJJY'),
  prLine(161860, '修复活动页工具筛选器选中状态丢失', 'steipete'),
  prLine(161831, '嵌入缓存写入移出主线程，减少卡顿', 'steipete'),
  prLine(161842, '修复工作区暂存后入站图片预览丢失', 'brandon-julio-t'),
  prLine(161849, '空闲 worker 盘点扫描移出网关线程', 'steipete'),
  prLine(161574, '共享浏览器会议传输层脚手架代码', 'steipete'),
  prLine(161844, '简化 Apple 端解析器与生命周期控制流', 'steipete'),
  prLine(161822, '修复 SQLite 竞争后原生中继查找失败', 'steipete'),
  prLine(161846, '移除不可达的 WebSocket 固件方法', 'vincentkoc'),
  prLine(161835, '删除低价值测试（批次 d112）', 'steipete'),
  prLine(161714, '删除低价值测试（批次 d110）', 'steipete'),
  prLine(161655, '标记 worker 写入并预过滤 cron 历史，提升性能', 'steipete'),
  prLine(161820, '修复父会话挂起期间子代理私有结果异常', 'steipete'),
  prLine(161628, '通过单一工厂声明浏览器会议插件', 'steipete'),
  prLine(161834, '修复被排除的系统会话被误报为脏数据', 'obviyus'),
  prLine(161837, '精简 UI 页面代码（第七轮）', 'steipete'),
  prLine(161796, '删除低价值测试（批次 d111）', 'steipete'),
  prLine(161843, '精简会话运行时注释噪音', 'steipete'),
  prLine(159683, '修复记忆库非 ASCII 搜索查询漏页问题', 'Yigtwxx'),
  prLine(161815, '合并文件名上限断言代码', 'vincentkoc'),
  prLine(159999, '精简网关核心文件代码', 'steipete'),
  prLine(161764, 'Bun 构建释放原生句柄时保持 SQLite worker 存活', 'steipete'),
  prLine(161785, '刷新控制台 UI 多语言文案', 'openclaw-mantis[bot]'),
];

const cat = {
  '修复': [
    ['cd59fe8', '修复无效规范重读后配置写入未落盘', 'Peter Steinberger'],
    ['40367c4', '修复工具链 REST 准入未在最终授权前完成', 'Peter Steinberger'],
    ['fc6a5b4', '修复 macOS 运行时固件静态检查失败', 'RoboClaw'],
    ['1de9a42', '修复持久会话重试冻结节点宿主', 'RileyJJY'],
    ['e211327', '修复活动页工具筛选器选中丢失', 'Peter Steinberger'],
    ['728d16e', '修复工作区暂存后入站图片预览丢失', 'Brandon Julio Thenaro'],
    ['71156a0', '修复 SQLite 竞争后原生中继查找失败', 'Peter Steinberger'],
    ['e96303d', '修复被取消的类型检查误报失败', 'Peter Steinberger'],
    ['4b08683', '修复工具调用被拒后可选静默未保留', 'Peter Steinberger'],
    ['f2889ab', '修复暂存期间子代理私有结果发布异常', 'Peter Steinberger'],
    ['eca7e19', '修复被排除的系统会话误报为脏数据', 'Ayaan Zaidi'],
    ['872c9ba', '卡住的会话轮次改为提示用户重试', 'Ayaan Zaidi'],
    ['ac7fd54', '修复 sessions_yield 错误拒绝受监控子任务', 'Peter Steinberger'],
    ['943286f', '修复重连后温启动缓存清理归属', 'Peter Steinberger'],
    ['40a2e47', '修复自动回复改用注册表内本地解析器', 'Peter Steinberger'],
    ['7d80521', '修复记忆库非 ASCII 搜索漏页', 'Yiğit ERDOĞAN'],
    ['b2d779b', '修复切换聊天后忽略迟到的动作结果', 'Peter Steinberger'],
  ],
  '性能优化': [
    ['1ec7b42', '嵌入缓存写入移出主线程', 'Peter Steinberger'],
    ['e1b701b', '标记 worker 写入并预过滤 cron 历史提升解码性能', 'Peter Steinberger'],
    ['fcd59e6', 'Bun 释放原生句柄时保持 SQLite worker 存活', 'Peter Steinberger'],
  ],
  '重构': [
    ['79a2400', '等待前序更新停止回执的 SQLite worker 改造', 'Peter Steinberger'],
    ['51e5503', '简化旧版迁移结果处理', 'Peter Steinberger'],
    ['6e6c877', '完成 UI 库与外壳第三轮清理', 'Peter Steinberger'],
    ['3875fd5', '等待运行时隔离健康写入完成', 'Peter Steinberger'],
    ['f88c435', '精简二级渠道插件代码（第三轮）', 'Peter Steinberger'],
    ['5475899', '空闲 worker 盘点扫描移出网关线程', 'Peter Steinberger'],
    ['19f112e', '共享浏览器会议传输层脚手架', 'Peter Steinberger'],
    ['cfbedbe', '简化 Apple 端解析器与生命周期控制流', 'Peter Steinberger'],
    ['4026086', '移除不可达的 WebSocket 固件方法', 'Vincent Koc'],
    ['03e179c', '精简会话运行时注释噪音', 'Peter Steinberger'],
    ['537c33e', '精简 UI 页面代码（第七轮）', 'Peter Steinberger'],
    ['bf4b16a', '通过单一工厂声明浏览器会议插件', 'Peter Steinberger'],
    ['91fbec7', '移除 SDK 测试固件中未使用的成员', 'Vincent Koc'],
    ['c0a0c09', '移除 Apple 端冗余 Swift 包装与检查', 'Peter Steinberger'],
    ['509cb47', '工作区日志存储移出网关线程', 'Peter Steinberger'],
    ['93aea7c', '恢复终端与转录行数限制', 'Peter Steinberger'],
    ['9280c61', '精简核心状态/技能/日志等辅助代码（第三轮）', 'Peter Steinberger'],
    ['ce203b3', '复用恢复与 schema 负责人逻辑', 'Peter Steinberger'],
    ['8c9040c', '合并媒体文件名上限断言', 'Vincent Koc'],
    ['d527aa5', '精简插件 SDK 内部代码', 'Peter Steinberger'],
    ['97d5a08', '精简 UI 库与外壳代码（第三轮）', 'Peter Steinberger'],
  ],
  '测试': [
    ['72cca0d', '删除低价值测试（批次 d112）', 'Peter Steinberger'],
    ['b06666e', '删除低价值测试（批次 d110）', 'Peter Steinberger'],
    ['4d63cbe', '删除低价值测试（批次 d111）', 'Peter Steinberger'],
    ['0c0faf0', '删除低价值测试（批次 d106）', 'Peter Steinberger'],
    ['5bfb545', '网关测试改为等待总结完成而非轮询', 'Peter Steinberger'],
    ['7db6ea3', '修复浏览器采集期间侧边栏重载', 'Peter Steinberger'],
    ['f97c521', '测试改用排空会话运行替代固定等待', 'Abi X Renhart'],
  ],
  '构建': [
    ['c2ac326', 'macOS 应用运行时锁定到指定 Bun 版本', 'Peter Steinberger'],
    ['0361956', '移除过期的引导代码行数基线限制', 'Vincent Koc'],
  ],
};

const md = [];
md.push('**🔀 合并请求（近 24 小时共 ' + prs.length + ' 个）**');
md.push(...prs);
md.push('');
md.push('**📊 代码提交（共 50 笔，按类别分组）**');
const emoji = { '修复': '🐛', '性能优化': '⚡', '重构': '♻️', '测试': '🧪', '构建': '📦' };
for (const [name, items] of Object.entries(cat)) {
  md.push('');
  md.push(`${emoji[name] || '•'} **${name}**（${items.length}）`);
  md.push(...items.map(([s, t, w]) => coLine(s, t, w)));
}
md.push('');
md.push('**👥 贡献者统计**：steipete（39）、Vincent Koc（4）、Ayaan Zaidi（2）、RileyJJY、Brandon Julio Thenaro、Yiğit ERDOĞAN、Abi X Renhart、RoboClaw 各 1，共 9 位贡献者');

const card = {
  config: { wide_screen_mode: true },
  header: { template: 'purple', title: { tag: 'plain_text', content: '🐙 OpenClaw 仓库日报 - 2026-09-30' } },
  elements: [{ tag: 'div', text: { tag: 'lark_md', content: md.join('\n') } }],
};

async function main() {
  const t = await postJSON('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', { app_id: APP_ID, app_secret: APP_SECRET });
  if (t.code !== 0) throw new Error('token 失败: ' + t.msg);
  const r = await postJSON('https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id',
    { receive_id: USER_ID, msg_type: 'interactive', content: JSON.stringify(card) },
    { Authorization: 'Bearer ' + t.tenant_access_token });
  if (r.code !== 0) throw new Error('发送失败: ' + r.code + ' ' + r.msg);
  console.log('OK message_id=' + (r.data && r.data.message_id));
}
main().catch(e => { console.error(e.message); process.exit(1); });
