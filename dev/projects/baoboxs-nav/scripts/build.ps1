# PowerShell 构建脚本
# 用法: .\scripts\build.ps1 [environment]

param(
    [string]$Environment = "production",
    [switch]$Help
)

# 显示帮助
if ($Help) {
    Write-Host "用法: .\scripts\build.ps1 [选项]"
    Write-Host "选项:"
    Write-Host "  -Environment ENV     环境 (development|test|production) [默认: production]"
    Write-Host "  -Help               显示帮助"
    Write-Host ""
    Write-Host "示例:"
    Write-Host "  .\scripts\build.ps1 -Environment development"
    Write-Host "  .\scripts\build.ps1 -Environment production"
    exit 0
}

# 验证环境参数
if ($Environment -notin @("development", "test", "production")) {
    Write-Error "错误: 环境必须是 development, test, 或 production"
    exit 1
}

Write-Host "======================================" -ForegroundColor Green
Write-Host "开始构建应用" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host "环境: $Environment" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Green

# 设置环境变量
# 注意：NODE_ENV 始终设为 production 进行构建优化
# NEXT_PUBLIC_API_ENV 用于区分API环境
$env:NODE_ENV = "production"
$env:NEXT_PUBLIC_API_ENV = $Environment

Write-Host "构建配置:" -ForegroundColor Cyan
Write-Host "  NODE_ENV: $env:NODE_ENV" -ForegroundColor White
Write-Host "  NEXT_PUBLIC_API_ENV: $env:NEXT_PUBLIC_API_ENV" -ForegroundColor White

# 清理之前的构建
Write-Host "清理之前的构建..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
}

# 安装依赖
Write-Host "安装依赖..." -ForegroundColor Yellow
npm ci
if ($LASTEXITCODE -ne 0) {
    Write-Error "依赖安装失败"
    exit 1
}

# 运行构建前检查（只在测试环境）
if ($Environment -eq "test") {
    Write-Host "运行代码检查..." -ForegroundColor Yellow
    npm run lint
    if ($LASTEXITCODE -ne 0) {
        Write-Error "代码检查失败"
        exit 1
    }
}

# 运行构建
Write-Host "开始构建..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "构建失败"
    exit 1
}

# 检查构建结果
if (-not (Test-Path ".next")) {
    Write-Error "❌ 构建失败：.next 目录不存在"
    exit 1
}

if (-not (Test-Path ".next\standalone")) {
    Write-Error "❌ 构建失败：standalone 模式未启用或构建不完整"
    Write-Error "请确保 next.config.ts 中设置了 output: 'standalone'"
    exit 1
}

Write-Host "✅ 构建完成！" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host "构建结果:" -ForegroundColor Cyan
Write-Host "  .next\standalone\     - 独立运行文件" -ForegroundColor White
Write-Host "  .next\static\         - 静态资源" -ForegroundColor White
Write-Host "  public\               - 公共文件" -ForegroundColor White
Write-Host "======================================" -ForegroundColor Green
Write-Host "环境配置:" -ForegroundColor Cyan
Write-Host "  目标环境: $Environment" -ForegroundColor White
Write-Host "  API环境: $env:NEXT_PUBLIC_API_ENV" -ForegroundColor White
Write-Host "======================================" -ForegroundColor Green
Write-Host "下一步: 运行 .\scripts\deploy.ps1 -Environment $Environment 来部署" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Green 