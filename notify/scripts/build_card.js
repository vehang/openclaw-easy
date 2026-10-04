const fs = require("fs");
const commits = require("/tmp/commits.json");
const pulls = require("/tmp/pulls.json");

const cutoff = new Date("2026-10-03T13:00:00Z");
const merged = pulls.filter(p => p.merged_at && new Date(p.merged_at) > cutoff)
  .sort((a,b)=>a.number-b.number);

const prSum = {
164577:"重构控制台界面去除冗余代码",164631:"修复安卓商店发布可在内部轨道完成",164637:"重构 macOS 与 Android 原生外壳",164654:"更新控制台界面多语言文案",164658:"修复发布流程信任不可变插件 npm 预检引用",164662:"修复插件 SDK 加载器恢复 Worker 导入",164664:"修复保留 Android 截图发布运行器路由",164714:"修复 XAI 包边界类型映射",164717:"修复引导前等待 Swift 进度升级错误",164738:"重构 LLM 提供方运行时与轨迹导出",164744:"每轮放置读取改由放置读投影提供",164763:"重构频道与插件长尾代码",164766:"修复只读子代理会话不恢复已存草稿",164807:"修复 Bun 运行时校验稳定性",164813:"加速代理目录恢复测试",164815:"更新控制台界面多语言文案",164824:"工作树运行结束快照统一经 Worker 处理",164835:"类型安全层将拒绝的 Jev 请求报告为输入错误",164844:"更新控制台界面多语言文案",164869:"完成隐身模式会话管理器 Actor 准入",164897:"修复会话搜索已配置 ACP 属主的对话记录",164898:"修复发布流程隔离首跳服务",164899:"清理 UI 低价值测试（批次 d198）",164902:"清理 UI 与插件低价值测试（批次 d199）",164905:"加速节点权限检查测试"};
const prLines = merged.map(p=>`✅ [#${p.number}](https://github.com/openclaw/openclaw/pull/${p.number}) ${prSum[p.number]||p.title} — ${p.user.login}`);

const cSum = {
"82adb7a":"节点权限测试复用读 Worker","33bf466":"会话支持搜索已配置 ACP 属主的对话记录","b56ae70":"清理 UI 与插件低价值测试","85124fe":"发布流程隔离首跳服务","e4f89eb":"工作树运行结束快照统一经 Worker 处理","8ab962e":"清理 UI 低价值测试","d9f36ac":"类型安全层将拒绝请求报告为输入错误","b2b434a":"每轮放置读取改由放置读投影提供","0068b18":"完成隐身模式会话管理器 Actor 准入","ec583a2":"以宿主属主运行认证测试夹具","000cc66":"清理 UI 与脚本低价值测试","6f8a764":"保留根目录下隔离失败覆盖测试","ee53507":"发布流程锁定打包激活运行时","f9dfa9a":"会话记录锚点与就绪读取改经 history reader","f8f1c8a":"SQLite worker 退役前刷新文件诊断","214bb47":"记忆片段 CJK 规范等价多样性","80725e3":"生命周期清单与快照写入改经 writer","58bcc01":"定时任务回执权威改由网关属主发布","e318434":"控制目录续订失败顺序测试","835a48f":"分离合成队列活性会话","31a1705":"SQLite 清理夹具保留原生借用","5110c1c":"等待数据库退役后再重开会话记录","8594b38":"刷新 worker 写入后的读取准入","d47ee98":"更新时仅结算当前 Doctor 的命令","7340738":"清理 UI 与工具低价值测试","2ee10ec":"清理 UI 与脚本低价值测试","5e68c42":"移除 Google Meet 未使用的过期覆盖","13f9b2c":"旧版路径发现逻辑移入 Doctor","59a39dc":"Doctor 从已完成 V2 回执导入会话","e28f1c0":"隐藏会话前对新增分支文件的未提交编辑","9794662":"移除已废弃的准入抑制清单","715c181":"工作树发布与工具可用性读取改经 reader","6aefbb1":"对齐聊天指令 worker 读取夹具","c190df1":"SQLite 迭代器出错后关闭原生句柄","4d2617d":"更新失败报告中识别不安全恢复对象","1ab7e49":"清理 UI/脚本/桌面端低价值测试","6c7d1e4":"浏览器分配扩展中继端口前预留 cdpUrl 端口","685fdc1":"CLI 命令退出前排空共享状态属主","96c7ddc":"清理脚本与 UI 低价值测试","5076c41":"保持冷维护保护的响应性","a0a1f18":"租约数据库替换后结算更新恢复","1464bc6":"发布流程保留插件扫描来源","b1880a0":"网关保留工具历史详情与频道启动上下文","e95e11c":"每轮会话投影与条目读取改由 Worker 提供","bb9f63c":"exec 默认值与审批改经异步 Reader","6f556a7":"防止聊天夹具污染后续测试","8cabfb2":"SQLite 允许独立 schema 夹具读取","05db574":"加速频道入口队列测试","0986d87":"send-keys 编码 Ctrl+Space 及组合功能键","d3af0db":"稳定 Bun 上的运行时校验"};
const nameMap={"Peter Steinberger":"steipete","Dallin Romney":"RomneyDa","Dan Hayman":"danhayman"};
const cat = m => {
  const p = m.split(":")[0].split("(")[0].trim();
  if(/^feat/.test(p)) return "新功能";
  if(/^fix/.test(p)) return "修复";
  if(/^perf/.test(p)) return "性能优化";
  if(/^refactor/.test(p)) return "重构";
  if(/^docs/.test(p)) return "文档";
  if(/^test/.test(p)) return "测试";
  if(/^(chore|build|ci)/.test(p)) return "构建";
  return "其他";
};
const groups = {};
const contrib = {};
commits.forEach(c=>{
  const msg = c.commit.message.split("\n")[0];
  const sha = c.sha.slice(0,7);
  const author = nameMap[c.commit.author.name]||c.commit.author.name;
  contrib[author]=(contrib[author]||0)+1;
  (groups[cat(msg)]=groups[cat(msg)]||[]).push(`[${sha}](https://github.com/openclaw/openclaw/commit/${c.sha}) ${cSum[sha]||msg} — ${author}`);
});
const order=["新功能","修复","性能优化","重构","文档","测试","构建","其他"];
const elem=[];
elem.push({tag:"div",text:{tag:"lark_md",content:"**🔀 合并请求（"+merged.length+" 个）**\n"+(prLines.join("\n")||"无")}});
let ctext = `**📊 代码提交（${commits.length} 条）**\n`;
order.forEach(k=>{ if(groups[k]) ctext += `\n**${k}**\n`+groups[k].join("\n")+"\n"; });
elem.push({tag:"div",text:{tag:"lark_md",content:ctext}});
const cs = Object.entries(contrib).sort((a,b)=>b[1]-a[1]).map(([a,n])=>`${a}(${n})`).join("、");
elem.push({tag:"hr"});
elem.push({tag:"div",text:{tag:"lark_md",content:`**👥 贡献者统计**：${cs}｜PR 贡献：${[...new Set(merged.map(p=>p.user.login))].join("、")}`}});
const card={msg_type:"interactive",content:{config:{wide_screen:true},header:{title:{tag:"plain_text",content:"🐙 OpenClaw 仓库日报 - 2026-10-04"},template:"purple"},elements:elem}};
fs.writeFileSync("/tmp/card.json",JSON.stringify(card));
console.log("card built. PRs:",merged.length,"commits:",commits.length,"contributors:",Object.keys(contrib).length);
