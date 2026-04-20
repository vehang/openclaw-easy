/**
 * OpenClaw 升级工具函数
 *
 * 功能：
 * - 查询 npm 远端可用版本
 * - 通过 npm install -g 安装指定版本
 * - 安装完成后重启 Gateway
 * - 锁文件防并发 + 三重防死锁保障
 *
 * 锁机制（三层递进）：
 * 1. try/catch 确保正常/异常路径都释放锁
 * 2. PID 存活检测 —— 进程崩溃后锁自动失效
 * 3. 30 分钟超时兜底 —— 极端情况强制过期
 */
const fs = require('fs');
const { spawn } = require('child_process');
const semver = require('./semver');
const {
    OPENCLAW_DIR,
    CONFIG_FILE,
    UPGRADE_STATUS_FILE,
    UPGRADE_ROLLBACK_FILE,
    UPGRADE_LOCK_TIMEOUT
} = require('../constants');
const { ensureConfigDir } = require('./common');
const { restartGateway } = require('./restart');

const NPM_REGISTRY = 'https://registry.npmmirror.com';
const NPM_INSTALL_TIMEOUT = 10 * 60 * 1000; // 10 分钟

// ==================== 版本查询 ====================

/**
 * 获取当前安装的 openclaw 版本
 * 优先级：openclaw --version → meta.lastTouchedVersion → null
 */
function getCurrentVersion() {
    // 优先级 1: openclaw --version
    try {
        const output = require('child_process').execSync('openclaw --version', {
            encoding: 'utf8',
            timeout: 10000
        }).trim();
        const match = output.match(/(\d+\.\d+\.\d+)/);
        if (match) return match[1];
    } catch (_) { /* 不可用，继续尝试 */ }

    // 优先级 2: meta.lastTouchedVersion
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            if (config.meta?.lastTouchedVersion) {
                return config.meta.lastTouchedVersion;
            }
        }
    } catch (_) { /* 忽略 */ }

    return null;
}

/**
 * 从 npm registry 获取 openclaw 所有版本
 * 使用 spawn 真异步，不阻塞事件循环
 */
function fetchNpmVersions() {
    return new Promise((resolve, reject) => {
        const child = spawn('npm', [
            'view', 'openclaw', 'versions', '--json',
            `--registry=${NPM_REGISTRY}`
        ], { shell: true });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => { stdout += data; });
        child.stderr.on('data', (data) => { stderr += data; });

        child.on('close', (code) => {
            clearTimeout(timer);
            if (code !== 0) {
                return reject(new Error(stderr.trim() || `npm view 退出码 ${code}`));
            }
            try {
                let versions = JSON.parse(stdout);
                if (!Array.isArray(versions)) {
                    versions = [versions];
                }
                resolve(versions);
            } catch (e) {
                reject(new Error('解析 npm 版本列表失败: ' + e.message));
            }
        });

        child.on('error', (err) => {
            clearTimeout(timer);
            reject(new Error('npm 命令执行失败: ' + err.message));
        });

        // 30 秒超时
        const timer = setTimeout(() => {
            child.kill();
            reject(new Error('查询 npm 版本超时'));
        }, 30000);
    });
}

/**
 * 获取可升级版本列表
 * @returns {{ currentVersion: string|null, versions: string[] }}
 */
async function getAvailableVersions() {
    const currentVersion = getCurrentVersion();
    const allVersions = await fetchNpmVersions();

    // 过滤并排序
    let candidates = allVersions
        .filter(v => semver.valid(v))
        .sort(semver.rcompare);

    // 如果有当前版本，只取大于当前的
    if (currentVersion && semver.valid(currentVersion)) {
        candidates = candidates.filter(v => semver.gt(v, currentVersion));
    }

    // 最多取 10 个
    const versions = candidates.slice(0, 10);

    return { currentVersion, versions };
}

// ==================== 锁管理 ====================

/**
 * 读取状态文件
 */
function readStatusFile() {
    try {
        if (fs.existsSync(UPGRADE_STATUS_FILE)) {
            return JSON.parse(fs.readFileSync(UPGRADE_STATUS_FILE, 'utf8'));
        }
    } catch (_) { /* 忽略解析失败 */ }
    return null;
}

/**
 * 写入状态文件
 */
function writeStatusFile(data) {
    ensureConfigDir();
    fs.writeFileSync(UPGRADE_STATUS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * 检测 PID 是否存活
 */
function isPidAlive(pid) {
    if (!pid || typeof pid !== 'number') return false;
    try {
        process.kill(pid, 0);
        return true;
    } catch (_) {
        return false;
    }
}

/**
 * 尝试获取锁
 * @param {string} version 目标版本号
 * @returns {{ ok: boolean, errorMsg?: string }}
 */
function acquireLock(version) {
    const status = readStatusFile();

    // 无状态文件 或 已结束的状态 → 可以执行
    if (!status || status.status === 'success' || status.status === 'failed') {
        writeStatusFile({
            status: 'installing',
            version,
            startTime: Date.now(),
            endTime: null,
            pid: process.pid,
            error: null
        });
        return { ok: true };
    }

    // 正在执行中 → 检查是否可以覆盖
    const isStale = !isPidAlive(status.pid)
        || (Date.now() - status.startTime > UPGRADE_LOCK_TIMEOUT);

    if (isStale) {
        // 锁已失效，覆盖
        console.log(`[升级] 检测到残留锁 (pid=${status.pid}, 启动于 ${new Date(status.startTime).toISOString()})，强制接管`);
        writeStatusFile({
            status: 'installing',
            version,
            startTime: Date.now(),
            endTime: null,
            pid: process.pid,
            error: null
        });
        return { ok: true };
    }

    // 锁有效，拒绝
    return {
        ok: false,
        errorMsg: `升级任务执行中 (正在安装 ${status.version}，开始于 ${new Date(status.startTime).toLocaleString()})`
    };
}

/**
 * 释放锁 — 更新状态文件为最终状态
 */
function releaseLock(finalStatus, error) {
    const status = readStatusFile();
    writeStatusFile({
        ...status,
        status: finalStatus,
        endTime: Date.now(),
        error: error || null
    });
}

/**
 * 获取当前升级状态
 */
function getUpgradeStatus() {
    const status = readStatusFile();
    if (!status) {
        return { status: 'idle' };
    }
    return status;
}

// ==================== 升级执行 ====================

/**
 * 执行升级
 * 完全基于 spawn，不阻塞事件循环
 */
async function performUpgrade(version) {
    console.log(`[升级] 开始升级 openclaw@${version}`);

    // ① 记录回滚文件
    const oldVersion = getCurrentVersion();
    try {
        ensureConfigDir();
        fs.writeFileSync(UPGRADE_ROLLBACK_FILE, JSON.stringify({
            oldVersion: oldVersion || 'unknown',
            newVersion: version,
            timestamp: Date.now()
        }, null, 2), 'utf8');
    } catch (e) {
        console.error('[升级] 写入回滚文件失败:', e.message);
    }

    try {
        // ② 执行 npm install -g
        console.log(`[升级] 执行 npm install -g openclaw@${version}`);
        const installResult = await spawnNpmInstall(version);

        if (!installResult.success) {
            console.error(`[升级] npm install 失败: ${installResult.error}`);
            releaseLock('failed', installResult.error);
            return;
        }

        console.log(`[升级] npm install 成功`);

        // ③ 更新状态为 restarting
        const status = readStatusFile();
        writeStatusFile({
            ...status,
            status: 'restarting'
        });

        // ④ 重启 Gateway
        console.log('[升级] 重启 Gateway...');
        const restartResult = await restartGateway();

        if (restartResult.success || restartResult.code === 0) {
            console.log('[升级] 升级完成: openclaw@' + version);
            releaseLock('success');
        } else {
            const errMsg = restartResult.error || restartResult.errorMsg || '重启 Gateway 失败';
            console.error('[升级] 重启失败:', errMsg);
            releaseLock('failed', errMsg);
        }

    } catch (error) {
        console.error('[升级] 升级异常:', error.message);
        releaseLock('failed', error.message);
    }
}

/**
 * spawn 执行 npm install -g（真异步，不阻塞）
 */
function spawnNpmInstall(version) {
    return new Promise((resolve) => {
        const child = spawn('npm', [
            'install', '-g', `openclaw@${version}`,
            `--registry=${NPM_REGISTRY}`
        ], { shell: true });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            const line = data.toString().trim();
            if (line) console.log('[升级-npm]', line);
            stdout += data;
        });

        child.stderr.on('data', (data) => {
            const line = data.toString().trim();
            if (line) console.log('[升级-npm]', line);
            stderr += data;
        });

        child.on('close', (code) => {
            clearTimeout(timer);
            if (code === 0) {
                resolve({ success: true, stdout });
            } else {
                resolve({ success: false, error: stderr.trim() || `npm install 退出码 ${code}` });
            }
        });

        child.on('error', (err) => {
            clearTimeout(timer);
            resolve({ success: false, error: err.message });
        });

        // 10 分钟超时
        const timer = setTimeout(() => {
            child.kill();
            resolve({ success: false, error: 'npm install 超时 (10分钟)' });
        }, NPM_INSTALL_TIMEOUT);
    });
}

module.exports = {
    getAvailableVersions,
    getCurrentVersion,
    acquireLock,
    releaseLock,
    getUpgradeStatus,
    performUpgrade
};
