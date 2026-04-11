/**
 * 自动更新任务
 */
const { getVersionInfo, performUpdate } = require('../utils/update');

// 自动更新配置
const AUTO_UPDATE_CONFIG = {
    enabled: process.env.AUTO_UPDATE !== 'false',  // 默认启用
    checkOnStart: process.env.AUTO_UPDATE_ON_START !== 'false',  // 启动时检查
    checkIntervalHours: parseInt(process.env.AUTO_UPDATE_INTERVAL) || 6,  // 检查间隔（小时）
    autoInstall: process.env.AUTO_UPDATE_INSTALL !== 'false'  // 自动安装
};

let updateCheckTimer = null;

/**
 * 执行自动更新检查
 */
async function performAutoUpdateCheck() {
    try {
        console.log('[自动更新] 开始检查更新...');
        
        const currentVersion = getVersionInfo();
        const checkUrl = `https://api.yun.tilldream.com/api/nas/fw/getNewVersionV2?platform=openclaw-easy&versionCode=${currentVersion.versionCode}`;
        
        const response = await fetch(checkUrl);
        const result = await response.json();
        
        if (result.data) {
            console.log(`[自动更新] 发现新版本: ${result.data.versionName} (当前: ${currentVersion.versionName})`);
            
            if (AUTO_UPDATE_CONFIG.autoInstall) {
                console.log('[自动更新] 开始自动更新...');
                await performUpdate(result.data.dlUrl);
            } else {
                console.log('[自动更新] AUTO_UPDATE_INSTALL=false，跳过自动安装');
            }
        } else {
            console.log('[自动更新] 当前已是最新版本');
        }
    } catch (error) {
        console.error('[自动更新] 检查更新失败:', error.message);
    }
}

/**
 * 启动自动更新任务
 */
function startAutoUpdateTask() {
    if (!AUTO_UPDATE_CONFIG.enabled) {
        console.log('[自动更新] 已禁用 (AUTO_UPDATE=false)');
        return;
    }
    
    console.log(`[自动更新] 任务已启动，检查间隔: ${AUTO_UPDATE_CONFIG.checkIntervalHours}小时`);
    
    // 启动时延迟30秒检查
    if (AUTO_UPDATE_CONFIG.checkOnStart) {
        setTimeout(() => {
            console.log('[自动更新] 启动时检查更新...');
            performAutoUpdateCheck();
        }, 30 * 1000);  // 30秒后
    }
    
    // 定时检查
    const intervalMs = AUTO_UPDATE_CONFIG.checkIntervalHours * 60 * 60 * 1000;
    updateCheckTimer = setInterval(() => {
        console.log('[自动更新] 定时检查更新...');
        performAutoUpdateCheck();
    }, intervalMs);
}

function getUpdateCheckTimer() {
    return updateCheckTimer;
}

module.exports = {
    AUTO_UPDATE_CONFIG,
    startAutoUpdateTask,
    getUpdateCheckTimer
};
