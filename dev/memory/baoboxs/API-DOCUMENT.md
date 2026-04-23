# BaoBoxs API 接口文档

## 工具相关 API

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/tools/list` | GET | ❌ | 获取首页工具列表 |
| `/api/city` | GET | ❌ | 获取城市列表 |
| `/api/user/save-frequent-tools` | POST | ✅ | 保存常用工具 |
| `/api/nav/recommend/submit` | POST | ❌ | 工具推荐 |

## 用户认证 API

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/utility/proxy/gzhLoginCode` | GET | ❌ | 获取登录验证码 |
| `/api/utility/proxy/user/login` | POST | ❌ | 用户登录 |
| `/api/utility/proxy/user/login/byGzhCode` | POST | ❌ | 验证码登录 |
| `/api/utility/proxy/user/register` | POST | ❌ | 用户注册 |
| `/api/utility/proxy/user/token/refresh` | POST | ✅ | 刷新 Token |

## 日程管理 API

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/schedule/item/add` | POST | ✅ | 添加日程 |
| `/api/schedule/item/update` | POST | ✅ | 更新日程 |
| `/api/schedule/item/delete` | POST | ✅ | 删除日程 |

## 其他 API

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/website/analyze` | POST | ✅ | 分析网站 |
| `/api/weather` | GET | ❌ | 获取天气 |
| `/api/wechat` | GET | ❌ | 公众号回调验证 |

---

_创建时间: 2026-03-21_
