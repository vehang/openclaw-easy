# BaoBoxs 项目分析

## 一、项目概述

### 项目组成
| 项目 | 类型 | 技术栈 | 端口 |
|------|------|--------|------|
| baoboxs-nav | 前端 | Next.js 15 + React 19 + Tailwind CSS | 3000 |
| baoboxs-service | 后端 | Spring Boot 2.1.5 + Java 8 + MyBatis Plus | 8080 |

### 生产环境
- 域名: https://www.baoboxs.com
- 开发: http://127.0.0.1:8080
- 测试: http://192.168.1.123:48082

---

## 二、前端 (baoboxs-nav)

### 技术栈
- Next.js 15.2.6 + React 19.1.4
- Tailwind CSS 3.4 + Radix UI
- 设备指纹: @fingerprintjs/fingerprintjs
- 二维码: qrcode.react

### 目录结构
```
src/
├── app/pages/         # 页面
├── components/        # React 组件
├── services/          # API 服务
├── types/             # TypeScript 类型
├── config/            # 配置文件
└── utils/             # 工具函数
```

### 核心 API
| 接口 | 说明 |
|------|------|
| `/api/utility/proxy/gzhLoginCode` | 获取登录验证码 |
| `/api/utility/proxy/user/login` | 用户登录 |
| `/api/utility/proxy/user/register` | 用户注册 |
| `/api/nav/recommend/submit` | 工具推荐 |

---

## 三、后端 (baoboxs-service)

### 技术栈
- Spring Boot 2.1.5 + Java 8
- MySQL 8.0 + MyBatis Plus 3.4
- Druid + Caffeine
- 智谱 AI SDK

### 主要 Controller
| Controller | 功能 |
|------------|------|
| ToolsController | 工具管理 |
| UserLoginController | 用户登录 |
| ScheduleController | 日程管理 |
| WeChatController | 微信回调 |
| WebsiteAnalysisController | 网站分析 |

---

## 四、开发命令

### 前端
```bash
npm run dev      # 开发
npm run build    # 构建
npm run start    # 运行
```

### 后端
```bash
source ~/java-env.sh
mvn spring-boot:run
```

---

_创建时间: 2026-03-21_