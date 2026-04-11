/**
 * 配置常量
 */
const path = require('path');
const os = require('os');

const PORT = 18780;
const SALT_ROUNDS = 10;
const SESSION_EXPIRE_TIME = 24 * 60 * 60 * 1000; // 24小时

const OPENCLAW_DIR = path.join(os.homedir(), '.openclaw');
const CONFIG_FILE = path.join(OPENCLAW_DIR, 'openclaw.json');
const PASSWORD_FILE = path.join(OPENCLAW_DIR, '.passwd');
const SIMPLE_CACHE_FILE = path.join(OPENCLAW_DIR, '.simple-config.json');
const WEIXIN_QR_STATE_FILE = path.join(OPENCLAW_DIR, '.weixin-qr-state.json');
const WEIXIN_BOUND_FILE = path.join(OPENCLAW_DIR, '.weixin-bound');

module.exports = {
    PORT,
    SALT_ROUNDS,
    SESSION_EXPIRE_TIME,
    OPENCLAW_DIR,
    CONFIG_FILE,
    PASSWORD_FILE,
    SIMPLE_CACHE_FILE,
    WEIXIN_QR_STATE_FILE,
    WEIXIN_BOUND_FILE
};
