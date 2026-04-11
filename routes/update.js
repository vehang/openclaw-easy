/**
 * 更新路由
 * 
 * 接口列表：
 * - GET  /version      获取当前版本信息
 * - GET  /update/check 检查更新
 * - POST /update       一键更新
 * 
 * 注意：路由路径不含 /api 前缀，挂载时通过 app.use('/api', updateRoutes) 添加
 */
const express = require('express');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const router = express.Router();

const { UPDATE_DIR, BACKUP_DIR, getVersionInfo } = require('../utils/update');
const { restartEasy } = require('../utils/restart');

// 获取项目根目录
const PROJECT_ROOT = path.join(__dirname, '..');
const VERSION_FILE = path.join(PROJECT_ROOT, 'version.json');

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
 * 检查更新
 */
router.get('/update/check', async (req, res) => {
    try {
        const currentVersion = getVersionInfo();
        const checkUrl = `https://api.yun.tilldream.com/api/nas/fw/getNewVersionV2?platform=openclaw-easy&versionCode=${currentVersion.versionCode}`;
        
        console.log('[版本检查] 请求:', checkUrl);
        
        const response = await fetch(checkUrl);
        const result = await response.json();
        
        console.log('[版本检查] 结果:', result);
        
        res.json({
            code: result.code || 0,
            msg: result.msg || '检查更新成功',
            tipMsg: result.tipMsg || '',
            currentTime: Math.floor(Date.now() / 1000),
            currentVersion: currentVersion,
            data: result.data || null
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
 * 一键更新（无参数调用）
 */
router.post('/update', async (req, res) => {
    try {
        const currentVersion = getVersionInfo();
        let downloadUrl = req.body?.downloadUrl;
        let newVersionInfo = null;
        
        // 如果没有传下载地址，先检查更新获取
        if (!downloadUrl) {
            console.log('[一键更新] 检查更新...');
            const checkUrl = `https://api.yun.tilldream.com/api/nas/fw/getNewVersionV2?platform=openclaw-easy&versionCode=${currentVersion.versionCode}`;
            const checkResponse = await fetch(checkUrl);
            const checkResult = await checkResponse.json();
            
            if (!checkResult.data) {
                return res.json({
                    code: 0,
                    msg: '当前已经是最新版本',
                    currentTime: Math.floor(Date.now() / 1000)
                });
            }
            
            newVersionInfo = checkResult.data;
            downloadUrl = newVersionInfo.dlUrl;
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
                console.log('[一键更新] 开始下载更新包...');
                
                // 创建目录
                if (!fs.existsSync(UPDATE_DIR)) {
                    fs.mkdirSync(UPDATE_DIR, { recursive: true });
                }
                if (!fs.existsSync(BACKUP_DIR)) {
                    fs.mkdirSync(BACKUP_DIR, { recursive: true });
                }
                
                const tarFile = path.join(UPDATE_DIR, 'update.tar.gz');
                
                // 下载
                const downloadResponse = await fetch(downloadUrl);
                if (!downloadResponse.ok) {
                    throw new Error(`下载失败: ${downloadResponse.status}`);
                }
                const buffer = await downloadResponse.buffer();
                fs.writeFileSync(tarFile, buffer);
                console.log('[一键更新] 下载完成, 大小:', buffer.length);
                
                // 备份
                const appDir = PROJECT_ROOT;
                const timestamp = Date.now();
                const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}`);
                fs.mkdirSync(backupPath, { recursive: true });
                
                const filesToBackup = ['server.js', 'version.json', 'package.json', 'public'];
                for (const file of filesToBackup) {
                    const src = path.join(appDir, file);
                    if (fs.existsSync(src)) {
                        if (fs.statSync(src).isDirectory()) {
                            fs.cpSync(src, path.join(backupPath, file), { recursive: true });
                        } else {
                            fs.copyFileSync(src, path.join(backupPath, file));
                        }
                    }
                }
                console.log('[一键更新] 备份完成:', backupPath);
                
                // 解压
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
                }
                
                // 复制文件（跳过 node_modules）
                const newFiles = fs.readdirSync(sourceDir);
                for (const file of newFiles) {
                    if (file === 'node_modules') continue;
                    
                    const srcPath = path.join(sourceDir, file);
                    const destPath = path.join(appDir, file);
                    
                    if (fs.statSync(srcPath).isDirectory()) {
                        if (fs.existsSync(destPath)) {
                            fs.rmSync(destPath, { recursive: true });
                        }
                        fs.cpSync(srcPath, destPath, { recursive: true });
                    } else {
                        fs.copyFileSync(srcPath, destPath);
                    }
                }
                console.log('[一键更新] 文件复制完成');
                
                // 更新依赖
                try {
                    execSync('npm install --production', { cwd: appDir, stdio: 'pipe', timeout: 120000 });
                    console.log('[一键更新] 依赖更新完成');
                } catch (npmError) {
                    console.warn('[一键更新] npm install 警告:', npmError.message);
                }
                
                // 清理临时文件
                fs.rmSync(UPDATE_DIR, { recursive: true, force: true });
                console.log('[一键更新] 临时文件清理完成');
                
                // 重启 openclaw-easy 服务
                console.log('[一键更新] 准备重启 openclaw-easy 服务...');
                await restartEasy();
                
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
