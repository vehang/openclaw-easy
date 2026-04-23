# 微信公众号自动发布 Skill 配置指南

## 📁 文件结构

```
/root/.openclaw/skills/wechat-ai-publisher/
├── SKILL.md              # Skill 主文件
├── accounts.json         # 多账号配置（重要！）
├── .env                  # 环境变量配置
├── account-manager.sh    # 账号管理脚本
├── scripts.sh            # 发布辅助脚本
├── styles.json           # 文章样式配置
└── examples/             # 示例文章
```

---

## 🔧 配置步骤

### 1. 添加公众号账号

**方式一：直接编辑 accounts.json**

```bash
nano /root/.openclaw/skills/wechat-ai-publisher/accounts.json
```

**方式二：使用管理脚本**

```bash
# 添加账号
bash /root/.openclaw/skills/wechat-ai-publisher/account-manager.sh add tech "技术号" wx1234567890 abcdef123456

# 查看所有账号
bash /root/.openclaw/skills/wechat-ai-publisher/account-manager.sh list

# 设置默认账号
bash /root/.openclaw/skills/wechat-ai-publisher/account-manager.sh default tech
```

### 2. 配置图片生成（可选）

编辑 `.env` 文件：

```bash
nano /root/.openclaw/skills/wechat-ai-publisher/.env
```

填入 Replicate API Key：
```
REPLICATE_API_KEY=r8_xxxxx
```

---

## 📝 使用方式

### 基本用法

```
发布AI热点                    # 使用默认账号
用 tech 账号发布AI热点         # 指定账号
发布AI热点，风格purple，配图2张 # 自定义参数
```

### 支持的参数

| 参数 | 说明 | 示例 |
|------|------|------|
| 账号 | 指定公众号 | `用 tech 账号` |
| 主题 | 文章主题 | `主题=大模型` |
| 风格 | CSS 风格 | `风格=purple` |
| 配图 | 配图数量 | `配图=封面+2张` |

### 风格选项

- `purple` - 紫色经典
- `orangeheart` - 橙心暖色
- `github` - GitHub 风格

---

## 📋 待办

- [ ] 提供公众号 AppID
- [ ] 提供公众号 AppSecret
- [ ] （可选）提供 Replicate API Key

---

## 🔗 相关链接

- 微信公众平台：https://mp.weixin.qq.com
- Replicate（图片生成）：https://replicate.com
