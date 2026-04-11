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

module.exports = {
    ensureConfigDir,
    isCommandAvailable,
    deepMerge
};
