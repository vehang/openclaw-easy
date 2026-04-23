# browser-use + GLM-5 安装和使用指南

## 📦 安装步骤

### 1. 安装依赖

```bash
# 安装 browser-use 和 langchain
pip install browser-use langchain-community playwright

# 安装浏览器
playwright install chromium
```

### 2. 验证安装

```bash
python -c "from browser_use import Agent; print('✅ browser-use 安装成功')"
python -c "from langchain_community.chat_models import ChatZhipuAI; print('✅ langchain 安装成功')"
```

---

## 🚀 快速测试

### 测试脚本

```bash
# 运行测试
python /root/.openclaw/workspace/scripts/browser-use-test.py

# 交互模式
python /root/.openclaw/workspace/scripts/browser-use-test.py --interactive
```

---

## 📋 使用示例

### 示例 1：Google 搜索

```python
import asyncio
from browser_use import Agent
from langchain_community.chat_models import ChatZhipuAI

async def main():
    agent = Agent(
        task="访问 Google，搜索 GLM-5，提取第一个结果",
        llm=ChatZhipuAI(
            model="glm-5",
            api_key="697e4a18cc904043a768c421f6b26f1b.D5DLxHV4lKXSSnjl"
        )
    )
    result = await agent.run()
    print(result)

asyncio.run(main())
```

### 示例 2：登录网站

```python
agent = Agent(
    task="登录 GitHub，用户名 xxx，密码 xxx",
    llm=ChatZhipuAI(model="glm-5", api_key="your-key")
)
```

### 示例 3：数据采集

```python
agent = Agent(
    task="访问 Hacker News，提取前 10 条新闻标题",
    llm=ChatZhipuAI(model="glm-5", api_key="your-key")
)
```

---

## 🎯 在 OpenClaw 中使用

### 方式 1：通过 exec 调用

```
exec command:"python /root/.openclaw/workspace/scripts/browser-use-test.py"
```

### 方式 2：在 skill 中集成

创建一个 browser-automation skill：

```markdown
---
name: browser-automation
description: 使用 browser-use 进行浏览器自动化
---

## 使用方式

用户说："用浏览器访问 XXX"

执行：
```bash
python /root/.openclaw/workspace/scripts/browser-use-test.py --task "XXX"
```
```

---

## ⚙️ 配置选项

### GLM-5 配置

```python
llm = ChatZhipuAI(
    model="glm-5",  # 或 "glm-4.7", "glm-4.5-air"
    api_key="your-api-key",
    temperature=0.7,
    max_tokens=4096
)
```

### 浏览器配置

```python
agent = Agent(
    task="your task",
    llm=llm,
    browser_config={
        "headless": False,  # True = 无头模式
        "disable_security": True,
        "user_data_dir": "./browser_data"  # 保存登录状态
    }
)
```

---

## 🔧 常见问题

### Q: 浏览器启动失败？

```bash
# 安装依赖
sudo apt-get install -y \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libxkbcommon0 libxcomposite1 \
    libxdamage1 libxrandr2 libgbm1 libasound2

# 重新安装浏览器
playwright install chromium --with-deps
```

### Q: GLM-5 API 报错？

```bash
# 检查 API Key
curl https://open.bigmodel.cn/api/paas/v4/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"glm-5","messages":[{"role":"user","content":"hello"}]}'
```

### Q: 速度太慢？

- 使用 `glm-4.5-air` 代替 `glm-5`（更快但能力较弱）
- 设置 `headless=True`（无头模式更快）
- 简化任务描述

---

## 📊 性能对比

| 模型 | 速度 | 智能程度 | 成本 |
|------|------|----------|------|
| glm-4.5-air | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 💰 |
| glm-4.7 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 💰💰 |
| glm-5 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 💰💰💰 |

---

## 🎯 最佳实践

1. **任务要具体**：不要说"浏览网页"，要说"访问 X 网站，点击 Y 按钮"
2. **分步执行**：复杂任务拆分为多个小任务
3. **使用无头模式**：生产环境用 `headless=True`
4. **保存登录状态**：设置 `user_data_dir` 避免重复登录
5. **错误处理**：添加 try-except 捕获异常

---

## 📝 示例任务

```python
# ✅ 好的任务
"访问 GitHub，搜索 OpenClaw，提取第一个项目的星标数"
"登录 Gmail，搜索来自 boss 的邮件，告诉我数量"
"访问 Amazon，搜索 laptop，提取前 5 个产品的价格"

# ❌ 不好的任务
"浏览一下网页"（太模糊）
"帮我买东西"（需要支付信息，不安全）
```
