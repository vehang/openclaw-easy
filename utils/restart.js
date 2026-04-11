/**
 * 重启服务工具函数
 */
const { exec } = require('child_process');
const { isCommandAvailable } = require('./common');

/**
 * 重启 OpenClaw Gateway 服务
 */
async function restartGateway() {
    return new Promise((resolve, reject) => {
        // 检测可用的重启方式
        const restartMethods = [];

        // 优先级 1: openclaw gateway restart（用户优先要求）
        if (isCommandAvailable('openclaw')) {
            restartMethods.push({
                name: 'openclaw',
                description: '使用 openclaw 命令重启',
                cmd: 'openclaw gateway restart',
                manual: 'openclaw gateway restart'
            });
        }

        // 优先级 2: 通过 kill 发送信号（supervisord 会自动重启）
        restartMethods.push({
            name: 'kill-supervisor',
            description: '发送信号给 Gateway 进程（supervisord 自动重启）',
            cmd: 'pkill -f "openclaw gateway run"',
            manual: 'pkill -f "openclaw gateway run"'
        });

        // 优先级 3: supervisorctl
        if (isCommandAvailable('supervisorctl')) {
            restartMethods.push({
                name: 'supervisorctl',
                cmd: 'supervisorctl restart openclaw-gateway',
                manual: 'supervisorctl restart openclaw-gateway'
            });
        }

        // 优先级 4: systemctl
        if (isCommandAvailable('systemctl')) {
            restartMethods.push({
                name: 'systemctl',
                cmd: 'systemctl restart openclaw-gateway',
                manual: 'sudo systemctl restart openclaw-gateway'
            });
        }

        // 优先级 5: pm2
        if (isCommandAvailable('pm2')) {
            restartMethods.push({
                name: 'pm2',
                cmd: 'pm2 restart openclaw-gateway',
                manual: 'pm2 restart openclaw-gateway'
            });
        }

        // 优先级 6: service
        if (isCommandAvailable('service')) {
            restartMethods.push({
                name: 'service',
                cmd: 'service openclaw-gateway restart',
                manual: 'sudo service openclaw-gateway restart'
            });
        }

        // 尝试执行可用的重启方法
        let lastError = null;
        let successCount = 0;

        const tryRestart = (index) => {
            if (index >= restartMethods.length) {
                if (successCount > 0) {
                    resolve({ code: 0, msg: '重启命令已执行', currentTime: Math.floor(Date.now() / 1000) });
                } else {
                    const manualCommands = [
                        '# 自动重启失败，请手动执行以下操作：',
                        '',
                        '# 方法1: 使用 openclaw 命令',
                        'openclaw gateway restart',
                        '',
                        '# 方法2: 重启整个容器',
                        'docker restart openclaw-easy',
                        '',
                        '# 方法3: 在容器内手动重启',
                        'docker exec -it openclaw-easy bash',
                        'pkill -f "openclaw gateway run"',
                        '# supervisord 会自动重启 Gateway',
                        '',
                        '# 方法4: 重启 supervisord 服务',
                        'docker exec -it openclaw-easy supervisorctl restart openclaw-gateway'
                    ].join('\n');

                    reject(new Error(`无法自动重启服务\n\n${manualCommands}\n\n最后错误: ${lastError || '未知错误'}`));
                }
                return;
            }

            const { name, cmd, description } = restartMethods[index];
            console.log(`尝试重启方式 [${index + 1}/${restartMethods.length}]: ${name} - ${description}`);

            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    console.log(`❌ ${name} 失败: ${error.message}`);
                    lastError = error.message;
                    tryRestart(index + 1);
                } else {
                    successCount++;
                    resolve({ code: 0, msg: '重启命令已执行', currentTime: Math.floor(Date.now() / 1000) });
                }
            });
        };

        tryRestart(0);
    });
}

/**
 * 重启 openclaw-easy 服务
 */
async function restartEasy() {
    return new Promise((resolve, reject) => {
        const restartMethods = [];

        // 优先级 1: supervisorctl
        if (isCommandAvailable('supervisorctl')) {
            restartMethods.push({
                name: 'supervisorctl',
                cmd: 'supervisorctl restart openclaw-easy'
            });
        }

        // 优先级 2: pm2
        if (isCommandAvailable('pm2')) {
            restartMethods.push({
                name: 'pm2',
                cmd: 'pm2 restart openclaw-easy'
            });
        }

        // 优先级 3: systemctl
        if (isCommandAvailable('systemctl')) {
            restartMethods.push({
                name: 'systemctl',
                cmd: 'systemctl restart openclaw-easy'
            });
        }

        // 优先级 4: service
        if (isCommandAvailable('service')) {
            restartMethods.push({
                name: 'service',
                cmd: 'service openclaw-easy restart'
            });
        }

        // 优先级 5: kill 自身进程
        restartMethods.push({
            name: 'kill-self',
            cmd: 'pkill -f "node.*server.js"'
        });

        if (restartMethods.length === 0) {
            reject(new Error('没有可用的重启方式'));
            return;
        }

        let lastError = null;
        let success = false;

        const tryRestart = (index) => {
            if (index >= restartMethods.length) {
                if (!success) {
                    reject(new Error('所有重启方式都失败: ' + lastError));
                }
                return;
            }

            const { name, cmd } = restartMethods[index];
            console.log(`[重启Easy] 尝试: ${name}`);

            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    console.warn(`[重启Easy] ${name} 失败:`, error.message);
                    lastError = error.message;
                    tryRestart(index + 1);
                } else {
                    console.log(`[重启Easy] ${name} 成功`);
                    success = true;
                    resolve({ success: true, method: name });
                }
            });
        };

        tryRestart(0);
    });
}

module.exports = {
    restartGateway,
    restartEasy
};
