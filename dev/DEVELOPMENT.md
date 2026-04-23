# 编程开发规范（DEVELOPMENT.md）

> 本文件定义开发规范，确保代码质量和开发效率。

---

## 一、开发工具配置

### JDK 和 Maven 路径

```
JDK: ~/.openclaw/tools/jdk8
Maven: ~/.openclaw/tools/maven-3.6.3
Maven 仓库: ~/.openclaw/tools/maven-3.6.3/repository
```

### 使用方式

```bash
# 设置环境变量
export JAVA_HOME=~/.openclaw/tools/jdk8
export PATH=$JAVA_HOME/bin:$PATH

# 编译后端项目
cd ~/.openclaw/workspace/dev/projects/baoboxs-service
~/.openclaw/tools/maven-3.6.3/bin/mvn package -Dmaven.test.skip=true
```

### Maven 配置说明

Maven 本地仓库已配置在 `~/.openclaw/tools/maven-3.6.3/repository`，依赖会持久化保存，无需重复下载。

配置文件位置：`~/.openclaw/tools/maven-3.6.3/conf/settings.xml`

---

## 二、开发工作流

### 完整开发流程

```
┌─────────────────────────────────────────────────────────────────────┐
│                        开发工作流                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1️⃣ 需求理解                                                        │
│     ├── 使用: context-driven-development                            │
│     └── 输出: product.md, tech-stack.md, workflow.md               │
│                                                                     │
│  2️⃣ 任务拆分                                                        │
│     ├── 使用: task-development-workflow                             │
│     └── 输出: TASK.md, TODO 列表                                   │
│                                                                     │
│  3️⃣ 设计阶段                                                        │
│     ├── 使用: full-stack-feature                                   │
│     └── 输出: ARCHITECTURE.md, API_SPEC.md                         │
│                                                                     │
│  4️⃣ 编码实现                                                        │
│     ├── 使用: vibe-coding-workflow, senior-dev                     │
│     └── 输出: 源代码 + 单元测试                                     │
│                                                                     │
│ 5️⃣ 代码审查                                                         │
│    ├── 使用: senior-dev                                             │
│    └── 输出: PR, 审查报告                                           │
│                                                                     │
│ 6️⃣ 测试验证                                                         │
│    ├── 使用: task-development-workflow                              │
│    └── 输出: 测试报告                                               │
│                                                                     │
│ 7️⃣ 部署发布                                                         │
│    └── 输出: 发布记录                                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 二、各阶段详解

### 阶段 1: 需求理解

**使用 Skill**: `context-driven-development`

**目标**: 理解需求，建立项目上下文

**输出产物**:
```
project/
├── product.md        # 产品背景和目标
├── tech-stack.md     # 技术栈选型
└── workflow.md       # 工作流程定义
```

**工作内容**:
- 理解用户场景
- 明确功能边界
- 确定技术选型
- 定义验收标准

---

### 阶段 2: 任务拆分

**使用 Skill**: `task-development-workflow`

**目标**: 将需求拆分为可执行的任务

**输出产物**:
```
project/
├── TASK.md           # 任务列表
├── TODO.md           # 待办事项
└── backlog/          # 需求池
```

**任务格式**:
```markdown
## TASK-001: 用户登录功能

**优先级**: P0
**预估时间**: 4h
**依赖**: 无

### 验收标准
- [ ] 用户可以使用手机号登录
- [ ] 登录失败有明确提示
- [ ] 登录状态保持 7 天
```

---

### 阶段 3: 设计阶段

**使用 Skill**: `full-stack-feature`

**目标**: 设计系统架构和接口

**输出产物**:
```
project/docs/
├── ARCHITECTURE.md   # 架构设计
├── API_SPEC.md       # API 规范
├── DATABASE.md       # 数据库设计
└── diagrams/         # 架构图
```

**设计审查清单**:
- [ ] 架构是否简洁，不过度设计？
- [ ] API 是否符合 RESTful 规范？
- [ ] 数据库设计是否合理？
- [ ] 是否考虑了扩展性？

---

### 阶段 4: 编码实现

**使用 Skills**: `vibe-coding-workflow`, `senior-dev`

**目标**: 实现功能代码

**工作流程**:
```
vibe-coding-workflow (5阶段):
1. 需求确认 → 确保理解正确
2. 架构设计 → 确定实现方案
3. 代码生成 → 编写代码
4. 调试验证 → 本地测试
5. 迭代优化 → 代码审查
```

**编码规范**:
- 单一职责：一个函数只做一件事
- 函数简短：不超过 50 行
- 命名清晰：见名知意
- 注释必要：解释"为什么"

---

### 阶段 5: 代码审查

**使用 Skill**: `senior-dev`

**目标**: 确保代码质量

**审查维度**:
| 维度 | 检查项 |
|------|--------|
| 功能 | 是否实现需求？ |
| 代码 | 是否简洁可读？ |
| 测试 | 是否有单元测试？ |
| 安全 | 是否有安全隐患？ |
| 性能 | 是否有性能问题？ |

**PR 规范**:
```
标题: feat(user): 新增手机号登录功能

## 改动说明
- 新增手机号验证码登录
- 新增登录状态管理

## 测试情况
- [x] 单元测试通过
- [x] 本地测试通过

## 截图
（如有 UI 变化）
```

---

### 阶段 6: 测试验证

**使用 Skill**: `task-development-workflow`

**目标**: 验证功能正确性

**测试类型**:
| 类型 | 覆盖范围 |
|------|----------|
| 单元测试 | 核心业务逻辑 |
| 集成测试 | 关键流程 |
| E2E 测试 | 用户场景 |

**测试命名**:
```javascript
// 格式: should_xxx_when_xxx
test('should_return_user_when_id_exists', () => { ... });
test('should_throw_error_when_user_not_found', () => { ... });
```

---

## 三、开发 Skills 使用指南

### 已安装的开发 Skills

| Skill | 用途 | 使用场景 |
|-------|------|----------|
| **task-development-workflow** | TDD 工作流 | 任务拆分、测试驱动开发 |
| **context-driven-development** | 上下文管理 | 项目初始化、上下文文档 |
| **senior-dev** | 生产开发流程 | TODO 跟踪、PR、部署 |
| **full-stack-feature** | 端到端功能开发 | 从需求到部署的完整流程 |
| **vibe-coding-workflow** | 5阶段开发 | AI 辅助编码 |

### 使用方式

**启动新项目**:
```
1. 使用 context-driven-development 初始化项目上下文
2. 创建 product.md, tech-stack.md, workflow.md
```

**开发新功能**:
```
1. 使用 task-development-workflow 拆分任务
2. 使用 vibe-coding-workflow 编码实现
3. 使用 senior-dev 进行代码审查
```

**完整功能开发**:
```
使用 full-stack-feature 进行端到端开发
```

---

## 四、代码规范

### ❌ 禁止项

| 类别 | 禁止 |
|------|------|
| **代码风格** | 过度抽象、过度注释、意义不明命名、魔法数字 |
| **架构** | 过度设计、技术堆砌、微服务泛滥、配置地狱 |
| **注释** | 废话注释、过时注释、解释烂代码 |
| **提交** | 模糊提交、巨型提交、半成品提交 |

### ✅ 必须项

| 类别 | 规范 |
|------|------|
| **命名** | 意图明确、风格统一、避免缩写 |
| **组织** | 单一职责、函数简短(<50行)、参数控制(<3个) |
| **注释** | 解释"为什么"、TODO 格式、公共接口说明 |
| **Git** | type(scope): description 格式 |

---

## 五、Git 规范

### 提交格式

```
type(scope): description

type:
- feat: 新功能
- fix: 修复 Bug
- refactor: 重构
- docs: 文档
- test: 测试
- chore: 构建/工具
```

### 分支规范

```
main          # 主分支，生产代码
develop       # 开发分支
feature/*     # 功能分支
bugfix/*      # Bug 修复
hotfix/*      # 紧急修复
```

---

## 六、项目目录结构

```
project/
├── PROJECT.md           # 项目规范
├── docs/                # 文档
│   ├── product.md       # 产品文档
│   ├── tech-stack.md    # 技术栈
│   ├── workflow.md      # 工作流程
│   ├── ARCHITECTURE.md  # 架构设计
│   └── API_SPEC.md      # API 规范
│
├── src/                 # 源代码
│   ├── api/             # 接口层
│   ├── service/         # 业务层
│   ├── repository/      # 数据层
│   ├── model/           # 数据模型
│   └── utils/           # 工具函数
│
├── tests/               # 测试代码
│   ├── unit/            # 单元测试
│   ├── integration/     # 集成测试
│   └── e2e/             # E2E 测试
│
├── memory/              # 项目记忆
│   ├── MEMORY.md        # 长期记忆
│   └── daily/           # 每日记录
│
└── repo/                # Git 仓库
```

---

## 七、去 AI 化检查

### 代码检查清单

```markdown
## AI 痕迹检查

- [ ] 是否有过度抽象的接口？
- [ ] 是否有无意义的类型定义？
- [ ] 是否有复杂的泛型体操？
- [ ] 是否有重复的类型声明？

→ 如果有 2 个以上，需要简化
```

### 示例对比

```typescript
// ❌ AI 风格：过度抽象
interface IUserService {
  getUser(id: string): Promise<IUser>;
}
class UserService implements IUserService { ... }

// ✅ 正常风格：简单直接
export async function getUser(id: string) { ... }
```

---

## 八、质量标准

### 代码质量

| 指标 | 标准 |
|------|------|
| 单元测试覆盖率 | > 80% |
| 函数长度 | < 50 行 |
| 文件长度 | < 300 行 |
| 圈复杂度 | < 10 |

### 审查标准

| 维度 | 问题 |
|------|------|
| 功能 | 是否实现需求？ |
| 代码 | 是否简洁可读？ |
| 测试 | 是否有测试？ |
| 文档 | 是否有文档？ |

---

_好的代码，是让人一眼就能看懂的代码。_