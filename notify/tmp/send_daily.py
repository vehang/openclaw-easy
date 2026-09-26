# -*- coding: utf-8 -*-
import json, subprocess

# commits: (sha7, 中文概括, 分类, 作者)
commits = [
    ("bde1d5f","移除Telegram入口目录编码","重构","Peter Steinberger"),
    ("49acf31","防止并发创建会话时标签重复","修复","Peter Steinberger"),
    ("0a46ce7","修复cron拒绝带调度错误计数诊断的任务","修复","Yufeng He"),
    ("b909cae","复用未变更的工具schema投影","性能优化","Peter Steinberger"),
    ("09a6051","模型目录v2预留有序模型推荐","新功能","Ayaan Zaidi"),
    ("ce19b0b","复用已准备的工具链缓存","测试","Peter Steinberger"),
    ("5790b12","限制会话环境清理重试次数","性能优化","Peter Steinberger"),
    ("d4e7850","复用当前会话能力facts","性能优化","Peter Steinberger"),
    ("412eecc","活动回顾复用常驻facts","性能优化","Peter Steinberger"),
    ("4e4473b","复用已准备的助手身份与头像","性能优化","Peter Steinberger"),
    ("75e416f","结算时保留渠道入口声明","修复","Peter Steinberger"),
    ("9faa93d","启动时不再读取原生插件工件","性能优化","Peter Steinberger"),
    ("31522be","修复离开设置页时agent菜单未关闭","修复","Peter Steinberger"),
    ("8eed7e8","精简memory/migration/utility插件","重构","Peter Steinberger"),
    ("e518bd7","被拒操作后释放已附着的桌面","修复","Vincent Koc"),
    ("7abc1b2","降低agent worker写入的宿主CPU占用","性能优化","Peter Steinberger"),
    ("3a5e3be","流式传输期间跳过未使用的扩展分发","性能优化","Peter Steinberger"),
    ("7814f26","Telegram正确识别论坛话题回复","修复","Sanjay Santhanam"),
    ("e4515f1","精简browser与memory-core插件(第三轮)","重构","Peter Steinberger"),
    ("1197afd","精简Apple共享Swift包","重构","Peter Steinberger"),
    ("185e65f","浅克隆中恢复远端PR基准","修复","Peter Steinberger"),
    ("18b0130","跟随规范的渠道协议引用","修复","Peter Steinberger"),
    ("ca90c71","稳定浏览器依赖与会话测试夹具","修复","Peter Steinberger"),
    ("642a463","父级导航中保留已保存的分叉","修复","Peter Steinberger"),
    ("bc3fdea","移除已被SQLite替代的旧transcripts","修复","Peter Steinberger"),
    ("31419ae","cron恢复不再阻塞Gateway","修复","Peter Steinberger"),
    ("9810475","共享最终源码镜像清单","性能优化","Peter Steinberger"),
    ("10619e2","文件工作流复用fs-safe读取器","重构","Peter Steinberger"),
    ("a53efa5","隔离编译lint夹具与加载器服务","测试","Peter Steinberger"),
    ("2ff07db","源码更新前检查工件所有权再停Gateway","修复","Peter Steinberger"),
    ("cd2724e","自动化iOS与安卓商店发布流程","新功能","Josh Avant"),
    ("11a11ef","插件路由保留回调端口","新功能","Peter Steinberger"),
    ("813169e","允许嵌套检出中构建与lint","修复","Peter Steinberger"),
    ("1011b10","精简auto-reply(第三轮)","重构","Peter Steinberger"),
    ("1d10971","简化工件历史记录","重构","Peter Steinberger"),
    ("0805a9d","会话创建期间保留排队中的设置","修复","Peter Steinberger"),
    ("3151eb1","等待批量库存准备完成","重构","Peter Steinberger"),
    ("2bdf870","移除低价值测试(批次d009)","测试","Peter Steinberger"),
    ("eaf8d91","精简小型channel与access插件","重构","Peter Steinberger"),
    ("443a067","抽取渠道入口变更内核","重构","Peter Steinberger"),
    ("239bae9","简化文件编辑空操作规划","重构","Peter Steinberger"),
    ("2442c30","工作区证明写入移出主线程","性能优化","Peter Steinberger"),
    ("2a53c32","移除低价值测试(批次d016)","测试","Peter Steinberger"),
    ("8fd72da","允许所有者在对话中直接交给agent密钥、配置与技能编辑","新功能","Ayaan Zaidi"),
    ("35f17c7","移除低价值测试(批次d012)","测试","Peter Steinberger"),
    ("44c9551","避免为内部运行更新重建列表索引","性能优化","Peter Steinberger"),
    ("df4cee1","移除低价值测试(批次d015)","测试","Peter Steinberger"),
    ("b9a4be5","避免嵌套迭代器结果作用域条目","性能优化","Peter Steinberger"),
    ("3b829ce","恢复读worker测试的lint门禁","修复","Jason (Json)"),
    ("468039a","创建会话时避免库存扫描","性能优化","Peter Steinberger"),
]

# PRs: (num, 中文概括, 作者)
prs = [
    (158885,"限制写准入之外的维护规划","steipete"),
    (158860,"移除Telegram入口目录编码","steipete"),
    (158839,"防止并发创建会话时标签重复","steipete"),
    (158792,"避免为内部运行更新重建列表索引","steipete"),
    (158772,"共享ACL检查与fs-safe文件写入","steipete"),
    (158779,"恢复前等待重试身份读取","steipete"),
    (158771,"新会话worker写入命令减半","steipete"),
    (158686,"精选插件分类并新增Computer use发现","Patrick-Erichsen"),
    (158782,"会话列表不再占用Gateway线程","steipete"),
    (158766,"加速保留运行时的准备过程","steipete"),
    (158775,"agentsapi服务端错误后重试事件提交","sjf-oa"),
    (152671,"外发纯文本回复去掉无空格的比较文案","leilei3167"),
    (158769,"恢复缺失的保留捕获目录","steipete"),
    (158773,"WAL截断繁忙时强制执行磁盘配额","steipete"),
    (158767,"保留已取消进程夹具输入直至清理合并","fuller-stack-dev"),
    (158774,"原生超时后合并UI页面回调","steipete"),
    (158756,"减少活跃视图间的会话更新开销","steipete"),
    (158443,"文件编辑不再阻塞其他会话","steipete"),
    (158744,"改用OpenAI公司图标","Patrick-Erichsen"),
    (158323,"释放每轮worker状态并归因worker内存","steipete"),
    (158745,"规范官方插件图标磁贴","Patrick-Erichsen"),
    (157497,"修复cron拒绝带调度错误计数诊断的任务","he-yufeng"),
    (158871,"复用未变更的工具schema投影","steipete"),
    (158616,"collector组获得独立执行通道","steipete"),
    (158522,"库存盘点期间避免缺失元数据读取","steipete"),
    (158477,"在worker中发现渠道入口账户","steipete"),
    (158469,"降低聊天历史追补的CPU开销","steipete"),
]

CAT_ORDER = ["新功能","修复","性能优化","重构","文档","测试","构建","杂项","其他"]
CAT_EMOJI = {"新功能":"✨","修复":"🐛","性能优化":"⚡","重构":"♻️","文档":"📝","测试":"🧪","构建":"🔧","杂项":"🔨","其他":"📦"}

date_str = "2026-09-26"
elements = []

pr_lines = [f"✅ [#{n}](https://github.com/openclaw/openclaw/pull/{n}) {t} — {a}" for n,t,a in prs]
elements.append({"tag":"div","text":{"tag":"lark_md","content":f"**🔀 合并请求（{len(prs)}个）**\n"+"\n".join(pr_lines)}})

groups = {}
for sha,t,cat,author in commits:
    groups.setdefault(cat,[]).append(f"[{sha}](https://github.com/openclaw/openclaw/commit/{sha}) {t} — {author}")
commit_md = [f"**📊 代码提交（{len(commits)}条）**"]
for cat in CAT_ORDER:
    if cat in groups:
        commit_md.append(f"{CAT_EMOJI[cat]} **{cat}**（{len(groups[cat])}）")
        commit_md.extend(groups[cat])
elements.append({"tag":"div","text":{"tag":"lark_md","content":"\n".join(commit_md)}})

authors = {}
for _,_,_,a in commits:
    authors[a] = authors.get(a,0)+1
author_str = "、".join(f"{n}({c})" for n,c in sorted(authors.items(), key=lambda x:-x[1]))
elements.append({"tag":"hr"})
elements.append({"tag":"div","text":{"tag":"lark_md","content":f"**👥 贡献者**: {author_str}"}})
elements.append({"tag":"note","elements":[{"tag":"plain_text","content":f"openclaw/openclaw 仓库日报 · {date_str}"}]})

card = {
    "config":{"wide_screen_mode":True},
    "header":{"template":"purple","title":{"tag":"plain_text","content":f"🐙 OpenClaw 仓库日报 - {date_str}"}},
    "elements":elements,
}

with open("/root/.openclaw/workspace/notify/tmp/card.json","w") as f:
    json.dump(card,f,ensure_ascii=False)

tok_res = subprocess.run(["curl","-s","-X","POST",
    "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
    "-H","Content-Type: application/json",
    "-d",json.dumps({"app_id":"cli_a91476e0a5f8dbc0","app_secret":"CRV8phtp1hTE7sz5tpwlCfGXnaIEvWCV"})],
    capture_output=True,text=True).stdout
token = json.loads(tok_res).get("tenant_access_token")
print("token:", "OK" if token else "FAIL: "+tok_res[:200])

payload = json.dumps({"receive_id":"ou_7172afb8fa3c2f51bb02b6af097a4b27","msg_type":"interactive","content":json.dumps(card,ensure_ascii=False)})
send_res = subprocess.run(["curl","-s","-X","POST",
    "https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id",
    "-H",f"Authorization: Bearer {token}","-H","Content-Type: application/json",
    "-d",payload],capture_output=True,text=True).stdout
print("send:", send_res[:300])

try:
    if json.loads(send_res).get("code") == 0:
        state = {"lastSha":"bde1d5fae5976acd64c04902af82c9a866100f3f","lastDate":"2026-09-26","lastRun":"2026-09-26T13:00:00Z"}
        with open("/root/.openclaw/workspace/scripts/github-monitor-state.json","w") as f:
            json.dump(state,f,indent=2,ensure_ascii=False)
        print("state updated")
except Exception as e:
    print("state update skipped:", e)
