import json, subprocess

def sha_line(sha, msg, author):
    return "[%s](https://github.com/openclaw/openclaw/commit/%s) %s — %s" % (sha, sha, msg, author)

def pr_line(num, msg, author):
    return "✅ [#%s](https://github.com/openclaw/openclaw/pull/%s) %s — %s" % (num, num, msg, author)

prs = [
 (178407,"重构：直接读取预置配置","steipete"),
 (178021,"新功能：在任务边界与缓存过期前自动压缩上下文","roboclaw-bot"),
 (178390,"重构：测试夹具使用原生 owner","steipete"),
 (178329,"修复：分配压力测试中等待必需工具","steipete"),
 (178339,"修复：无需重启 Gateway 即可识别 Claude CLI 登录变更","steipete"),
 (178385,"修复：出站消息遵循请求级目标规范化","steipete"),
 (178400,"性能：嵌套仓库与外部忽略时复用差异","steipete"),
 (178393,"修复：审计证明补上移除版本读取","steipete"),
 (178377,"重构：移除未读取的私有运行时字段","steipete"),
 (178363,"测试：移除低价值测试（批次 d317）","steipete"),
 (178369,"性能：减少启动维护与会话目录数据库开销","steipete"),
 (178337,"测试：移除低价值测试（批次 d314）","steipete"),
 (177943,"修复：恢复期间保留安全检查与结果","joshavant"),
 (178340,"测试：移除低价值测试（批次 d315）","steipete"),
 (178343,"重构：会话测试使用原生资源加载器","steipete"),
 (178344,"重构：信任预置目录与入口事实","steipete"),
 (177942,"新功能：持久流在其授权沙箱中运行","joshavant"),
 (178386,"文档：迁移状态目录后需重启；doctor 提示更清晰","steipete"),
 (178341,"测试：移除低价值测试（批次 d316）","steipete"),
 (178356,"重构：合并私有引导与显示交接","steipete"),
 (178352,"重构：删除未使用的插件兼容清单","steipete"),
 (178354,"修复：Twitch 探测前等待认证完成","steipete"),
 (178345,"重构：移除未读取的私有 owner 投影","steipete"),
 (178301,"修复：更新报告指明失败原因且不暴露私有数据","steipete"),
]

commits = {
"✨ 新功能": [
 ("68efa3d9986842255fe78ef17cbc2e894a554ac0","新功能：在任务边界与缓存过期前自动压缩上下文","RoboClaw"),
 ("a11879cd40f6f0a91fbb0306f680c67c5e5a4269","新功能：持久 cron 流在授权沙箱中运行","Josh Avant"),
 ("8e4c7a0f23d00e159f513a47c48d1148a0c265f5","新功能：持久主机流需知情批准后授权","Josh Avant"),
],
"🛠 修复": [
 ("2d03d5632a69d04181844f85b05d5509240dcc14","修复：出站消息遵循请求级目标规范化","Peter Steinberger"),
 ("906e0b06be92f6b17d5e5dcfe3044b4e9b9b277d","修复：恢复期间保留安全检查与结果","Josh Avant"),
 ("2d40bdf8da9c86ae6a5c32af1db4311ab360b827","修复：Twitch 探测前等待认证完成","Peter Steinberger"),
 ("f6427568d96deb91f6501d48bdb3f1709089aaea","修复：更新报告指明失败原因且不暴露私有数据","Peter Steinberger"),
 ("28d696e6ede1d2756c759a1242c0df7ce9e92c07","修复：允许在已有对话中提及访客","Shakker"),
 ("2f4b1783e1bf6f8ddd6a497a5723cab944ecd3bd","修复：Gateway 关机排空等待保持单调","Peter Steinberger"),
 ("8b818b8fe9ea47f483dab086630aa99d424e647b","修复：模型可用性识别原生 CLI 登录","Peter Steinberger"),
 ("73dc02db0a8a2993d916eb4e8de1896c6e337b2b","修复：SQLite 临时锁竞争时重试启动恢复","Peter Steinberger"),
 ("f0ad815092d4acd4ea81dd4d6a6a49572b50a4e2","修复：退出 Google Meet 会议时关闭工具创建的标签页","Peter Steinberger"),
 ("4adcfea0900c8f51d6c6c990798c73d3473d1f2f9b","修复：分配压力测试中等待必需工具","Peter Steinberger"),
 ("e449e9ad3fcd44f013a1dc577d871ff0cb6dcee4","修复：解决附件缺失与媒体数量限制阻塞 Google Chat","Peter Steinberger"),
 ("3e517e9eb12d6c5697a2974ae7ac38da092cb3ca","修复：恢复对已确认人类提及的收件箱投递","Shakker"),
],
"⚡ 性能优化": [
 ("aa7fc04fe0e2c582982bd8b04f15a86bcc6e6d8a","性能：嵌套仓库与外部忽略时复用差异","Peter Steinberger"),
 ("d53309cd8ea4d0761fec3ac81ae73290b81e569a","性能：减少启动维护与目录读取","Peter Steinberger"),
 ("729f30224f07a0c68ccfe17ab2b53288de75372d","性能：保留已完成的迁移就绪状态","Peter Steinberger"),
],
"♻️ 重构": [
 ("8f2586bcbecee5d4a14473d37b506767a83a67c8","重构：直接读取预置配置","Peter Steinberger"),
 ("3ecfdb717de626397c46e9f3567b45b05b9ac055","重构：测试夹具使用原生 owner","Peter Steinberger"),
 ("42a73b62bb18abd0dc6b68fca0daf50f62331f79","重构：移除未读取的私有运行时字段","Peter Steinberger"),
 ("8fe652f7cef3a1901eb6b916ec002bef90d9598","重构：会话测试使用原生资源加载器","Peter Steinberger"),
 ("f1500699bdd0218345c803e5a6d3d0f0d55a02d8","重构：信任预置目录与入口事实","Peter Steinberger"),
 ("98bb32b30f2d9c7b10f64526c65bc1967180a2c3","重构：合并私有引导与显示交接","Peter Steinberger"),
 ("114ab00601d83d0df51a75d70ca171ad7c7169ec","重构：删除未使用的插件兼容清单","Peter Steinberger"),
 ("7d46d4197c47f5c42fb9263c268857f53fcf824f","重构：移除未读取的私有 owner 投影","Peter Steinberger"),
 ("a52ba4f23834749cb75fab7db36473aa91e667a2","重构：测试使用规范的 Docker 拉取类型","Peter Steinberger"),
 ("40185dd87c2e43a49614e8bf4543727c0d8d65c7","重构：核心与 QA 复用运行时 owner","Peter Steinberger"),
 ("f1fd15fed562277f1ecf76c74f873590f6bdc659","重构：移除未使用的证明与契约导出","Peter Steinberger"),
 ("d8c96213c5cf40295863fb5fb6d347e1f9caf6b7","重构：移除未读取的私有生产者结果","Peter Steinberger"),
 ("3213e3e542c5658f4095d08942f2636e6a40153b","重构：统一配置模型组装","Peter Steinberger"),
 ("ff495873081c508206bc1dda4072fddf63eb6a5f","重构：信任迁移写入后像","Peter Steinberger"),
 ("c518cbdbd0e5baa49d5e900662d484e6bae9144d","重构：私有发现包并入现有 owner","Peter Steinberger"),
],
"📚 文档": [
 ("9ab34fa57bdcf6271aa0bbda33d4a47d5464bb9a","文档：迁移状态目录后需重启；优化 doctor 提示","Peter Steinberger"),
],
"🧪 测试": [
 ("4ac4a4c541bf8d8850e6f8eee09473d515c08921","测试：移除低价值测试（批次 d317）","Peter Steinberger"),
 ("898c2fca7caa96753c03bab5cfb575dfe88e5c13","测试：审计证明包含移除版本读取","Peter Steinberger"),
 ("5c5bd2eaf0b3aa753a9adda0d634d091f0e9150c","测试：等待后续工作区声明释放","Peter Steinberger"),
 ("85e7a9b6cfb46448c9a6d6fe8aa9702f4bbf3463","测试：移除低价值测试（批次 d314）","Peter Steinberger"),
 ("0784da52a55c438e2abc5f15c2383f61d7d8337","测试：移除低价值测试（批次 d315）","Peter Steinberger"),
 ("cbfaa0d8b7dfb9b55aabd5db6fbe42c468036f35","测试：移除低价值测试（批次 d316）","Peter Steinberger"),
 ("f428baadf3d6e59faecebe43f2dd15e48f07ebe9","测试：移除低价值测试（批次 d313）","Peter Steinberger"),
 ("95f3324f71767e0f424a579c2f88f3f9458344cf","测试：目录获取失败时输出诊断","Peter Steinberger"),
 ("017eaef0491b2447985b5bb81a4cfed2d3b5ced4","测试：隔离移动发布路由子进程","Peter Steinberger"),
 ("8318dc331a6b657213d12e8bb9d0080f7c2619f6","测试：移除低价值测试（批次 d311）","Peter Steinberger"),
 ("1ff58cefbe8d69c1ac833d435b19afe413262a94","测试：移除低价值测试（批次 d310）","Peter Steinberger"),
 ("fa09d910c399798c879ab96a75a04c35653889b","测试：Stop 断言期间保留子进程终止权","Peter Steinberger"),
 ("02b58b2bc87bc84986feb89d195cf0775354d26c","测试：会话文件缓存淘汰确定性化","Peter Steinberger"),
 ("80afbe1b7950116b6d55c55c7c7d4bc5fd01330","测试：覆盖重连时的头部重命名","Peter Steinberger"),
 ("a4893de9275a789efea7cef33bfd847b06ea5b1f","测试：提供预演 agent 名册","Peter Steinberger"),
],
"📦 杂项": [
 ("9b3ebd7f5a2772f187907dfa859ba6f3dbf7b5f3","杂项：刷新控制界面多语言","openclaw-mantis[bot]"),
],
}

md = "**🔀 合并请求（近 24 小时共 %d 个）**\n" % len(prs)
for n,m,a in prs: md += pr_line(n,m,a)+"\n"
md += "\n**📊 代码提交（按类别，共 50 条）**\n"
total_c = 0
for cat, items in commits.items():
    md += "\n**%s（%d）**\n" % (cat, len(items))
    for sha,m,a in items:
        md += sha_line(sha,m,a)+"\n"
        total_c += 1
md += "\n**👥 贡献者统计（%d 条提交）**\nPeter Steinberger 43 次 · Josh Avant 3 次 · Shakker 2 次 · RoboClaw 1 次 · openclaw-mantis[bot] 1 次" % total_c

card = {
  "config": {"wide_screen_mode": True},
  "header": {"template": "purple", "title": {"tag": "plain_text", "content": "🐙 OpenClaw 仓库日报 - 2026-10-20"}},
  "elements": [
    {"tag": "div", "text": {"tag": "lark_md", "content": md}},
    {"tag": "note", "elements": [{"tag": "plain_text", "content": "数据区间：2026-10-19 13:00 UTC 至 2026-10-20 13:00 UTC"}]}
  ]
}

cmd = ["openclaw","message","send","--channel","feishu","--target","user:ou_7172afb8fa3c2f51bb02b6af097a4b27","--card",json.dumps(card,ensure_ascii=False)]
r = subprocess.run(cmd, capture_output=True, text=True)
print("RC", r.returncode)
print(r.stdout); print(r.stderr)
