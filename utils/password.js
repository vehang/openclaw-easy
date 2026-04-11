/**
 * 密码相关工具函数
 */
const fs = require('fs');
const bcrypt = require('bcrypt');
const { PASSWORD_FILE, SALT_ROUNDS } = require('../constants');
const { ensureConfigDir } = require('./common');

/**
 * 检查是否已设置密码
 */
function isPasswordSet() {
    return fs.existsSync(PASSWORD_FILE);
}

/**
 * 保存密码（bcrypt 加密）
 */
async function savePassword(password) {
    ensureConfigDir();
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    fs.writeFileSync(PASSWORD_FILE, hash, 'utf8');
}

/**
 * 验证密码
 */
async function verifyPassword(password) {
    if (!fs.existsSync(PASSWORD_FILE)) {
        return false;
    }
    const hash = fs.readFileSync(PASSWORD_FILE, 'utf8').trim();
    return bcrypt.compare(password, hash);
}

/**
 * 验证密码强度
 * 要求：至少8位，包含大小写字母和数字
 */
function validatePasswordStrength(password) {
    const errors = [];

    if (!password || password.length < 8) {
        errors.push('密码长度至少8位');
    }

    if (password && !/[a-z]/.test(password)) {
        errors.push('密码必须包含小写字母');
    }

    if (password && !/[A-Z]/.test(password)) {
        errors.push('密码必须包含大写字母');
    }

    if (password && !/[0-9]/.test(password)) {
        errors.push('密码必须包含数字');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

module.exports = {
    isPasswordSet,
    savePassword,
    verifyPassword,
    validatePasswordStrength
};
