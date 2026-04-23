# 一次编译，多环境部署脚本 (PowerShell版本)
# 作者：Baoboxs Team
# 用途：演示如何通过一次编译实现多环境部署

param(
    [switch]$SkipBuild = $false,
    [switch]$Help = $false
)

# 错误处理
$ErrorActionPreference = "Stop"

if ($Help) {
    Write-Host @"
🚀 一次编译，多环境部署脚本

用法:
  .\scripts\deploy.ps1 [参数]

参数:
  -SkipBuild    跳过编译步骤，直接使用现有的构建文件
  -Help         显示此帮助信息

示例:
  .\scripts\deploy.ps1                    # 完整部署流程
  .\scripts\deploy.ps1 -SkipBuild         # 跳过编译，仅部署
"@
    exit 0
}

Write-Host "🚀 开始一次编译，多环境部署流程..." -ForegroundColor Green

# 配置
$ImageName = "baoboxs-nav"
$ImageTag = "latest" 
$FullImage = "${ImageName}:${ImageTag}"

# 函数：打印带颜色的消息
function Write-ColorMessage {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# 函数：检查命令是否存在
function Test-Command {
    param([string]$Command)
    
    $exists = Get-Command $Command -ErrorAction SilentlyContinue
    if (-not $exists) {
        Write-ColorMessage "❌ 错误: $Command 命令未找到，请先安装 $Command" "Red"
        exit 1
    }
}

# 检查必要的命令
Write-ColorMessage "🔍 检查必要的工具..." "Blue"
Test-Command "npm"
Test-Command "docker"

if (-not $SkipBuild) {
    # 步骤1：编译前端代码（只需一次）
    Write-ColorMessage "📦 步骤1: 编译前端代码（统一编译，不指定环境）..." "Blue"
    
    if (-not (Test-Path "node_modules")) {
        Write-ColorMessage "📥 安装依赖..." "Yellow"
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-ColorMessage "❌ 依赖安装失败！" "Red"
            exit 1
        }
    }
    
    Write-ColorMessage "🔨 开始编译..." "Yellow"
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-ColorMessage "✅ 前端代码编译成功！" "Green"
    } else {
        Write-ColorMessage "❌ 前端代码编译失败！" "Red"
        exit 1
    }
    
    # 步骤2：构建Docker镜像（只需一次）
    Write-ColorMessage "🐳 步骤2: 构建Docker镜像..." "Blue"
    docker build -t $FullImage .
    
    if ($LASTEXITCODE -eq 0) {
        Write-ColorMessage "✅ Docker镜像构建成功！" "Green"
    } else {
        Write-ColorMessage "❌ Docker镜像构建失败！" "Red"
        exit 1
    }
} else {
    Write-ColorMessage "⏭️ 跳过编译步骤，使用现有构建文件..." "Yellow"
}

# 步骤3：停止并删除现有容器（如果存在）
Write-ColorMessage "🧹 步骤3: 清理现有容器..." "Blue"
$containers = @("baoboxs-nav-dev", "baoboxs-nav-test", "baoboxs-nav-prod")

foreach ($container in $containers) {
    $exists = docker ps -a --format "table {{.Names}}" | Select-String "^${container}$"
    if ($exists) {
        Write-ColorMessage "🛑 停止并删除容器: $container" "Yellow"
        docker stop $container 2>$null | Out-Null
        docker rm $container 2>$null | Out-Null
    }
}

# 步骤4：启动多个环境
Write-ColorMessage "🌍 步骤4: 启动多环境部署..." "Blue"

# 开发环境
Write-ColorMessage "🟡 启动开发环境 (端口: 3001)..." "Yellow"
docker run -d --name baoboxs-nav-dev -p 3001:3000 -e API_ENV=development $FullImage | Out-Null

# 测试环境
Write-ColorMessage "🟠 启动测试环境 (端口: 3002)..." "Yellow"
docker run -d --name baoboxs-nav-test -p 3002:3000 -e API_ENV=test $FullImage | Out-Null

# 生产环境
Write-ColorMessage "🔴 启动生产环境 (端口: 3000)..." "Yellow"
docker run -d --name baoboxs-nav-prod -p 3000:3000 -e API_ENV=production $FullImage | Out-Null

# 等待容器启动
Write-ColorMessage "⏳ 等待容器启动..." "Blue"
Start-Sleep -Seconds 5

# 检查容器状态
Write-ColorMessage "📋 检查容器状态..." "Blue"
Write-Host ""
Write-Host "容器运行状态:" -ForegroundColor White
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | Select-String "baoboxs-nav"

Write-Host ""
Write-ColorMessage "🎉 部署完成！" "Green"
Write-Host ""
Write-ColorMessage "📡 访问地址:" "Blue"
Write-ColorMessage "  开发环境: http://localhost:3001" "Yellow"
Write-ColorMessage "  测试环境: http://localhost:3002" "Yellow"
Write-ColorMessage "  生产环境: http://localhost:3000" "Yellow"
Write-Host ""
Write-ColorMessage "🔧 管理命令:" "Blue"
Write-ColorMessage "  查看日志: docker logs baoboxs-nav-[dev|test|prod]" "Yellow"
Write-ColorMessage "  停止容器: docker stop baoboxs-nav-[dev|test|prod]" "Yellow"
Write-ColorMessage "  重启容器: docker restart baoboxs-nav-[dev|test|prod]" "Yellow"
Write-Host ""
Write-ColorMessage "✨ 一次编译，多环境部署成功完成！" "Green"

# 可选：显示环境变量验证
Write-ColorMessage "🔍 环境变量验证:" "Blue"

Write-Host "开发环境 API_ENV:" -NoNewline
try { 
    $devEnv = docker exec baoboxs-nav-dev printenv API_ENV 2>$null
    Write-Host " $devEnv" -ForegroundColor Green
} catch { 
    Write-Host " 无法获取" -ForegroundColor Red 
}

Write-Host "测试环境 API_ENV:" -NoNewline
try { 
    $testEnv = docker exec baoboxs-nav-test printenv API_ENV 2>$null
    Write-Host " $testEnv" -ForegroundColor Green
} catch { 
    Write-Host " 无法获取" -ForegroundColor Red 
}

Write-Host "生产环境 API_ENV:" -NoNewline
try { 
    $prodEnv = docker exec baoboxs-nav-prod printenv API_ENV 2>$null
    Write-Host " $prodEnv" -ForegroundColor Green
} catch { 
    Write-Host " 无法获取" -ForegroundColor Red 
}

Write-ColorMessage "🎯 部署完成！各环境已通过不同的API_ENV环境变量配置了不同的后端地址。" "Green" 