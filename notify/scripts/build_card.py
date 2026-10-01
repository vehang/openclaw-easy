import json, collections
c=json.load(open('/tmp/commits.json'))
p=json.load(open('/tmp/pulls.json'))
last_sha="e374c800cd88a05c78aa0b53b0d448a3792f2505"
new=[]
for x in c:
    if x['sha']==last_sha: break
    new.append(x)
zh={
"9bf17b1":("修复","macOS 按住说话松开后停止采集"),"d06974d":("修复","OpenAI Responses 路径保留结构化输出"),
"d5e94ec":("修复","测试中隔离浏览器 MCP 生命周期钩子"),"18154ca":("修复","定时 spawn 运行投递 cron 提示词而非子回复"),
"34aff4f":("修复","本地语音转写经符号链接 PATH 解析可执行文件"),"4d75529":("修复","模型请求失败时引导消息不再覆盖原问题"),
"1367f8d":("重构","精简共享运行时辅助函数"),"9a44a9a":("重构","精简核心运行时原语"),"5c8a714":("重构","精简供应商适配器"),
"1004ec3":("修复","审批回放时元数据变更导致会话无法打开"),"2fac00b":("测试","GC 保留检查测试在 Bun 下运行"),
"1b33b99":("重构","网关审批授权管理外置"),"72f5840":("修复","claude-cli 子代理完成时空跑并伪造工具调用"),
"25972a6":("构建","CI 更新驱动单元格覆盖更新器与身份路径"),"9a01463":("修复","更新恢复文件间共享未变更 SQLite 页"),
"50331c8":("修复","CI 匹配捆绑入口抑制清单"),"ec8df3a":("修复","CLI 专有模块延后至版本快速路径后导入"),
"1b896e6":("性能","会话列表失效后限制物化规模"),"28ac1ad":("重构","旧版通话日志仅在 Doctor 中解码"),
"b2fc927":("修复","网关调试日志被事件循环健康调度刷屏"),"fbb4b36":("测试","移除低价值测试批次 d131"),
"e93bc05":("修复","HOME=/ 或路径前缀时工具摘要显示错误路径"),"a9074f2":("修复","运行时与 npm 测试夹具适配 Bun"),
"9faca1d":("杂项","UI 升级 Mermaid 至 12.0.0"),"4dbd5fb":("修复","高负载主机上测试轮询就绪文件超时"),
"94f5a8d":("新功能","技能搜索限定已安装指令范围"),"eb36d28":("性能","布局稳定后才读取转录几何信息"),
"ab1b932":("修复","根锚定忽略规则如 /build 会隐藏嵌套技能"),"6c3bccb":("修复","CI 为基线棘轮安装 ripgrep"),
"66b2fc5":("修复","处理器首次 await 前延迟时释放延迟通道"),"55bbbf9":("重构","Doctor 插件配置修复统一走单一执行器"),
"084990e":("修复","释放空闲 Bun 进程代理 IPC 引用"),"4d199b3":("测试","移除低价值测试批次 d129"),
"ad183c8":("杂项","升级 fs-safe 至 0.22.0"),"3ad238c":("构建","dependabot 批量升级 actions 依赖 5 项"),
"4b32b40":("修复","移除过期的 @pnpm/exe 锁文件导入"),"ed961d5":("重构","配置文件设置改在状态工作线程执行"),
"1983fcc":("修复","完成媒体经直接文本回退投递"),"5bf0cce":("杂项","移除过期的 acpx 冷却"),
"2709d4d":("修复","套餐不含 gpt-6-astra 时 ChatGPT OAuth 图像生成失败"),
"64ce172":("修复","稀疏检出时 lint 处理省略的 schema"),"b9c7034":("修复","恢复发布运行器路由测试的 lint"),
"19361d4":("修复","系统代理重新接纳回退代理运行时"),"bb69e5f":("修复","仪表盘多轮间保留外部会话标识"),
"e9f37f3":("修复","高负载下 CLI 启动等工具测试超时"),"aab1e57":("测试","移除低价值测试批次 d126"),
"d5dd44f":("修复","QA 实验室非聊天模拟条目排除出聊天调试"),"deb0e41":("测试","移除低价值测试批次 d127"),
"855bba4":("修复","被阻塞的定时运行误记为成功"),"7db874d":("新功能","定时任务支持跨自动化查询运行历史"),
}
cat_order=["新功能","修复","性能优化","重构","文档","测试","构建","杂项","其他"]
cats={k:[] for k in cat_order}
authors=collections.Counter()
for x in new:
    sha=x['sha'][:7]; author=x['commit']['author']['name']
    cat,txt=zh.get(sha,("其他",x['commit']['message'].split('\n')[0][:50]))
    if cat=="性能": cat="性能优化"
    link="https://github.com/openclaw/openclaw/commit/%s"%x['sha']
    cats[cat].append("[%s](%s) %s — %s"%(sha,link,txt,author))
    authors[author]+=1
przh={
143064:"macOS 按住说话松开后停止采集",114204:"OpenAI Responses 路径保留结构化输出",
162408:"云工作器持续恢复有进展的引导下载",162403:"更新彩排期间避免 SQLite 重复拷贝",
162602:"刷新原生语言包",162524:"注册转录/技能/运行时工作线程操作",162692:"测试隔离浏览器 MCP 生命周期钩子",
162680:"语音转写经符号链接 PATH 选用正确可执行文件",162549:"网关审批授权管理外置",
162460:"定时 spawn 运行投递 cron 提示词而非子回复",162439:"模型请求失败时引导消息不覆盖原问题",
162089:"精简共享运行时辅助函数",162504:"精简核心运行时原语",162488:"精简供应商适配器",
162667:"Bun 下运行 GC 保留检查测试",162681:"审批回放元数据变更导致会话打不开",
162466:"更新恢复文件共享未变更 SQLite 页",162374:"claude-cli 子代理完成时空跑并伪造调用",
162629:"CI 更新驱动单元格(更新器与身份路径)",162280:"会话列表失效后限制物化提升性能",
162311:"CLI 专有模块延迟导入加快版本输出",162538:"旧版通话日志解码移入 Doctor",
161895:"网关调试日志事件循环健康信息刷屏",162682:"移除低价值测试批次 d131",
162483:"HOME=/ 路径前缀时工具摘要路径错误",162619:"运行时与 npm 测试夹具适配 Bun",
162618:"UI 升级 Mermaid 至 12.0.0",
}
merged=[y for y in p if y.get('merged_at')]
pr_lines=[]
for y in merged:
    t=przh.get(y['number'],y['title'][:40])
    pr_lines.append("✅ [PR#%d](%s) %s — %s"%(y['number'],y['html_url'],t,y['user']['login']))
elems=[]
if pr_lines:
    elems.append({"tag":"div","text":{"tag":"lark_md","content":"**🔀 合并请求（%d 个）**\n"%len(pr_lines)+"\n".join(pr_lines)}})
commit_md=[]
for cat in cat_order:
    if cats.get(cat):
        commit_md.append("**%s**\n"%cat+"\n".join(cats[cat]))
elems.append({"tag":"div","text":{"tag":"lark_md","content":"**📊 代码提交（%d 条，按类别分组）**\n\n"%len(new)+"\n\n".join(commit_md)}})
top=", ".join("%s (%d)"%(a,n) for a,n in authors.most_common(8))
elems.append({"tag":"hr"})
elems.append({"tag":"div","text":{"tag":"lark_md","content":"**👥 贡献者统计**：共 %d 位贡献者 — %s"%(len(authors),top)}})
card={"config":{"wide_screen":True},"header":{"template":"purple","title":{"tag":"plain_text","content":"🐙 OpenClaw 仓库日报 - 2026-10-01"}},"elements":elems}
open('/tmp/card.json','w').write(json.dumps(card,ensure_ascii=False))
state={"lastSha":new[0]['sha'],"lastDate":"2026-10-01","lastRun":"2026-10-01T13:00:00Z"}
open('/root/.openclaw/workspace/scripts/github-monitor-state.json','w').write(json.dumps(state,indent=2))
print("card ok, commits:",len(new),"prs:",len(pr_lines),"authors:",len(authors))
