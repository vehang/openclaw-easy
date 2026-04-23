# LoginModal 组件拆分

## 原始文件
`src/components/LoginModal.tsx` (1656行)

## 拆分计划

### 已完成
- `types.ts` - 类型定义
- `useLoginModal.ts` - 状态管理 Hook

### 待完成
- `LoginForm.tsx` - 密码登录表单
- `RegisterForm.tsx` - 注册表单
- `QRCodeLogin.tsx` - 二维码登录
- `GzhLogin.tsx` - 公众号扫码登录
- `index.tsx` - 主入口（重构后）

## 重构原则
1. 保持 API 兼容
2. 不改变用户交互逻辑
3. 状态集中管理在 useLoginModal Hook
4. UI 组件只负责渲染