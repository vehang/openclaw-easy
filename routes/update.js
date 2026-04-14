/**
 * 更新路由
 * 
 * 接口列表：
 * - GET  /version      获取当前版本信息
 * - GET  /update/check 检查更新
 * - POST /update       一键更新（后台调用 shell 脚本）
 * 
 * 更新策略：
 * - 全部走 shell 脚本（docker/update.sh）
 * - 同级目录 + 测试启动 + mv 切换
 * - 18780 在更新过程中正常运行，只有最后 mv 的毫秒级中断
 */
const express = require('express');
const router = express.Router();

const { getVersionInfo, getOpenClawVersion, performUpdate } = require("../utils/update");

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
 * 检查更新（版本号比较）
 */
router.get('/update/check', async (req, res) => {
    try {
        const currentVersion = getVersionInfo();
        const openclawVersion = getOpenClawVersion();
        let checkUrl = `https://api.yun.tilldream.com/api/nas/fw/getNewVersionV2?platform=openclaw-easy&versionCode=${currentVersion.versionCode}`;
        if (openclawVersion) {
            checkUrl += `&openclawVersion=${encodeURIComponent(openclawVersion)}`;
        }
        
        console.log('[版本检查] 当前:', currentVersion.versionCode, currentVersion.versionName);
        
        const response = await fetch(checkUrl);
        const result = await response.json();
        
        let needsUpdate = false;
        let newVersionData = null;
        
        if (result.data && result.data.versionCode) {
            if (result.data.versionCode > currentVersion.versionCode) {
                needsUpdate = true;
                newVersionData = result.data;
                console.log('[版本检查] 发现新版本:', result.data.versionName);
            } else {
                console.log('[版本检查] 当前已是最新版本');
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
            errorMsg: '检查更新失败: ' + error.message,
            currentTime: Math.floor(Date.now() / 1000)
        });
    }
});

/**
 * POST /update
 * 一键更新
 * 
 * 后台调用 shell 脚本执行：
 * 解压到同级新目录 → 拷贝 node_modules → npm install → 测试启动 → mv 切换
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
            }
            const checkResponse = await fetch(checkUrl);
            const checkResult = await checkResponse.json();
            
            if (checkResult.data && checkResult.data.versionCode) {
                if (checkResult.data.versionCode <= currentVersion.versionCode) {
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
                errorMsg: '下载地址不存在',
                currentTime: Math.floor(Date.now() / 1000)
            });
        }
        
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
        
        // 后台调用 shell 脚本执行更新
        setImmediate(async () => {
            try {
                console.log('[一键更新] 后台调用更新脚本...');
                await performUpdate(downloadUrl);
            } catch (error) {
                console.error('[一键更新] 后台更新失败:', error);
            }
        });
        
    } catch (error) {
        console.error('[一键更新] 失败:', error);
        res.json({
            code: 1000,
            errorMsg: '更新失败: ' + error.message,
            currentTime: Math.floor(Date.now() / 1000)
        });
    }
});

module.exports = router;
