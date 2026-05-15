import re

with open('/root/.openclaw/workspace/openclaw-easy/routes/config.js', 'r') as f:
    content = f.read()

# 替换从 "// 构建 NIM 配置" 到 "res.json({" 的整个配置构建和保存块
old_block = '''        // 构建 NIM 配置（根据传参情况决定）
        const channels = { ...existingConfig.channels };
        
        channels.nim = {
            enabled: true
        };

        // 设置 appId + appSecret 组（如果传了）
        if (hasAppCredentialsGroup) {
            channels.nim.appId = appId.trim();
            channels.nim.appSecret = appSecret.trim();
        }

        // 设置 nickName + authToken 组（如果传了）
        if (hasAuthTokenGroup) {
            channels.nim.nickName = nickName.trim();
            channels.nim.authToken = authToken.trim();
        }

        // 构建插件配置 - 确保 nim 插件被正确注册
        const plugins = { ...existingConfig.plugins };
        plugins.enabled = true;
        plugins.entries = plugins.entries || {};
        plugins.entries.nim = { enabled: true };
        
        // 确保 nim 在 allow 列表中
        plugins.allow = plugins.allow || [];
        if (!plugins.allow.includes('nim')) {
            plugins.allow.push('nim');
        }
        
        // 设置插件加载路径

        // 合并配置
        const newConfig = {
            ...existingConfig,
            models: {
                ...existingConfig.models,
                mode: 'merge',
                providers: {
                    ...existingConfig.models?.providers,
                    default: defaultProvider
                }
            },
            agents: {
                ...existingConfig.agents,
                defaults: {
                    ...existingConfig.agents?.defaults,
                    model: {
                        primary: `default/${finalModelName}`
                    },
                    imageModel: {
                        primary: `default/${finalModelName}`
                    }
                }
            },
            channels,
            plugins
        };

        // 保存配置（openclaw.json）
        try {
            saveConfig(newConfig);
        } catch (e) {
            console.error('[配置保存] openclaw.json 写入失败:', e.message);
            return res.json({ code: 1001, errorMsg: '配置更新失败，请检查磁盘是否正常插入', currentTime: Math.floor(Date.now() / 1000) });
        }

        // 缓存 simple 接口的原始参数到文件（存原始传入值，不存 fallback 后的占位值）
        try {
            const cacheData = {
                apiUrl: (apiUrl && apiUrl.trim()) || '',
                apiKey: (apiKey && apiKey.trim()) || '',
                modelName: (modelName && modelName.trim()) || '',
                barCode: barCode.trim(),
                updatedAt: Math.floor(Date.now() / 1000)
            };
            if (hasAppCredentialsGroup) {
                cacheData.appId = appId.trim();
                cacheData.appSecret = appSecret.trim();
            }
            if (hasAuthTokenGroup) {
                cacheData.nickName = nickName.trim();
                cacheData.authToken = authToken.trim();
            }
            fs.writeFileSync(SIMPLE_CACHE_FILE, JSON.stringify(cacheData, null, 2), "utf8");
        } catch (e) {
            console.error('[配置保存] 缓存文件写入失败:', e.message);
        }

        // ==================== 异步重启（临时禁用，升级功能调试阶段不自动重启）====================
        // setImmediate(async () => {
        //     try {
        //         console.log('[配置保存] 开始异步重启 Gateway...');
        //         const result = await restartGateway();
        //         console.log('[配置保存] 异步重启结果:', result);
        //         console.log("[通知] 准备通知NAS, type=200(配置保存重启)");
        //         await notifyNas(200);
        //         console.log("[通知] NAS通知完成, type=200");
        //     } catch (error) {
        //         console.error('[配置保存] 异步重启失败:', error);
        //     }
        // });

        res.json({
            code: 0,
            msg: '配置已保存，服务正在自动重启中，请稍等一会儿后再使用',
            currentTime: Math.floor(Date.now() / 1000)
        });'''

new_block = '''        // ========== 检查 NIM 插件是否已安装 ==========
        const NIM_EXTENSIONS_DIR = '/root/.openclaw/extensions/openclaw-nim-yx-auth';
        const nimInstalled = fs.existsSync(NIM_EXTENSIONS_DIR) && fs.existsSync(path.join(NIM_EXTENSIONS_DIR, 'package.json'));

        if (!nimInstalled) {
            console.log('[config/simple] NIM 插件未安装，先保存 AI 配置，异步安装插件...');

            // 1. 先保存 AI 配置（不含 nim），让用户先用起来
            const aiOnlyConfig = {
                ...existingConfig,
                models: {
                    ...existingConfig.models,
                    mode: 'merge',
                    providers: {
                        ...existingConfig.models?.providers,
                        default: defaultProvider
                    }
                },
                agents: {
                    ...existingConfig.agents,
                    defaults: {
                        ...existingConfig.agents?.defaults,
                        model: {
                            primary: `default/${finalModelName}`
                        },
                        imageModel: {
                            primary: `default/${finalModelName}`
                        }
                    }
                }
            };
            try {
                saveConfig(aiOnlyConfig);
            } catch (e) {
                console.error('[config/simple] AI 配置保存失败:', e.message);
                return res.json({ code: 1001, errorMsg: '配置保存失败', currentTime: Math.floor(Date.now() / 1000) });
            }

            // 2. 缓存参数
            try {
                const cacheData = {
                    apiUrl: (apiUrl && apiUrl.trim()) || '',
                    apiKey: (apiKey && apiKey.trim()) || '',
                    modelName: (modelName && modelName.trim()) || '',
                    barCode: barCode.trim(),
                    updatedAt: Math.floor(Date.now() / 1000)
                };
                if (hasAppCredentialsGroup) { cacheData.appId = appId.trim(); cacheData.appSecret = appSecret.trim(); }
                if (hasAuthTokenGroup) { cacheData.nickName = nickName.trim(); cacheData.authToken = authToken.trim(); }
                fs.writeFileSync(SIMPLE_CACHE_FILE, JSON.stringify(cacheData, null, 2), "utf8");
            } catch (e) {
                console.error('[config/simple] 缓存写入失败:', e.message);
            }

            // 3. 异步安装插件，安装成功后补写 nim 配置并重启
            setImmediate(async () => {
                try {
                    console.log('[config/simple] 开始安装 openclaw-nim-yx-auth@0.3.0 ...');
                    const { execSync } = require('child_process');

                    // 3a. 先从配置中移除 nim 引用，避免 openclaw 命令报错
                    try {
                        const cfg = JSON.parse(fs.readFileSync('/root/.openclaw/openclaw.json', 'utf8'));
                        let changed = false;
                        if (cfg.channels && cfg.channels.nim) {
                            delete cfg.channels.nim;
                            if (Object.keys(cfg.channels).length === 0) delete cfg.channels;
                            changed = true;
                        }
                        if (cfg.plugins && cfg.plugins.allow) {
                            cfg.plugins.allow = cfg.plugins.allow.filter(p => p !== 'nim');
                            if (cfg.plugins.allow.length === 0) delete cfg.plugins.allow;
                            changed = true;
                        }
                        if (changed) {
                            fs.writeFileSync('/root/.openclaw/openclaw.json', JSON.stringify(cfg, null, 2));
                            console.log('[config/simple] 已临时移除 nim 引用');
                        }
                    } catch (e) {
                        console.error('[config/simple] 移除 nim 引用失败:', e.message);
                    }

                    // 3b. 安装插件
                    let installOk = false;
                    try {
                        execSync('openclaw plugins install "openclaw-nim-yx-auth@0.3.0"', { timeout: 120000, stdio: 'pipe' });
                        installOk = true;
                        console.log('[config/simple] openclaw plugins install 成功');
                    } catch (e) {
                        console.error('[config/simple] openclaw plugins install 失败，尝试 npm fallback:', e.message);
                        try {
                            execSync('npm pack "openclaw-nim-yx-auth@0.3.0"', { cwd: '/tmp', timeout: 60000, stdio: 'pipe' });
                            const tgzFiles = fs.readdirSync('/tmp').filter(f => f.startsWith('openclaw-nim-yx-auth-') && f.endsWith('.tgz'));
                            if (tgzFiles.length > 0) {
                                fs.mkdirSync(NIM_EXTENSIONS_DIR, { recursive: true });
                                execSync('tar xzf /tmp/' + tgzFiles[0] + ' -C ' + NIM_EXTENSIONS_DIR + ' --strip-components=1', { stdio: 'pipe' });
                                execSync('npm install --production', { cwd: NIM_EXTENSIONS_DIR, timeout: 120000, stdio: 'pipe' });
                                installOk = true;
                                console.log('[config/simple] npm pack fallback 安装成功');
                            }
                            tgzFiles.forEach(f => fs.unlinkSync(path.join('/tmp', f)));
                        } catch (e2) {
                            console.error('[config/simple] npm fallback 也失败:', e2.message);
                        }
                    }

                    if (installOk) {
                        // 3c. 安装成功，补写 nim 配置
                        const cfg = JSON.parse(fs.readFileSync('/root/.openclaw/openclaw.json', 'utf8'));

                        // channels.nim
                        if (!cfg.channels) cfg.channels = {};
                        cfg.channels.nim = { enabled: true };
                        if (hasAppCredentialsGroup) {
                            cfg.channels.nim.appId = appId.trim();
                            cfg.channels.nim.appSecret = appSecret.trim();
                        }
                        if (hasAuthTokenGroup) {
                            cfg.channels.nim.nickName = nickName.trim();
                            cfg.channels.nim.authToken = authToken.trim();
                        }

                        // plugins
                        if (!cfg.plugins) cfg.plugins = {};
                        cfg.plugins.enabled = true;
                        if (!cfg.plugins.entries) cfg.plugins.entries = {};
                        cfg.plugins.entries.nim = { enabled: true };
                        if (!cfg.plugins.allow) cfg.plugins.allow = [];
                        if (!cfg.plugins.allow.includes('nim')) cfg.plugins.allow.push('nim');

                        fs.writeFileSync('/root/.openclaw/openclaw.json', JSON.stringify(cfg, null, 2));
                        console.log('[config/simple] NIM 配置已补写完成');
                    }

                    // 3d. 重启 gateway
                    console.log('[config/simple] 重启 Gateway...');
                    const result = await restartGateway();
                    console.log('[config/simple] Gateway 重启结果:', result);
                    await notifyNas(200);
                } catch (error) {
                    console.error('[config/simple] 异步安装流程异常:', error);
                }
            });

            return res.json({
                code: 0,
                msg: 'AI 配置已保存，NIM 插件正在后台安装中，安装完成后将自动配置并重启服务，请稍候',
                data: { nimInstalling: true },
                currentTime: Math.floor(Date.now() / 1000)
            });
        }

        // ========== NIM 插件已安装，正常构建完整配置 ==========
        // 构建 NIM 配置
        const channels = { ...existingConfig.channels };
        channels.nim = { enabled: true };
        if (hasAppCredentialsGroup) {
            channels.nim.appId = appId.trim();
            channels.nim.appSecret = appSecret.trim();
        }
        if (hasAuthTokenGroup) {
            channels.nim.nickName = nickName.trim();
            channels.nim.authToken = authToken.trim();
        }

        // 构建插件配置（不含 load.paths，openclaw 自动感知）
        const plugins = { ...existingConfig.plugins };
        plugins.enabled = true;
        if (!plugins.entries) plugins.entries = {};
        plugins.entries.nim = { enabled: true };
        if (!plugins.allow) plugins.allow = [];
        if (!plugins.allow.includes('nim')) plugins.allow.push('nim');

        // 合并配置
        const newConfig = {
            ...existingConfig,
            models: {
                ...existingConfig.models,
                mode: 'merge',
                providers: {
                    ...existingConfig.models?.providers,
                    default: defaultProvider
                }
            },
            agents: {
                ...existingConfig.agents,
                defaults: {
                    ...existingConfig.agents?.defaults,
                    model: {
                        primary: `default/${finalModelName}`
                    },
                    imageModel: {
                        primary: `default/${finalModelName}`
                    }
                }
            },
            channels,
            plugins
        };

        // 保存配置（openclaw.json）
        try {
            saveConfig(newConfig);
        } catch (e) {
            console.error('[配置保存] openclaw.json 写入失败:', e.message);
            return res.json({ code: 1001, errorMsg: '配置更新失败，请检查磁盘是否正常插入', currentTime: Math.floor(Date.now() / 1000) });
        }

        // 缓存 simple 接口的原始参数
        try {
            const cacheData = {
                apiUrl: (apiUrl && apiUrl.trim()) || '',
                apiKey: (apiKey && apiKey.trim()) || '',
                modelName: (modelName && modelName.trim()) || '',
                barCode: barCode.trim(),
                updatedAt: Math.floor(Date.now() / 1000)
            };
            if (hasAppCredentialsGroup) { cacheData.appId = appId.trim(); cacheData.appSecret = appSecret.trim(); }
            if (hasAuthTokenGroup) { cacheData.nickName = nickName.trim(); cacheData.authToken = authToken.trim(); }
            fs.writeFileSync(SIMPLE_CACHE_FILE, JSON.stringify(cacheData, null, 2), "utf8");
        } catch (e) {
            console.error('[配置保存] 缓存文件写入失败:', e.message);
        }

        // 异步重启
        setImmediate(async () => {
            try {
                console.log('[配置保存] 开始异步重启 Gateway...');
                const result = await restartGateway();
                console.log('[配置保存] 异步重启结果:', result);
                await notifyNas(200);
            } catch (error) {
                console.error('[配置保存] 异步重启失败:', error);
            }
        });

        res.json({
            code: 0,
            msg: '配置已保存，服务正在自动重启中，请稍等一会儿后再使用',
            currentTime: Math.floor(Date.now() / 1000)
        });'''

if old_block in content:
    content = content.replace(old_block, new_block)
    with open('/root/.openclaw/workspace/openclaw-easy/routes/config.js', 'w') as f:
        f.write(content)
    print('PATCHED OK')
else:
    print('NOT FOUND')
