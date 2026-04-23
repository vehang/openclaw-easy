# 自定义 LLM API 请求头（伪装 User-Agent）

## 修改文件

`~/.openclaw/agents/dev/agent/models.json`

## 方法

在目标 provider 中添加 `headers` 字段：

```json
{
  "providers": {
    "zhipu": {
      "baseUrl": "https://open.bigmodel.cn/api/coding/paas/v4",
      "apiKey": "你的API Key",
      "api": "openai-completions",
      "headers": {
        "User-Agent": "claude-code/2.1.112",
        "X-Client-Name": "claude-code"
      },
      "models": [...]
    }
  }
}
```

## 生效方式

```bash
kill -s USR1 $(pgrep -f openclaw-gateway)
```

## 验证

```bash
cat ~/.openclaw/agents/dev/agent/models.json | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['providers']['zhipu'].get('headers',{}))"
```

## 原理

OpenClaw 使用 OpenAI Node SDK 发送请求，`model.headers` 通过 SDK 的 `defaultHeaders` 注入，会覆盖 SDK 默认的 `User-Agent: OpenAI/JS x.x.x`。

对非 `api.openai.com` 的 provider，OpenClaw **不会**额外注入自己的 `openclaw/x.x.x` 标识，所以只需设置 `headers` 即可完全控制 User-Agent。

## 注意

- Gateway 热加载（SIGUSR1）一般不会覆盖 models.json，但 gateway 完整重启可能重写，修改后建议验证文件内容
- `headers` 可设置任意 HTTP 头，适用于代理认证、租户路由等场景
- 所有使用 `openai-completions` API 的 provider 均适用
