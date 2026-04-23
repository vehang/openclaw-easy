# 一次编译，多环境部署指南

本项目支持**一次编译，多环境部署**的方案，通过 Docker 运行时环境变量动态切换后端环境，无需为不同环境分别编译。

## 🚀 核心优势

- ✅ **一次编译**：只需要构建一次 `.next` 文件
- ✅ **多环境部署**：同一个镜像可部署到开发/测试/生产环境
- ✅ **动态配置**：通过环境变量动态切换后端接口
- ✅ **减少构建时间**：避免重复编译
- ✅ **统一镜像**：降低维护成本

## 📋 部署流程

### 1. 编译前端代码（只需一次）

```bash
# 构建生产版本（统一编译，不指定具体环境）
npm run build
```

### 2. 构建 Docker 镜像（只需一次）

```bash
# 构建统一的 Docker 镜像
docker build -t baoboxs-nav:latest .
```

### 3. 运行不同环境（通过环境变量区分）

#### 开发环境
```bash
docker run -d \
  --name baoboxs-nav-dev \
  -p 3001:3000 \
  -e API_ENV=development \
  baoboxs-nav:latest
```

#### 测试环境
```bash
docker run -d \
  --name baoboxs-nav-test \
  -p 3002:3000 \
  -e API_ENV=test \
  baoboxs-nav:latest
```

#### 生产环境
```bash
docker run -d \
  --name baoboxs-nav-prod \
  -p 3000:3000 \
  -e API_ENV=production \
  baoboxs-nav:latest
```

## 🔧 环境配置说明

### 支持的环境变量

| 环境变量 | 说明 | 可选值 | 默认值 |
|---------|------|--------|--------|
| `API_ENV` | API环境配置 | `development`、`test`、`production` | `production` |

### 各环境对应的后端地址

| 环境 | 后端地址 | 超时时间 |
|------|----------|----------|
| `development` | `http://1e4b256b.r24.cpolar.top` | 10秒 |
| `test` | `https://test-api.baoboxs.com` | 3秒 |
| `production` | `https://www.baoboxs.com` | 5秒 |

## 📝 Docker Compose 示例

创建 `docker-compose.yml` 文件，同时运行多个环境：

```yaml
version: '3.8'

services:
  # 开发环境
  baoboxs-nav-dev:
    image: baoboxs-nav:latest
    container_name: baoboxs-nav-dev
    ports:
      - "3001:3000"
    environment:
      - API_ENV=development
    restart: unless-stopped

  # 测试环境
  baoboxs-nav-test:
    image: baoboxs-nav:latest
    container_name: baoboxs-nav-test
    ports:
      - "3002:3000"
    environment:
      - API_ENV=test
    restart: unless-stopped

  # 生产环境
  baoboxs-nav-prod:
    image: baoboxs-nav:latest
    container_name: baoboxs-nav-prod
    ports:
      - "3000:3000"
    environment:
      - API_ENV=production
    restart: unless-stopped
```

运行所有环境：
```bash
docker-compose up -d
```

## 🔍 运行时验证

### 检查当前环境配置

访问任一环境后，可在浏览器控制台看到当前使用的配置：

```
[API Config] 当前环境: development, 配置: {baseUrl: "http://16yv350289.iask.in", timeout: 10000}
```

### 测试 API 连接

各环境启动后可通过以下地址测试：

- 开发环境：http://localhost:3001
- 测试环境：http://localhost:3002  
- 生产环境：http://localhost:3000

## 🛠️ 本地开发

本地开发时也可以通过环境变量切换后端：

```bash
# 连接开发环境后端
API_ENV=development npm run start

# 连接测试环境后端
API_ENV=test npm run start

# 连接生产环境后端（默认）
npm run start
```

## 🔄 旧方式 vs 新方式对比

### 旧方式（需要多次编译）
```bash
# 开发环境
$env:NEXT_PUBLIC_API_ENV="development"; npm run build
docker build -t baoboxs-nav:dev .

# 测试环境
$env:NEXT_PUBLIC_API_ENV="test"; npm run build  
docker build -t baoboxs-nav:test .

# 生产环境
$env:NEXT_PUBLIC_API_ENV="production"; npm run build
docker build -t baoboxs-nav:prod .
```

### 新方式（一次编译，多环境部署）
```bash
# 只需一次编译
npm run build
docker build -t baoboxs-nav:latest .

# 通过环境变量区分环境
docker run -e API_ENV=development baoboxs-nav:latest
docker run -e API_ENV=test baoboxs-nav:latest  
docker run -e API_ENV=production baoboxs-nav:latest
```

## 🚨 注意事项

1. **确保 .next 目录完整**：编译后的 `.next` 目录必须包含 `standalone` 输出
2. **环境变量优先级**：`API_ENV` > `NEXT_PUBLIC_API_ENV` > `NODE_ENV` > `'production'`
3. **配置验证**：启动时会在控制台输出当前使用的配置，便于调试
4. **缓存策略**：不同 API 路径有不同的缓存策略，环境切换不影响缓存逻辑

## 🔧 故障排除

### 问题1：配置未生效
**解决方案**：检查容器环境变量是否正确设置
```bash
docker exec container_name env | grep API_ENV
```

### 问题2：后端连接失败
**解决方案**：检查网络连接和防火墙设置，确认后端地址可访问

### 问题3：运行时配置获取失败
**解决方案**：检查 Next.js 配置是否正确，确保 `publicRuntimeConfig` 设置正确

---

通过以上配置，您就可以实现真正的**一次编译，多环境部署**，大大简化了部署流程并提高了效率！ 🎉 