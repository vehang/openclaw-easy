# 定时任务配置

## 天气早报

### 任务配置
- **任务 ID**: daily-weather-yichang
- **Cron**: `0 7 * * *`（每天早上 7:00）
- **时区**: Asia/Shanghai

### 推送内容
- **地址**: 湖北省宜昌市夷陵区东湖大道50号
- **坐标**: 30.77, 111.33
- **接收人**: ou_c181a94df7dab9d310523c96dd6f473a
- **机器人**: Notify Bot (cli_a91476e0a5f8dbc0)

### 任务内容
1. 查询天气（wttr.in API）
2. 整理当前天气、今日天气
3. 生成穿搭建议、出行建议
4. 通过 Notify Bot 发送飞书私聊

### 配置文件
```
/root/.openclaw/workspace/schedules/daily-weather-yichang.md
```

## 注意事项

⚠️ 定时任务需要系统支持 cron。当前配置保存在文档中，需要手动设置系统 cron 或使用 OpenClaw 的定时任务功能。

## 手动触发测试

需要时可以请求手动发送天气早报进行测试。
