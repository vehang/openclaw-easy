# -*- coding: utf-8 -*-
import json, os, urllib.request

APP_ID = os.environ["FEISHU_APP_ID"]
APP_SECRET = os.environ["FEISHU_APP_SECRET"]
OPEN_ID = os.environ.get("FEISHU_OPEN_ID", "ou_7172afb8fa3c2f51bb02b6af097a4b27")
REPO = "https://github.com/openclaw/openclaw"

def pr(n): return f"{REPO}/pull/{n}"
def cm(s): return f"{REPO}/commit/{s}"

prs = [
 (190319, "修复频道在旧草稿启动失败后重复生成进度草稿", "obviyus"),
 (190320, "修复写入被拒绝时插件状态保持可用", "vincentkoc"),
 (190323, "补充高级账户安全 OAuth 恢复文档", "roboclaw-bot"),
 (190300, "修复进入 Custodian 和 Workboard 时布局抖动", "steipete"),
 (190311, "定时任务测试等待取消回执结算", "vincentkoc"),
 (189918, "修复控制台重载时保留完整的受限回复", "steipete"),
 (190321, "合并异步存储续跑测试覆盖", "vincentkoc"),
 (190043, "修复飞书贴纸搜索兼容 NFC/NFD 字符形式", "wangmiao"),
 (190314, "复用 Responses 准入消息转换提升性能", "steipete"),
 (189509, "修复 CI 中 PostgreSQL 目标列表被截断", "vincentkoc"),
 (190298, "修复时钟变化后保留更新修复预算", "roboclaw-bot"),
 (190286, "修复阅读旧聊天历史时页面晃动", "roboclaw-bot"),
 (190313, "共享有界代理文件路径收集逻辑", "vincentkoc"),
 (189847, "优化加载动画更加饱满", "vyctorbrzezowski"),
 (190309, "避免重复的 PostgreSQL 摘要计算", "roboclaw-bot"),
 (190277, "收件箱对齐到单一标记列", "vyctorbrzezowski"),
 (190273, "稳定已提交提及投递测试", "roboclaw-bot"),
 (190235, "菜单选项行统一圆角", "vyctorbrzezowski"),
 (190312, "共享同步 GC 追踪标记写入器", "vincentkoc"),
 (190223, "修复已就绪 PR 无法刷新目标分支", "shakkernerd"),
 (190203, "修复摘要被拒后会话超出压缩阈值", "steipete"),
 (156503, "测试改为真实频道分发与审批边界", "vincentkoc"),
]

groups = {
 "新功能": [
  ("6feb40e", "加载动画更加饱满", "Vyctor H. Brzezowski"),
  ("b8a6a54", "收件箱对齐到单一标记列", "Vyctor H. Brzezowski"),
  ("b24dcc0", "菜单选项行统一圆角", "Vyctor H. Brzezowski"),
  ("9677960", "移除输入框添加磁贴下方的分隔线", "Vyctor H. Brzezowski"),
  ("72a691e", "选择菜单中高亮当前选项", "Vyctor H. Brzezowski"),
  ("6129cfa", "手机所有者页面圆角化并淡出过长名称", "RoboClaw"),
  ("7300087", "新会话草稿随移动端键盘停靠", "RoboClaw"),
 ],
 "修复": [
  ("3b2fef9", "修复旧草稿启动失败后重复生成进度草稿", "Ayaan Zaidi"),
  ("f79a4e6", "修复写入被拒绝时插件状态保持可用", "Vincent Koc"),
  ("d43ab9c", "修复进入 Custodian 和 Workboard 时布局抖动", "Peter Steinberger"),
  ("4d6617a", "修复控制台重载时保留完整的受限回复", "Peter Steinberger"),
  ("3a9ffb1", "修复飞书贴纸搜索兼容 NFC/NFD 字符形式", "wangmiao0668000666"),
  ("f725c9f", "修复阅读旧聊天历史时页面晃动", "RoboClaw"),
  ("ed052cc", "修复时钟变化后保留更新修复预算", "RoboClaw"),
  ("89ed783", "修复 xAI Talk 回答被打断替换后仍保持连接", "RoboClaw"),
  ("8925f62", "修复 PostgreSQL 恢复会话首次启动即成功", "RoboClaw"),
  ("4ec943f", "修复慢速存储上捆绑 MCP 设置保持响应", "Peter Steinberger"),
  ("ca4a2a8", "修复发布流程分离发布新鲜度窗口", "Dallin Romney"),
  ("60621d7", "修复 xAI 令牌生成流出错后尝试备用方案", "RoboClaw"),
  ("fd8424b", "修复首次访问页面时内容稳定不跳动", "Peter Steinberger"),
  ("5cac93c", "修复已就绪 PR 无法刷新目标分支", "Shakker"),
  ("9237ad2", "修复 ACP 长桥接会话重载后打开正确网关会话", "Masato Hoshino"),
  ("6a73bf8", "修复 iOS Safari 输入时页面被拖拽滚动", "RoboClaw"),
  ("ccec138", "修复隔离本地工作区在 Windows 上初始化", "RoboClaw"),
  ("404ead9", "修复模型导航保留自定义每页数量", "史启明"),
  ("d98b307", "缩短已完成工作的时长标签", "RoboClaw"),
 ],
 "性能优化": [
  ("519dd41", "复用 Responses 准入消息转换", "Peter Steinberger"),
  ("7159dfd", "避免重复的 PostgreSQL 摘要计算", "RoboClaw"),
  ("ca92fd2", "共享同步 GC 追踪标记写入器", "Vincent Koc"),
  ("f278c08", "复用配置基准所有者替换钩子", "Vincent Koc"),
  ("c3fca67", "复用 GC 收集所有者的类型化探针", "Vincent Koc"),
  ("d2710e1", "减少 Code Mode 技能冗余上下文", "RoboClaw"),
  ("6a606e2", "修复长会话翻页加载越来越慢", "RoboClaw"),
 ],
 "重构": [
  ("2be5ac5", "共享有界代理文件路径收集逻辑", "Vincent Koc"),
  ("3636291", "代理与角色模型策略统一通配符语法", "Ayaan Zaidi"),
  ("22c1060", "后台会话工作改为存储会话的分支运行", "Ayaan Zaidi"),
  ("1c57c8e", "共享 UTF-8 诊断尾部解码脚本", "Vincent Koc"),
 ],
 "文档": [
  ("bdd7dd8", "补充高级账户安全 OAuth 恢复说明", "RoboClaw"),
 ],
 "测试": [
  ("aba1808", "合并异步存储续跑测试覆盖", "Vincent Koc"),
  ("33f1ecc", "网关测试等待已提交提及输入", "RoboClaw"),
  ("2561e2e", "定时任务测试等待取消回执结算", "Vincent Koc"),
  ("b786327", "测试改为真实频道分发与审批边界", "Vincent Koc"),
  ("f57a41b", "移除原生初始化测试中已废弃频道", "Vincent Koc"),
  ("5620b17", "断言 light DOM 中的骨架屏样式", "Vincent Koc"),
  ("fa602f6", "为每组初始化路径策略测试夹具", "Vincent Koc"),
 ],
 "构建": [
  ("4913d41", "修复 CI 中 PostgreSQL 目标列表被截断", "Vincent Koc"),
  ("de5ab40", "在存活矩阵中验证原生 systemd 更新", "RoboClaw"),
  ("888e745", "CI 注册 worker 分配性能分析预加载", "RoboClaw"),
 ],
 "杂项": [
  ("5342923", "刷新控制台多语言文案", "openclaw-mantis[bot]"),
 ],
}

md = []
md.append("**🔀 合并请求（22 个）**")
for n, t, a in prs:
    md.append(f"✅ [#{n}]({pr(n)}) {t} — {a}")
md.append("")
total = sum(len(v) for v in groups.values())
md.append(f"**📊 代码提交（{total} 条）**")
for cat in ["新功能", "修复", "性能优化", "重构", "文档", "测试", "构建", "杂项"]:
    if cat not in groups: continue
    md.append(f"**{cat}**")
    for sha, t, a in groups[cat]:
        md.append(f"[{sha}]({cm(sha)}) {t} — {a}")
    md.append("")
md.append("👥 **贡献者统计**：11 位贡献者 · Peter Steinberger / Vincent Koc / RoboClaw / Ayaan Zaidi / Vyctor H. Brzezowski / 史启明 / Shakker / Masato Hoshino / Dallin Romney 等")

card = {
    "config": {"wide_screen_mode": True},
    "header": {
        "template": "purple",
        "title": {"tag": "plain_text", "content": "🐙 OpenClaw 仓库日报 - 2026-11-01"},
    },
    "elements": [
        {"tag": "div", "text": {"tag": "lark_md", "content": "\n".join(md)}},
        {"tag": "hr"},
        {"tag": "note", "elements": [{"tag": "plain_text", "content": f"共 {len(prs)} 个合并 PR · {total} 条提交 · 数据来源 GitHub API"}],
        },
    ],
}

# get tenant token
req = urllib.request.Request(
    "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
    data=json.dumps({"app_id": APP_ID, "app_secret": APP_SECRET}).encode(),
    headers={"Content-Type": "application/json"},
)
tok = json.loads(urllib.request.urlopen(req).read())["tenant_access_token"]

body = {
    "receive_id_type": "open_id",
    "receive_id": OPEN_ID,
    "msg_type": "interactive",
    "content": json.dumps(card, ensure_ascii=False),
}
req = urllib.request.Request(
    "https://open.feishu.cn/open-apis/im/v1/messages",
    data=json.dumps(body, ensure_ascii=False).encode(),
    headers={"Content-Type": "application/json; charset=utf-8", "Authorization": f"Bearer {tok}"},
)
resp = json.loads(urllib.request.urlopen(req).read())
print(json.dumps({"code": resp.get("code"), "msg": resp.get("msg"), "message_id": resp.get("data", {}).get("message_id")}, ensure_ascii=False))
