import json, subprocess

def sha_line(sha, msg, author):
    return "[%s](https://github.com/openclaw/openclaw/commit/%s) %s — %s" % (sha[:8], sha, msg, author)

def pr_line(num, msg, author):
    return "✅ [#%s](https://github.com/openclaw/openclaw/pull/%s) %s — %s" % (num, num, msg, author)

prs = [
 (171012,"性能优化：释放 fork 过期定时器中已完成的对话轮次","steipete"),
 (170950,"性能优化：限制 Codex 原生 Ultrafast 压缩上限","steipete"),
 (171015,"修复：Doctor 预演失败时保留原有状态","steipete"),
 (171026,"重构：合并 CLI 输出测试夹具","vincentkoc"),
 (171032,"修复：终端退出状态出现后再捕获还原的终端","steipete"),
 (170981,"修复：追踪长调用并防止输出超限重放","steipete"),
 (166368,"修复：运行时重启后保留 ACPX 首次运行对话","alkor2000"),
 (170984,"修复：防止上下文引擎注册失败导致启动问题","steipete"),
 (171019,"性能优化：转录重写时避免载荷拷贝","steipete"),
 (171020,"测试：会话刷新测试改用浏览器时钟避免真实等待","steipete"),
 (161098,"修复：钩子返回非消息替换时转录追加失败","xydigitLybnnnn"),
 (171008,"性能优化：简化会话预留创建准备","steipete"),
 (170642,"修复：CI 单次 PR 运行中报告全部选定失败","steipete"),
 (171017,"修复：修正发布后保留本地脚本修复","vincentkoc"),
 (170969,"修复：测试 Gateway 重启时停止拒绝风暴","steipete"),
 (170955,"修复：进度背压下保持模式检查运行","steipete"),
 (170990,"测试：移除低价值测试（批次 d079）","steipete"),
 (170998,"性能优化：防止控制范围扫描阻塞 Gateway","steipete"),
 (170995,"修复：恢复归档中断的测试覆盖","steipete"),
 (171010,"重构：移除未使用的运行夹具包装","vincentkoc"),
 (169224,"修复：告知 agent fs.listDir 仅列出文件夹","PratikRai0101"),
 (171006,"性能优化：启动时会话检查并行执行","steipete"),
 (170999,"修复：语音文本不再写入本地 CLI 调试日志","steipete"),
 (170959,"修复：保留子 agent 失败诊断与原生投递证据","steipete"),
 (170877,"修复：启动发布被取代时保持 agent 运行可用","steipete"),
]

commits = {
"✨ 新功能": [
 ("1be6777ae5","云功能：支持仓库环境配方","steipete"),
 ("febccf6716","首次使用时保存推荐的云配置档案","steipete"),
],
"🛠 修复": [
 ("49bf06610c","Gateway 监控中移除 agent 执行相关导入","steipete"),
 ("de1531d420","更新：Doctor 预演失败时保留状态","steipete"),
 ("0cf266e849","ACPX：运行时重启后保留首次运行对话","alkor2000"),
 ("c96b03f771","Agent：追踪长调用并防止输出超限重放","steipete"),
 ("969f0dc24f","Doctor：插件注册前发布已验证配置","steipete"),
 ("6b031bff12","修复：钩子返回非消息替换时转录追加失败","xydigitLybnnnn"),
 ("a372ae280d","CI：单次 PR 运行报告全部选定失败","steipete"),
 ("7c72968482","脚本：修正发布后保留本地修复","vincentkoc"),
 ("8ddc6c6df2","测试：Gateway 夹具就绪探测增加退避","steipete"),
 ("755a815d6d","启动发布被取代时保持 agent 运行可用","steipete"),
 ("3b6d451403","更新：进度背压下保持模式检查运行","steipete"),
 ("64e38d8d77","TTS：语音文本不写入本地调试日志","steipete"),
 ("8c343e1642","飞书：按发送者和时间归因合并转发子消息","Jialong(Bruce) Li"),
 ("5fb96508f0","QA：中断的 Mantis 运行误报清理失败","steipete"),
 ("e569070bdd","Agent：保留子 agent 失败诊断与投递证据","steipete"),
 ("3f063e57f5","节点：告知 agent fs.listDir 仅列出文件夹","Pratik Rai"),
 ("1fa0e5f262","启动：不再每次启动重复哈希延迟会话源","steipete"),
 ("6b1f734cb4","更新：迁移完成后释放原生 worker","steipete"),
 ("e226ebb149","Agent：会话 fork 中保留已完成对话","steipete"),
 ("8b3d1160c9","模型：目录含畸形定价时保留有效模型","steipete"),
 ("4355243f06","更新：Windows git 源运行时拷贝不再循环，预检失败回退旧构建","steipete"),
 ("7a45c8a7d6","PR：支持在另一主机上进行基线签名","vincentkoc"),
 ("5a290d6379","CI：用不同 chunk 布局测试过期 UI 重载","vincentkoc"),
 ("3cffaf5fc5","CI：补充 CLI 配置工厂隔离文档","steipete"),
],
"⚡ 性能优化": [
 ("df8c7ddb5d","Agent：释放 fork 过期定时器中已完成的轮次","steipete"),
 ("b856c0f474","Codex：限制原生 Ultrafast 压缩上限","steipete"),
 ("fed5b242dd","会话：转录重写时避免载荷拷贝","steipete"),
 ("05330ad4db","会话：简化预留创建准备","steipete"),
 ("f7121470cd","子 agent：控制范围扫描不再阻塞 Gateway","steipete"),
 ("829e58e7fc","Gateway：启动时会话检查并行执行","steipete"),
 ("62ffa12b37","Gateway：会话列表行只描述一次","steipete"),
 ("1e0f7341cc","会话：历史预算清理后避免写入停滞","steipete"),
],
"♻️ 重构": [
 ("eb5ed1642b","测试：合并 CLI 输出夹具","Vincent Koc"),
 ("6e06f0e086","测试：移除未使用的运行夹具包装","Vincent Koc"),
],
"🧪 测试": [
 ("a2509eddf0","Gateway：历史夹具保持在原始准入内","steipete"),
 ("b1fbe564b4","测试：夹具对齐当前运行时契约","steipete"),
 ("a1e828269c","UI：等待终端退出后再捕获","steipete"),
 ("3fce262259","Setup：发现流程与目录观察者隔离","steipete"),
 ("394be69a4d","用量：定价退役与刷新时钟归属对齐","steipete"),
 ("6d2eb01978","Onboard：交接定时器限定于自身轮询时钟","steipete"),
 ("190f82af27","UI：会话刷新通过浏览器时钟推进","steipete"),
 ("843919889c","Codex：删除数据库前退役夹具验证","steipete"),
 ("9828e28906","核心/UI/插件：移除低价值测试批次 d079","steipete"),
 ("f870f20967","Doctor：中断夹具使用记录流","steipete"),
 ("ca7759330c","CLI：启动夹具绑定到配置工厂","steipete"),
 ("b79a274474","Gateway：验证中断轮次在重启交接后恢复","steipete"),
 ("4b3bda5f67","UI：活动刷新通过浏览器时钟推进","steipete"),
],
"👷 构建/CI": [
 ("53162067a1","CI：降低主 QA 冒烟运行器容量","Vincent Koc"),
],
}

md = "**🔀 合并请求（近 24 小时 %d 个）**\n" % len(prs)
for n,m,a in prs: md += pr_line(n,m,a)+"\n"
md += "\n**📊 代码提交（按类别）**\n"
total_c = 0
for cat, items in commits.items():
    md += "\n%s（%d）\n" % (cat, len(items))
    for sha,m,a in items:
        md += sha_line(sha,m,a)+"\n"
        total_c += 1
md += "\n👥 贡献者统计：共 %d 个提交、%d 个合并 PR；主要贡献者：steipete、vincentkoc、alkor2000、xydigitLybnnnn、PratikRai0101、Jialong(Bruce) Li" % (total_c, len(prs))

card = {
  "config": {"wide_screen_mode": True},
  "header": {"template": "purple", "title": {"tag": "plain_text", "content": "🐙 OpenClaw 仓库日报 - 2026-10-13"}},
  "elements": [{"tag": "div", "text": {"tag": "lark_md", "content": md}}]
}

cmd = ["openclaw","message","send","--channel","feishu","--target","user:ou_7172afb8fa3c2f51bb02b6af097a4b27","--card",json.dumps(card,ensure_ascii=False)]
r = subprocess.run(cmd, capture_output=True, text=True)
print(r.stdout); print(r.stderr)
