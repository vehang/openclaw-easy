#!/usr/bin/env node
// 构建 OpenClaw 仓库日报飞书卡片（数据: 2026-11-06T13:00Z 之后）
const fs = require('fs');

const repo = 'https://github.com/openclaw/openclaw';

const prs = [
  ['194606','修复 iOS 网关在 TLS 证书检查/待信任期间误显示离线','obviyus'],
  ['192745','启动配置守卫前先校验运行标志','jerome-queck'],
  ['194610','翻译更新时保留外观设置草稿','steipete'],
  ['194604','压缩自包含启动文档体积','steipete'],
  ['194602','模型选择列表复用厂商图标','steipete'],
  ['194593','修复含表单分隔符的音频上传路径','zhangguiping-xydt'],
  ['194596','全会话扫描包含隐藏的 tmux socket','zhangguiping-xydt'],
  ['194577','未见过的检出提交不再全量下载历史','steipete'],
  ['194582','修复图表通知误标 Pele 版本','roboclaw-bot'],
  ['194600','恢复外部厂商端点目录镜像','roboclaw-bot'],
  ['194589','回滚 fs-safe 0.28 集成回归','roboclaw-bot'],
  ['194603','原生通知正确标示内置 Pele 版本','vincentkoc'],
  ['194251','取消被中断的视频描述请求','Alix-007'],
  ['194181','写入前保留畸形 UTF-8 配置源','Alix-007'],
  ['194588','下载失败时保留转写文本','zhangguiping-xydt'],
  ['194567','大型空闲会话历史也能完成代理删除','steipete'],
  ['194584','重启后完成代理删除且不影响就绪检查','steipete'],
  ['194586','tmux 面板捕获失败后不再误匹配文本','zhangguiping-xydt'],
  ['194393','打开频道页无需加载聊天','steipete'],
  ['194579','保留字面转写提示词','zhangguiping-xydt'],
  ['194564','拒绝导入成本中厂商不匹配的数据','zhangguiping-xydt'],
  ['194583','Grok OAuth 订阅者在非 xAI 模型也可用 x_search','obviyus'],
  ['194503','回收已失效的关闭态分诊修复租约','roboclaw-bot'],
  ['194574','以行为验证 iOS 本地网络/Talk/URL 日志规则','obviyus'],
  ['194571','以行为验证 iOS 排版规则','obviyus'],
  ['194570','以行为验证 Watch 审批规则','obviyus'],
  ['194581','修正移动抽屉中运行会话空闲的度量','steipete'],
  ['194576','加载时保持 Worktrees 清理标签稳定','steipete'],
  ['194565','多客户端的 tmux 会话显示为已附加','zhangguiping-xydt'],
];

// [sha7, 分类, 概括, 作者]
const commits = [
  ['b7315ed','修复','iOS 网关在 TLS 证书检查/待信任期间误显示离线','Ayaan Zaidi'],
  ['312b580','修复','启动配置守卫前先校验运行标志','Jerome'],
  ['a53b8d2','修复','翻译更新时保留外观设置草稿','Peter Steinberger'],
  ['aa75d20','性能优化','压缩自包含启动文档体积','Peter Steinberger'],
  ['74dbd7c','修复','模型选择列表复用厂商图标','Peter Steinberger'],
  ['8333511','修复','修复含表单分隔符的音频上传路径','xingzhou'],
  ['1b72d4f','修复','全会话扫描包含隐藏的 tmux socket','xingzhou'],
  ['d90ede2','修复','图表通知误标 Pele 版本','RoboClaw'],
  ['f9ecbc8','修复','恢复外部厂商端点目录镜像','RoboClaw'],
  ['75694cc','修复','回滚 fs-safe 0.28 集成回归','RoboClaw'],
  ['3bc232a','修复','原生通知正确标示内置 Pele 版本','Vincent Koc'],
  ['4f61482','修复','下载失败时保留转写文本','xingzhou'],
  ['020ec24','修复','重启后完成代理删除且不影响就绪检查','Peter Steinberger'],
  ['f4668bd','修复','tmux 面板捕获失败后不再误匹配文本','xingzhou'],
  ['90d24e9','杂项','打开频道页无需加载聊天','Peter Steinberger'],
  ['0c3700a','修复','保留字面转写提示词','xingzhou'],
  ['17e15e2','修复','拒绝导入成本中厂商不匹配的数据','xingzhou'],
  ['748f3dc','修复','Grok OAuth 订阅者在非 xAI 模型也可用 x_search','Ayaan Zaidi'],
  ['689cfc8','修复','回收已失效的关闭态分诊修复租约','RoboClaw'],
  ['468d111','测试','以行为验证 iOS 本地网络/Talk/URL 日志规则','Ayaan Zaidi'],
  ['c2d855d','测试','以行为验证 iOS 排版规则','Ayaan Zaidi'],
  ['4fa7f86','测试','以行为验证 Watch 审批规则','Ayaan Zaidi'],
  ['498fa35','测试','修正移动抽屉中运行会话空闲的度量','Peter Steinberger'],
  ['382b76b','修复','多客户端的 tmux 会话显示为已附加','xingzhou'],
  ['fa180d8','修复','仅就绪更新后仍保存侧栏快照','Peter Steinberger'],
  ['9e373a6','测试','原生插件基准计入 HTTP 延迟','Peter Steinberger'],
  ['2cc89da','修复','未见过的检出提交不再全量下载历史','Peter Steinberger'],
  ['49aabab','构建','刷新原生多语言文案','openclaw-mantis[bot]'],
  ['0f6184f','修复','加载时保持 Worktrees 清理标签稳定','Peter Steinberger'],
  ['27f091b','构建','升级 fs-safe 至 0.28.0','Peter Steinberger'],
  ['d5d4f64','修复','自动重启后崩溃信息可见','Peter Steinberger'],
  ['440f9ee','修复','厂商按品牌名显示','Ayaan Zaidi'],
  ['851f1b0','新功能','Parallel 原生及经 OpenRouter 支持 Decisions','RoboClaw'],
  ['825f8fa','修复','保留回退运行时上下文信封','Peter Steinberger'],
  ['3f2e707','修复','大型空闲会话历史也能完成代理删除','Peter Steinberger'],
  ['07cdebc','修复','首帧聊天即显示缓存的详情页','Peter Steinberger'],
  ['8516107','修复','回复完成后保留粘性默认模型设置','Peter Steinberger'],
  ['b55baff','杂项','持久聊天错误统一使用共享 toast 样式','RoboClaw'],
  ['d02defd','构建','清理继承的测试预算与未用导出报错','Peter Steinberger'],
  ['13b9a49','构建','iOS 应用测试不再固定 Swift 源码文本','Ayaan Zaidi'],
  ['6914b5a','修复','sessions.reset 后保持侧栏颜色','Wang Rui'],
  ['87c57b4','重构','精简容器镜像仓库回读','Dallin Romney'],
  ['2f622db','测试','安装策略测试夹具与宿主临时目录权限隔离','Peter Steinberger'],
  ['10bbb1e','构建','依赖刷新至 2026-10-31 基线','Peter Steinberger'],
  ['2e83d37','修复','新浏览器检查在重构后的启动回退页失效','Peter Steinberger'],
  ['4ca233c','修复','数据库延迟准入后恢复工作','Peter Steinberger'],
  ['72a5d35','修复','共享模型加载时隔离各调用方的中止信号','shuisadev'],
  ['6cd8fc6','测试','回合提交计数计入持久化事实','RoboClaw'],
  ['5ea0524','构建','PostgreSQL 一致性测试纳入活动事实迁移','RoboClaw'],
  ['142e1d6','修复','报告 Bun SQLite 探针崩溃退出而非无效输出','Peter Steinberger'],
];

const catOrder = ['新功能','修复','性能优化','重构','文档','测试','构建','杂项','其他'];
const catIcon = {'新功能':'✨','修复':'🐛','性能优化':'⚡','重构':'♻️','文档':'📝','测试':'🧪','构建':'🔧','杂项':'🔨','其他':'📦'};

const prLines = prs.map(([n,desc,who]) => `✅ [#${n}](${repo}/pull/${n}) ${desc} — ${who}`).join('\n');

const catBlocks = [];
for (const cat of catOrder) {
  const items = commits.filter(c => c[1] === cat);
  if (!items.length) continue;
  catBlocks.push(`**${catIcon[cat]} ${cat}（${items.length}）**\n` +
    items.map(([sha,,desc,who]) => `[${sha}](${repo}/commit/${sha}) ${desc} — ${who}`).join('\n'));
}

// 贡献者统计（基于上方 50 条提交；另有约 99 条更早提交未逐条列出）
const contrib = {};
commits.forEach(c => contrib[c[3]] = (contrib[c[3]]||0)+1);
const contribStr = Object.entries(contrib).sort((a,b)=>b[1]-a[1]).map(([n,c])=>`${n}(${c})`).join('、');

const card = {
  config: { wide_screen_mode: true },
  header: {
    template: 'purple',
    title: { tag: 'plain_text', content: '🐙 OpenClaw 仓库日报 - 2026-11-07' },
  },
  elements: [
    { tag: 'div', text: { tag: 'lark_md', content: `**🔀 合并请求（${prs.length} 个）**\n${prLines}` } },
    { tag: 'hr' },
    { tag: 'div', text: { tag: 'lark_md', content: `**📊 代码提交（近 24 小时约 149 次，以下为最新 50 次）**\n\n${catBlocks.join('\n\n')}` } },
    { tag: 'hr' },
    { tag: 'div', text: { tag: 'lark_md', content: `**👥 贡献者统计**（按列出的 50 次提交）\n${contribStr}` } },
  ],
};

fs.writeFileSync('/tmp/daily-card.json', JSON.stringify(card));
console.log('card written, bytes:', JSON.stringify(card).length);
