/**
 * 更新路由
 * 
 * 接口列表：
 * - GET  /version      获取当前版本信息
 * - GET  /update/check 检查更新
 * - POST /update       一键更新
 * 
 * 更新策略：
 * - 排除法更新，保留 node_modules、tmp、.git、.env 等
 * - 增量 npm install，只在 package.json 变化时执行
 * - 版本号比较，versionCode <= 当前版本则不更新
 */
const express = require('express');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const router = express.Router();

const { UPDATE_DIR, BACKUP_DIR, getVersionInfo, getOpenClawVersion } = require("../utils/update");
const { restartEasy } = require('../utils/restart');
const { notifyNas } = require('../utils/common');

// 获取项目根目录
const PROJECT_ROOT = path.join(__dirname, '..');
const VERSION_FILE = path.join(PROJECT_ROOT, 'version.json');

// 排除列表（不更新、不删除、不备份）
const EXCLUDE_PATTERNS = [
    'node_modules',           // 依赖目录，保留并增量更新
    'tmp',                    // 临时文件
    '.git',                   // Git 目录
    '.env',                   // 本地环境配置
    '.env.local',             // 本地环境配置
    '.passwd',                // 密码文件
    '.simple-config.json',    // 配置缓存
    '.weixin-bound',          // 微信绑定状态
    '.weixin-qr-state.json',  // 微信登录状态
    '*.backup',               // 备份文件
    '*.bak',                  // 备份文件
    '*.log',                  // 日志文件
];

/**
 * 检查是否在排除列表
 */
function shouldExclude(item) {
    for (const pattern of EXCLUDE_PATTERNS) {
        if (item === pattern) return true;
        // 支持通配符（如 *.backup）
        if (pattern.startsWith('*') && item.endsWith(pattern.slice(1))) return true;
        if (pattern.endsWith('*') && item.startsWith(pattern.slice(0, -1))) return true;
    }
    return false;
}

/**
 * 使用排除法复制目录
 */
function copyWithExclude(sourceDir, destDir) {
    const items = fs.readdirSync(sourceDir);
    
    for (const item of items) {
        if (shouldExclude(item)) {
            console.log(`[更新] 跳过排除项: ${item}`);
            continue;
        }
        
        const srcPath = path.join(sourceDir, item);
        const destPath = path.join(destDir, item);
        
        if (fs.statSync(srcPath).isDirectory()) {
            // 目录：如果目标存在则删除，然后复制
            if (fs.existsSync(destPath)) {
                fs.rmSync(destPath, { recursive: true });
            }
            fs.cpSync(srcPath, destPath, { recursive: true });
            console.log(`[更新] 复制目录: ${item}`);
        } else {
            // 文件：直接复制覆盖
            fs.copyFileSync(srcPath, destPath);
            console.log(`[更新] 复制文件: ${item}`);
        }
    }
}

/**
 * 增量依赖更新
 * 只在 package.json 变化时执行 npm install
 */
function updateDependencies(appDir, oldPackageContent, newPackageContent) {
    if (oldPackageContent && newPackageContent) {
        if (oldPackageContent === newPackageContent) {
            console.log('[一键更新] package.json 未变化，跳过 npm install（节省时间）');
            return;
        }
    }
    
    console.log('[一键更新] package.json 已变化，执行增量 npm install...');
    
    try {
        // 增量安装，不删除现有 node_modules
        execSync('npm install --production --no-audit --no-fund', { 
            cwd: appDir, 
            stdio: 'pipe', 
            timeout: 120000 
        });
        console.log('[一键更新] 依赖更新完成');
    } catch (npmError) {
        console.warn('[一键更新] npm install 警告:', npmError.message);
    }
}

/**
 * GET /version
 * 获取当前版本信息
 */
router.get('/version', (req, res) => {
    const versionInfo = getVersionInfo();
    res.json({
        code: 0,
        msg: '成功',
        data: versionInfo,
        currentTime: Math.floor(Date.now() / 1000)
    });
});

/**
 * GET /update/check
 * 检查更新（增加版本号比较）
 */
router.get('/update/check', async (req, res) => {
    try {
        const currentVersion = getVersionInfo();
        const openclawVersion = getOpenClawVersion();
        let checkUrl = `https://api.yun.tilldream.com/api/nas/fw/getNewVersionV2?platform=openclaw-easy&versionCode=${currentVersion.versionCode}`;
        if (openclawVersion) {
            checkUrl += `&openclawVersion=${encodeURIComponent(openclawVersion)}`;
            console.log("[版本检查] OpenClaw 版本:", openclawVersion);
        }
        
        console.log('[版本检查] 请求:', checkUrl);
        console.log('[版本检查] 当前版本:', currentVersion.versionCode, currentVersion.versionName);
        
        const response = await fetch(checkUrl);
        const result = await response.json();
        
        console.log('[版本检查] 远程返回:', result);
        
        // 版本号比较：远程版本号 <= 当前版本号，则已是最新
        let needsUpdate = false;
        let newVersionData = null;
        
        if (result.data && result.data.versionCode) {
            const remoteVersionCode = result.data.versionCode;
            const currentVersionCode = currentVersion.versionCode;
            
            console.log('[版本检查] 版本号比较: 远程=' + remoteVersionCode + ', 当前=' + currentVersionCode);
            
            if (remoteVersionCode > currentVersionCode) {
                needsUpdate = true;
                newVersionData = result.data;
                console.log('[版本检查] 发现新版本:', result.data.versionName);
            } else {
                console.log('[版本检查] 当前已是最新版本（版本号相同或更高）');
            }
        }
        
        res.json({
            code: result.code || 0,
            msg: needsUpdate ? '发现新版本' : '当前已是最新版本',
            tipMsg: result.tipMsg || '',
            currentTime: Math.floor(Date.now() / 1000),
            currentVersion: currentVersion,
            data: needsUpdate ? newVersionData : null
        });
    } catch (error) {
        console.error('[版本检查] 失败:', error);
        res.json({
            code: 1000,
            msg: '检查更新失败: ' + error.message,
            currentTime: Math.floor(Date.now() / 1000)
        });
    }
});

/**
 * POST /update
 * 一键更新（使用排除法，保留 node_modules）
 * 增加版本号判断，避免重复更新
 */
router.post('/update', async (req, res) => {
    try {
        const currentVersion = getVersionInfo();
        let downloadUrl = req.body?.downloadUrl;
        let newVersionInfo = null;
        
        // 如果没有传下载地址，先检查更新获取
        if (!downloadUrl) {
            console.log('[一键更新] 检查更新...');
            const openclawVersion = getOpenClawVersion();
            let checkUrl = `https://api.yun.tilldream.com/api/nas/fw/getNewVersionV2?platform=openclaw-easy&versionCode=${currentVersion.versionCode}`;
            if (openclawVersion) {
                checkUrl += `&openclawVersion=${encodeURIComponent(openclawVersion)}`;
                console.log("[一键更新] OpenClaw 版本:", openclawVersion);
            }
            const checkResponse = await fetch(checkUrl);
            const checkResult = await checkResponse.json();
            
            // 版本号比较
            if (checkResult.data && checkResult.data.versionCode) {
                if (checkResult.data.versionCode <= currentVersion.versionCode) {
                    console.log('[一键更新] 当前已是最新版本（版本号相同或更高）');
                    return res.json({
                        code: 0,
                        msg: '当前已是最新版本，无需更新',
                        currentTime: Math.floor(Date.now() / 1000)
                    });
                }
                newVersionInfo = checkResult.data;
                downloadUrl = newVersionInfo.dlUrl;
            } else {
                return res.json({
                    code: 0,
                    msg: '当前已是最新版本',
                    currentTime: Math.floor(Date.now() / 1000)
                });
            }
        }
        
        if (!downloadUrl) {
            return res.json({
                code: 1001,
                msg: '下载地址不存在',
                currentTime: Math.floor(Date.now() / 1000)
            });
        }
        
        console.log('[一键更新] 下载地址:', downloadUrl);
        
        // 立即返回响应
        res.json({
            code: 0,
            msg: '已开始更新，请稍候...',
            data: newVersionInfo ? {
                newVersion: newVersionInfo.versionName,
                upgradeContents: newVersionInfo.upgradeContents
            } : null,
            currentTime: Math.floor(Date.now() / 1000)
        });
        
        // 后台执行更新
        setImmediate(async () => {
            try {
                console.log('[一键更新] ========== 开始更新 ==========');
                
                // 创建目录
                if (!fs.existsSync(UPDATE_DIR)) {
                    fs.mkdirSync(UPDATE_DIR, { recursive: true });
                }
                if (!fs.existsSync(BACKUP_DIR)) {
                    fs.mkdirSync(BACKUP_DIR, { recursive: true });
                }
                
                const tarFile = path.join(UPDATE_DIR, 'update.tar.gz');
                
                // ==================== 步骤1: 下载 ====================
                console.log('[一键更新] [1/5] 下载更新包...');
                
                const downloadResponse = await fetch(downloadUrl);
                if (!downloadResponse.ok) {
                    throw new Error(`下载失败: ${downloadResponse.status}`);
                }
                const buffer = await downloadResponse.buffer();
                fs.writeFileSync(tarFile, buffer);
                console.log('[一键更新] 下载完成, 大小:', Math.round(buffer.length / 1024), 'KB');
                
                // ==================== 步骤2: 备份 ====================
                console.log('[一键更新] [2/5] 备份当前版本...');
                
                const appDir = PROJECT_ROOT;
                const timestamp = Date.now();
                const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}`);
                fs.mkdirSync(backupPath, { recursive: true });
                
                // 保存 package.json 用于后续比较
                const oldPackagePath = path.join(appDir, 'package.json');
                let oldPackageContent = null;
                if (fs.existsSync(oldPackagePath)) {
                    oldPackageContent = fs.readFileSync(oldPackagePath, 'utf8');
                    fs.copyFileSync(oldPackagePath, path.join(backupPath, 'package.json.bak'));
                }
                
                // 备份重要文件（排除 node_modules 等）
                copyWithExclude(appDir, backupPath);
                console.log('[一键更新] 备份完成:', backupPath);
                
                // ==================== 步骤3: 解压 ====================
                console.log('[一键更新] [3/5] 解压更新包...');
                
                const extractDir = path.join(UPDATE_DIR, 'extracted');
                if (fs.existsSync(extractDir)) {
                    fs.rmSync(extractDir, { recursive: true });
                }
                fs.mkdirSync(extractDir, { recursive: true });
                
                execSync(`tar -xzf "${tarFile}" -C "${extractDir}"`, { stdio: 'pipe' });
                console.log('[一键更新] 解压完成');
                
                // 确定源目录
                let sourceDir = extractDir;
                const extractedFiles = fs.readdirSync(extractDir);
                if (extractedFiles.length === 1 && fs.statSync(path.join(extractDir, extractedFiles[0])).isDirectory()) {
                    sourceDir = path.join(extractDir, extractedFiles[0]);
                    console.log('[一键更新] 检测到单目录结构:', extractedFiles[0]);
                }
                
                // ==================== 步骤4: 更新文件 ====================
                console.log('[一键更新] [4/5] 更新文件（排除 node_modules）...');
                
                // 获取新的 package.json 内容
                const newPackagePath = path.join(sourceDir, 'package.json');
                let newPackageContent = null;
                if (fs.existsSync(newPackagePath)) {
                    newPackageContent = fs.readFileSync(newPackagePath, 'utf8');
                }
                
                // 使用排除法更新
                copyWithExclude(sourceDir, appDir);
                console.log('[一键更新] 文件更新完成');
                
                // ==================== 步骤5: 增量依赖更新 ====================
                console.log('[一键更新] [5/5] 增量依赖更新...');
                updateDependencies(appDir, oldPackageContent, newPackageContent);
                
                // ==================== 清理临时文件 ====================
                console.log('[一键更新] 清理临时文件...');
                fs.rmSync(UPDATE_DIR, { recursive: true, force: true });
                
                // 清理旧备份（保留最近5个）
                const backups = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('backup-'));
                if (backups.length > 5) {
                    backups.sort().slice(0, -5).forEach(old => {
                        fs.rmSync(path.join(BACKUP_DIR, old), { recursive: true });
                        console.log('[一键更新] 清理旧备份:', old);
                    });
                }
                
                console.log('[一键更新] ========== 更新完成 ==========');
                console.log('[一键更新] 备份保存在:', backupPath);
                
                // 重启服务
                console.log('[一键更新] 准备重启 openclaw-easy 服务...');
                await restartEasy();
                await notifyNas(200);
                
            } catch (updateError) {
                console.error('[一键更新] 后台更新失败:', updateError);
            }
        });
        
    } catch (error) {
        console.error('[一键更新] 失败:', error);
        res.json({
            code: 1000,
            msg: '更新失败: ' + error.message,
            currentTime: Math.floor(Date.now() / 1000)
        });
    }
});

module.exports = router;
