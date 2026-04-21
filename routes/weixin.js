/**
 * 微信路由
 * 
 * 接口列表：
 * - GET  /login      微信登录 - SSE 实时输出
 * - GET  /bound      获取微信绑定状态
 * - POST /bound      设置微信绑定状态
 * - POST /qr/start   启动微信二维码登录任务
 * - GET  /qr/status  获取微信二维码登录状态
 */
const express = require('express');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const router = express.Router();

const { authMiddleware, appAuthMiddleware } = require('../middleware');
const { WEIXIN_QR_STATE_FILE, WEIXIN_BOUND_FILE, OPENCLAW_DIR } = require('../constants');
const { getCurrentWeixinTask, setCurrentWeixinTask, clearCurrentWeixinTask } = require('../state');
const { updateWeixinQrState, getWeixinBoundStatus, setWeixinBoundStatus, spawnWeixinPluginInstall } = require('../utils/weixin');
const { restartGateway } = require('../utils/restart');
const { notifyNas } = require('../utils/common');

/**
 * GET /login
 * 微信登录 - SSE 实时输出
 * 先安装/更新微信插件，再执行登录
 */
router.get('/login', authMiddleware, (req, res) => {
    // 设置 SSE 头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // 发送 SSE 消息的辅助函数
    const sendEvent = (type, data) => {
        res.write(`event: ${type}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // 客户端断开标记
    let clientDisconnected = false;

    // 客户端断开连接时终止进程
    req.on('close', () => {
        clientDisconnected = true;
        console.log('[微信登录] 客户端断开连接');
        clearCurrentWeixinTask();
        res.end();
    });

    // 发送初始状态
    sendEvent('status', { code: 0, msg: '正在安装/更新微信插件...' });
    sendEvent('output', { code: 0, msg: '', data: { text: '$ npx -y @tencent-weixin/openclaw-weixin-cli@latest install\n\n' } });

    // 第一步：安装微信插件
    const installChild = spawnWeixinPluginInstall();

    installChild.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('[微信插件安装] stdout:', output);
        sendEvent('output', { code: 0, msg: '', data: { text: output } });
    });

    installChild.stderr.on('data', (data) => {
        const output = data.toString();
        console.log('[微信插件安装] stderr:', output);
        sendEvent('output', { code: 0, msg: '', data: { text: output } });
    });

    installChild.on('error', (error) => {
        console.error('[微信插件安装] 进程错误:', error);
        sendEvent('error', { code: 1000, msg: `插件安装启动失败: ${error.message}` });
        res.end();
    });

    installChild.on('close', (installCode) => {
        if (clientDisconnected) return;

        if (installCode !== 0) {
            console.warn('[微信插件安装] 退出码:', installCode, '，继续尝试登录...');
            sendEvent('output', { code: 0, msg: '', data: { text: `\n⚠️ 插件安装退出码: ${installCode}，继续尝试登录...\n\n` } });
        } else {
            console.log('[微信插件安装] 安装成功');
            sendEvent('output', { code: 0, msg: '', data: { text: '\n✅ 微信插件安装成功\n\n' } });
        }

        // 第二步：执行登录命令
        sendEvent('status', { code: 0, msg: '正在启动微信登录...' });
        sendEvent('output', { code: 0, msg: '', data: { text: '$ openclaw channels login --channel openclaw-weixin\n\n' } });

        const loginChild = spawn('openclaw', ['channels', 'login', '--channel', 'openclaw-weixin'], {
            env: { ...process.env, TERM: 'xterm-256color' },
            shell: true
        });

        console.log('[微信登录] 开始执行登录命令...');

        loginChild.stdout.on('data', (data) => {
            const output = data.toString();
            console.log('[微信登录] stdout:', output);
            sendEvent('output', { code: 0, msg: '', data: { text: output } });
        });

        loginChild.stderr.on('data', (data) => {
            const output = data.toString();
            console.log('[微信登录] stderr:', output);
            sendEvent('output', { code: 0, msg: '', data: { text: output } });
        });

        loginChild.on('close', (code) => {
            if (clientDisconnected) return;
            console.log('[微信登录] 进程结束，退出码:', code);
            if (code === 0) {
                sendEvent('complete', { code: 0, msg: '登录成功' });
            } else {
                sendEvent('complete', { code: 1000, msg: `登录失败，退出码: ${code}` });
            }
            res.end();
        });

        loginChild.on('error', (error) => {
            if (clientDisconnected) return;
            console.error('[微信登录] 进程错误:', error);
            sendEvent('error', { code: 1000, msg: `启动失败: ${error.message}` });
            res.end();
        });

        req.on('close', () => {
            loginChild.kill();
        });
    });
});

/**
 * GET /bound
 * 获取微信绑定状态
 */
router.get('/bound', authMiddleware, (req, res) => {
    try {
        const bound = getWeixinBoundStatus();
        res.json({ code: 0, msg: '成功', data: { bound }, currentTime: Math.floor(Date.now() / 1000) });
    } catch (error) {
        res.json({ code: 0, msg: '成功', data: { bound: false }, currentTime: Math.floor(Date.now() / 1000) });
    }
});

/**
 * POST /bound
 * 设置微信绑定状态
 */
router.post('/bound', authMiddleware, (req, res) => {
    try {
        const { bound } = req.body;
        setWeixinBoundStatus(bound);
        
        // 异步重启（仅绑定成功时）
        if (bound === true) {
            setImmediate(async () => {
                try {
                    console.log('[微信绑定] 开始异步重启 Gateway...');
                    const result = await restartGateway();
                    console.log('[微信绑定] 异步重启结果:', result);
                    console.log("[通知] 准备通知NAS, type=200(微信绑定重启)");
                    await notifyNas(200);
                    console.log("[通知] NAS通知完成, type=200");
                } catch (error) {
                    console.error('[微信绑定] 异步重启失败:', error);
                }
            });
        }
        
        res.json({ 
            code: 0, 
            msg: bound === true ? '绑定成功，服务正在自动重启中，请稍等一会儿后再使用' : '保存成功', 
            currentTime: Math.floor(Date.now() / 1000) 
        });
    } catch (error) {
        console.error('[微信] 保存绑定状态失败:', error);
        res.json({ code: 1000, errorMsg: '保存失败', currentTime: Math.floor(Date.now() / 1000) });
    }
});

/**
 * POST /qr/start
 * 启动微信二维码登录任务
 * 先安装/更新微信插件，再执行登录
 */
router.post('/qr/start', appAuthMiddleware, async (req, res) => {
    try {
        console.log('[微信QR] 收到启动请求');

        // 检查是否已有任务运行
        const currentTask = getCurrentWeixinTask();
        if (currentTask && currentTask.childProcess) {
            console.log('[微信QR] 已有任务运行，自动停止:', currentTask.taskId);

            // 停止旧任务
            currentTask.childProcess.kill();
            clearCurrentWeixinTask();

            // 更新状态文件为已停止
            updateWeixinQrState({ status: 'stopped', errorMsg: '被新任务替换' });
        }

        // 生成任务ID
        const taskId = 'weixin-qr-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);

        // 初始化状态文件 - 先进入 installing 状态
        updateWeixinQrState({
            taskId: taskId,
            status: 'installing',
            qrUrl: null,
            updatedAt: Math.floor(Date.now() / 1000),
            errorMsg: null
        });

        // 立即返回响应
        res.json({
            code: 0,
            msg: '任务已启动，正在安装微信插件',
            currentTime: Math.floor(Date.now() / 1000),
            data: { taskId }
        });

        // 后台异步执行：先安装插件，再登录
        setImmediate(() => {
            console.log('[微信QR] 开始安装微信插件...');

            const installChild = spawnWeixinPluginInstall();

            // 记录安装进程为当前任务（便于中途取消）
            setCurrentWeixinTask({
                taskId: taskId,
                childProcess: installChild,
                pid: installChild.pid,
                startTime: Date.now(),
                startedBy: 'qr-api'
            });

            installChild.on('close', (installCode) => {
                if (installCode !== 0) {
                    console.warn('[微信QR] 插件安装退出码:', installCode, '，继续尝试登录...');
                } else {
                    console.log('[微信QR] 微信插件安装成功');
                }

                // 更新状态为 loading（开始登录）
                updateWeixinQrState({
                    taskId: taskId,
                    status: 'loading',
                    qrUrl: null,
                    updatedAt: Math.floor(Date.now() / 1000)
                });

                // 开始执行登录命令
                console.log('[微信QR] 开始执行登录命令...');

                const child = spawn('openclaw', ['channels', 'login', '--channel', 'openclaw-weixin'], {
                    env: { ...process.env, TERM: 'xterm-256color' },
                    shell: true
                });

                // 更新任务进程为登录进程
                setCurrentWeixinTask({
                    taskId: taskId,
                    childProcess: child,
                    pid: child.pid,
                    startTime: Date.now(),
                    startedBy: 'qr-api'
                });

                // 累积输出用于解析二维码
                let allOutput = '';

                // 捕获标准输出
                child.stdout.on('data', (data) => {
                    const output = data.toString();
                    allOutput += output;
                    console.log('[微信QR] stdout:', output.substring(0, 100));

                    // 解析二维码链接
                    const qrcodeMatches = allOutput.match(/https?:\/\/liteapp\.weixin\.qq\.com\/q\/[^\s]+/g);

                    if (qrcodeMatches && qrcodeMatches.length > 0) {
                        let qrUrl = qrcodeMatches[qrcodeMatches.length - 1];
                        qrUrl = qrUrl.trim();

                        console.log('[微信QR] 解析到二维码:', qrUrl.substring(0, 60));

                        updateWeixinQrState({
                            taskId: taskId,
                            status: 'waiting',
                            qrUrl: qrUrl,
                            updatedAt: Math.floor(Date.now() / 1000)
                        });
                    }
                });

                // 捕获错误输出
                child.stderr.on('data', (data) => {
                    const output = data.toString();
                    allOutput += output;
                    console.log('[微信QR] stderr:', output.substring(0, 100));

                    const qrcodeMatches = allOutput.match(/https?:\/\/liteapp\.weixin\.qq\.com\/q\/[^\s]+/g);

                    if (qrcodeMatches && qrcodeMatches.length > 0) {
                        let qrUrl = qrcodeMatches[qrcodeMatches.length - 1];
                        qrUrl = qrUrl.trim();

                        updateWeixinQrState({
                            taskId: taskId,
                            status: 'waiting',
                            qrUrl: qrUrl,
                            updatedAt: Math.floor(Date.now() / 1000)
                        });
                    }
                });

                // 进程结束
                child.on('close', (code) => {
                    console.log('[微信QR] 进程结束，退出码:', code);

                    if (code === 0) {
                        updateWeixinQrState({
                            taskId: taskId,
                            status: 'success',
                            updatedAt: Math.floor(Date.now() / 1000)
                        });

                        setWeixinBoundStatus(true);
                        console.log('[微信QR] 登录成功，已写入绑定状态');

                        setImmediate(async () => {
                            try {
                                console.log('[微信QR] 开始异步重启 Gateway...');
                                const result = await restartGateway();
                                console.log('[微信QR] 异步重启结果:', result);
                                console.log("[通知] 准备通知NAS, type=200(微信QR重启)");
                                await notifyNas(200);
                                console.log("[通知] NAS通知完成, type=200");
                            } catch (error) {
                                console.error('[微信QR] 异步重启失败:', error);
                            }
                        });
                    } else {
                        updateWeixinQrState({
                            taskId: taskId,
                            status: 'timeout',
                            errorMsg: '进程退出码: ' + code,
                            updatedAt: Math.floor(Date.now() / 1000)
                        });
                        console.log('[微信QR] 登录失败/超时');
                    }

                    clearCurrentWeixinTask();
                });

                // 进程错误
                child.on('error', (error) => {
                    console.error('[微信QR] 进程错误:', error);

                    updateWeixinQrState({
                        taskId: taskId,
                        status: 'error',
                        errorMsg: error.message,
                        updatedAt: Math.floor(Date.now() / 1000)
                    });

                    clearCurrentWeixinTask();
                });
            });

            installChild.on('error', (error) => {
                console.error('[微信QR] 插件安装进程错误:', error);

                // 安装失败也继续尝试登录
                updateWeixinQrState({
                    taskId: taskId,
                    status: 'loading',
                    qrUrl: null,
                    updatedAt: Math.floor(Date.now() / 1000)
                });
            });
        });

    } catch (error) {
        console.error('[微信QR] 启动失败:', error);
        res.json({
            code: 1000,
            errorMsg: '启动失败: ' + error.message,
            currentTime: Math.floor(Date.now() / 1000)
        });
    }
});

/**
 * GET /qr/status
 * 获取微信二维码登录状态
 */
router.get('/qr/status', appAuthMiddleware, (req, res) => {
    try {
        // 检查状态文件是否存在
        if (!fs.existsSync(WEIXIN_QR_STATE_FILE)) {
            return res.json({
                code: 1002,
                errorMsg: '没有正在运行的登录任务',
                currentTime: Math.floor(Date.now() / 1000)
            });
        }
        
        // 读取状态文件
        const stateData = JSON.parse(fs.readFileSync(WEIXIN_QR_STATE_FILE, 'utf8'));
        
        // 根据状态返回不同响应
        switch (stateData.status) {
            case 'installing':
                return res.json({
                    code: 0,
                    msg: 'installing',
                    currentTime: Math.floor(Date.now() / 1000),
                    data: {
                        taskId: stateData.taskId,
                        status: 'installing',
                        qrUrl: null,
                        updatedAt: stateData.updatedAt
                    }
                });

            case 'loading':
                return res.json({
                    code: 0,
                    msg: 'loading',
                    currentTime: Math.floor(Date.now() / 1000),
                    data: {
                        taskId: stateData.taskId,
                        status: 'loading',
                        qrUrl: null,
                        updatedAt: stateData.updatedAt
                    }
                });
                
            case 'waiting':
                return res.json({
                    code: 0,
                    msg: 'waiting',
                    currentTime: Math.floor(Date.now() / 1000),
                    data: {
                        taskId: stateData.taskId,
                        status: 'waiting',
                        qrUrl: stateData.qrUrl,
                        updatedAt: stateData.updatedAt
                    }
                });
                
            case 'success':
                return res.json({
                    code: 0,
                    msg: 'success',
                    currentTime: Math.floor(Date.now() / 1000),
                    data: {
                        taskId: stateData.taskId,
                        status: 'success',
                        updatedAt: stateData.updatedAt
                    }
                });
                
            case 'timeout':
                return res.json({
                    code: 1001,
                    errorMsg: '二维码已过期或登录失败',
                    currentTime: Math.floor(Date.now() / 1000),
                    data: {
                        taskId: stateData.taskId,
                        status: 'timeout',
                        errorMsg: stateData.errorMsg,
                        updatedAt: stateData.updatedAt
                    }
                });
                
            case 'error':
                return res.json({
                    code: 1001,
                    errorMsg: '登录出错',
                    currentTime: Math.floor(Date.now() / 1000),
                    data: {
                        taskId: stateData.taskId,
                        status: 'error',
                        errorMsg: stateData.errorMsg,
                        updatedAt: stateData.updatedAt
                    }
                });
                
            case 'stopped':
                return res.json({
                    code: 1002,
                    errorMsg: '任务已停止',
                    currentTime: Math.floor(Date.now() / 1000),
                    data: {
                        taskId: stateData.taskId,
                        status: 'stopped'
                    }
                });
                
            default:
                return res.json({
                    code: 1000,
                    errorMsg: '未知状态',
                    currentTime: Math.floor(Date.now() / 1000),
                    data: stateData
                });
        }
        
    } catch (error) {
        console.error('[微信QR] 状态查询失败:', error);
        res.json({
            code: 1000,
            errorMsg: '状态查询失败',
            currentTime: Math.floor(Date.now() / 1000)
        });
    }
});

module.exports = router;
