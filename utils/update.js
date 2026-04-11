/**
 * 版本更新工具函数
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// 获取项目根目录
const PROJECT_ROOT = path.join(__dirname, '..');

const VERSION_FILE = path.join(PROJECT_ROOT, 'version.json');
const UPDATE_DIR = '/tmp/openclaw-easy-update';
const BACKUP_DIR = '/tmp/openclaw-easy-backup';
const OPENCLAW_DIR = path.join(os.homedir(), '.openclaw');
const OPENCLAW_CONFIG_FILE = path.join(OPENCLAW_DIR, 'openclaw.json');

/**
 * 读取当前 openclaw-easy 版本信息
 */
function getVersionInfo() {
    try {
        const content = fs.readFileSync(VERSION_FILE, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error('读取版本信息失败:', error);
        return { versionName: '1.0.0', versionCode: 1000 };
    }
}

/**
 * 读取当前运行的 OpenClaw 版本号
 * 从 ~/.openclaw/openclaw.json 的 meta.lastTouchedVersion 获取
 */
function getOpenClawVersion() {
    try {
        if (fs.existsSync(OPENCLAW_CONFIG_FILE)) {
            const content = fs.readFileSync(OPENCLAW_CONFIG_FILE, 'utf8');
            const config = JSON.parse(content);
            
            if (config.meta && config.meta.lastTouchedVersion) {
                return config.meta.lastTouchedVersion;
            }
        }
    } catch (error) {
        console.error('[版本] 读取 OpenClaw 版本失败:', error.message);
    }
    
    return null;  // 无法获取时返回 null
}

/**
 * 执行更新（调用独立 shell 脚本）
 */
async function performUpdate(downloadUrl) {
    if (!downloadUrl) {
        console.error('[自动更新] 下载地址不存在');
        return { success: false, error: '下载地址不存在' };
    }
    
    const updateScript = path.join(PROJECT_ROOT, 'docker', 'update.sh');
    
    try {
        console.log('[自动更新] 调用更新脚本...');
        console.log('[自动更新] 下载地址:', downloadUrl);
        
        // 调用 shell 脚本执行更新
        const output = execSync(`bash "${updateScript}" update "${downloadUrl}"`, {
            encoding: 'utf8',
            timeout: 300000  // 5分钟超时
        });
        
        console.log('[自动更新] 更新脚本输出:');
        console.log(output);
        
        return { success: true };
        
    } catch (error) {
        console.error('[自动更新] 更新失败:', error.message);
        
        return { 
            success: false, 
            error: error.message,
            note: '如果服务无法启动，将在下次启动时自动回滚'
        };
    }
}

module.exports = {
    VERSION_FILE,
    UPDATE_DIR,
    BACKUP_DIR,
    OPENCLAW_CONFIG_FILE,
    getVersionInfo,
    getOpenClawVersion,
    performUpdate
};
