# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

## 公共工具规则

⚠️ **重要规则**：公共工具（Java、Maven、Python 等）应放置在 **`~/.openclaw/tools/`** 目录下，供所有 Agent 共享使用。

**不要放在**：`~/.openclaw/workspace/{agent}/tools/`（这是某个 Agent 的私有目录）

---

## 已安装的公共工具

| 工具 | 版本 | 位置 |
|------|------|------|
| **JDK 8** | OpenJDK 1.8.0_482 (Temurin) | `~/.openclaw/tools/jdk8` |
| **Maven** | Apache Maven 3.6.3 | `~/.openclaw/tools/maven-3.6.3` |

### 环境变量
```bash
JAVA_HOME=/root/.openclaw/tools/jdk8
MAVEN_HOME=/root/.openclaw/tools/maven-3.6.3
```

### 使用方式
```bash
# 加载环境变量
source ~/.openclaw/tools/env-setup.sh

java -version
mvn -version
javac -version
```

---

## 添加新工具时

1. 安装到 `~/.openclaw/tools/{tool-name}`
2. 更新 `~/.openclaw/tools/env-setup.sh` 添加环境变量
3. 更新此 TOOLS.md 记录

---

Add whatever helps you do your job. This is your cheat sheet.
