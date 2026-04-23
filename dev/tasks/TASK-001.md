# TASK-001: 全部工具页面开发

## 需求描述
新增一个"全部工具"页面，展示某菜单下所有工具，按分组一页展示。

## 功能点
1. 新增 `/favorites/all` 页面
2. 按分组展示所有工具（不用TabBar切换）
3. 入口：TabBar最右边添加"查看全部"按钮

## 技术方案
- 复用现有的 GroupTabBar 和 CollectionCard 组件
- 新增 AllToolsPage 组件
- 添加路由 `/favorites/all`

## 开发分支
`feature/all-tools-page`

## 状态
- [x] 创建页面结构
- [x] 实现分组展示
- [x] 添加入口按钮
- [x] 样式适配
- [x] 测试验证

## 部署记录
- 日期: 2026-03-27
- 镜像: `baoboxs-nav-web:2603270025`
- 容器: `baoboxs-nav-web`
- 地址: http://192.168.1.123:43000