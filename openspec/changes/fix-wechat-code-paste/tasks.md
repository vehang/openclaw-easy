# 实施任务

## 1. 问题分析
- [x] 1.1 从公众号复制一段带代码的富文本，分析剪贴板数据格式
- [x] 1.2 检查当前 CodeMirrorEditor 的粘贴处理逻辑
- [x] 1.3 分析 HTML → Markdown 转换流程

**分析结果：**
- CodeMirrorEditor 没有自定义粘贴处理，使用 CodeMirror 默认行为
- 默认只读取 `text/plain`，忽略了 `text/html` 格式
- 项目没有 HTML → Markdown 转换库

## 2. 根因定位
- [x] 2.1 确认是剪贴板读取问题还是转换问题
- [x] 2.2 分析公众号代码块的 HTML 结构
- [x] 2.3 找出格式丢失的具体环节

**根因：** 粘贴时只获取 `text/plain`，代码块的换行信息在 `text/html` 中被丢失

## 3. 实现修复
- [x] 3.1 修改粘贴处理逻辑，支持富文本
- [x] 3.2 增强 HTML → Markdown 转换
- [x] 3.3 特殊处理 `<pre>` 和 `<code>` 标签

**修改的文件：**
- `src/components/CodeMirrorEditor.tsx` - 添加自定义粘贴处理
- `src/utils/markdown.ts` - 添加 htmlToMarkdown 函数
- `package.json` - 添加 turndown 依赖

## 4. 测试验证
- [x] 4.1 测试公众号代码粘贴
- [x] 4.2 测试其他来源的代码粘贴
- [x] 4.3 回归测试现有功能

**构建验证：** ✅ 成功
