/**
 * 通用工具函数
 */
const fs = require('fs');
const { OPENCLAW_DIR } = require('../constants');

/**
 * 确保配置目录存在
 */
function ensureConfigDir() {
    if (!fs.existsSync(OPENCLAW_DIR)) {
        fs.mkdirSync(OPENCLAW_DIR, { recursive: true });
    }
}

/**
 * 检测命令是否可用
 */
function isCommandAvailable(command) {
    const { execSync } = require('child_process');
    try {
        execSync(`which ${command}`, { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

/**
 * 深度合并对象
 */
function deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (target[key] && typeof target[key] === 'object') {
                result[key] = deepMerge(target[key], source[key]);
            } else {
                result[key] = source[key];
            }
        } else {
            result[key] = source[key];
        }
    }
    return result;
}


/**
 * 通知 NAS 接口
 * @param {number} type - 100:修复成功, 200:重启成功
 */
async function notifyNas(type) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('http://127.0.0.1:18319/sendNotifyToNas?type=' + type, {
            signal: controller.signal
        });
        clearTimeout(timeout);
        
        const data = await response.text();
        console.log('[NAS通知] type=' + type + ', status=' + response.status + ', response=' + data);
    } catch (error) {
        console.error('[NAS通知] 调用失败 type=' + type + ', error=' + error.message);
    }
}

module.exports = {
    notifyNas,
    ensureConfigDir,
    isCommandAvailable,
    deepMerge
};
