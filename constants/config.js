/**
 * 配置常量
 */
const path = require('path');
const os = require('os');

/**
 * AI 配置占位默认值
 * 用于配置文件中保证字段有值、避免服务无法启动。
 * 所有对外接口返回时需脱占位（占位值→空字符串），不展示给用户。
 */
const DEFAULT_PLACEHOLDER = {
    API_URL: 'https://placeholder.invalid/v1',
    API_KEY: '__PLACEHOLDER_API_KEY__',
    MODEL_NAME: '__PLACEHOLDER_MODEL__',
};

/**
 * 判断值是否为占位默认值
 */
function isPlaceholder(value) {
    if (!value || typeof value !== 'string') return false;
    return value === DEFAULT_PLACEHOLDER.API_URL
        || value === DEFAULT_PLACEHOLDER.API_KEY
        || value === DEFAULT_PLACEHOLDER.MODEL_NAME;
}

const PORT = 18780;
const SALT_ROUNDS = 10;
const SESSION_EXPIRE_TIME = 24 * 60 * 60 * 1000; // 24小时

const OPENCLAW_DIR = path.join(os.homedir(), '.openclaw');
const CONFIG_FILE = path.join(OPENCLAW_DIR, 'openclaw.json');
const PASSWORD_FILE = path.join(OPENCLAW_DIR, '.passwd');
const SIMPLE_CACHE_FILE = path.join(OPENCLAW_DIR, '.simple-config.json');
const WEIXIN_QR_STATE_FILE = path.join(OPENCLAW_DIR, '.weixin-qr-state.json');
const WEIXIN_BOUND_FILE = path.join(OPENCLAW_DIR, '.weixin-bound');
const APP_TOKENS_FILE = path.join(OPENCLAW_DIR, '.app-tokens.json');
const APP_TOKEN_EXPIRE_TIME = 7 * 24 * 60 * 60 * 1000; // 7 天

module.exports = {
    DEFAULT_PLACEHOLDER,
    isPlaceholder,
    PORT,
    SALT_ROUNDS,
    SESSION_EXPIRE_TIME,
    OPENCLAW_DIR,
    CONFIG_FILE,
    PASSWORD_FILE,
    SIMPLE_CACHE_FILE,
    WEIXIN_QR_STATE_FILE,
    WEIXIN_BOUND_FILE,
    APP_TOKENS_FILE,
    APP_TOKEN_EXPIRE_TIME
};
