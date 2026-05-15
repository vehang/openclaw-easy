import os

os.chdir('/root/.openclaw/workspace/openclaw-easy')

with open('routes/config.js', 'r') as f:
    content = f.read()

old = '''        // 构建 NIM 配置（根据传参情况决定）
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
        plugins.load = plugins.load || {};
        plugins.load.paths = plugins.load.paths || [];
        const nimPluginPath = '/root/.openclaw/extensions/openclaw-nim-yx-auth';
        if (!plugins.load.paths.includes(nimPluginPath)) {
            plugins.load.paths.push(nimPluginPath);
        }

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
        };'''

new = '''        // ========== 检查 NIM 插件是否已安装 ==========
        const NIM_EXTENSIONS_DIR = '/root/.openclaw/extensions/openclaw-nim-yx-auth';
        const nimInstalled = fs.existsSync(NIM_EXTENSIONS_DIR) && fs.existsSync(path.join(NIM_EXTENSIONS_DIR, 'package.json'));

        if (!nimInstalled) {
            console.log('[config/simple] NIM 插件未安装，开始异步安装...');
            
            // 先保存 AI 配置（不含 nim），让用户先用起来
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
            saveConfig(aiOnlyConfig);

            // 缓存参数
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

            // 异步安装插件，安装成功后补写 nim 配置并重启
            setImmediate(async () => {
                try {
                    console.log('[config/simple] 开始安装 openclaw-nim-yx-auth@0.3.0 ...');
                    const { execSync } = require('child_process');
                    
                    // 先从配置中移除 nim 引用，避免 openclaw 命令报错
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
                    
                    // 安装插件
                    let installOk = false;
                    try {
                        execSync('openclaw plugins install "openclaw-nim-yx-auth@0.3.0"', { timeout: 120000, stdio: 'pipe' });
                        installOk = true;
                        console.log('[config/simple] openclaw plugins install 成功');
                    } catch (e) {
                        console.error('[config/simple] openclaw plugins install 失败，尝试 npm fallback:', e.message);
                        try {
                            execSync('npm pack "openclaw-nim-yx-auth@0.3.0"', { cwd: '/tmp', timeout: 60000, stdio: 'pipe' });
                            const files = fs.readdirSync('/tmp').filter(f => f.startsWith('openclaw-nim-yx-auth-') && f.endsWith('.tgz'));
                            if (files.length > 0) {
                                fs.mkdirSync(NIM_EXTENSIONS_DIR, { recursive: true });
                                execSync('tar xzf /tmp/' + files[0] + ' -C ' + NIM_EXTENSIONS_DIR + ' --strip-components=1', { stdio: 'pipe' });
                                execSync('npm install --production', { cwd: NIM_EXTENSIONS_DIR, timeout: 120000, stdio: 'pipe' });
                                installOk = true;
                                console.log('[config/simple] npm pack fallback 安装成功');
                            }
                            files.forEach(f => fs.unlinkSync(path.join('/tmp', f)));
                        } catch (e2) {
                            console.error('[config/simple] npm fallback 也失败:', e2.message);
                        }
                    }

                    if (installOk) {
                        // 安装成功，补写 nim 配置
                        const cfg = JSON.parse(fs.readFileSync('/root/.openclaw/openclaw.json', 'utf8'));
                        
                        // 构建 NIM 配置
                        const channels = cfg.channels || {};
                        channels.nim = { enabled: true };
                        if (hasAppCredentialsGroup) {
                            channels.nim.appId = appId.trim();
                            channels.nim.appSecret = appSecret.trim();
                        }
                        if (hasAuthTokenGroup) {
                            channels.nim.nickName = nickName.trim();
                            channels.nim.authToken = authToken.trim();
                        }
                        cfg.channels = channels;

                        // 构建插件配置
                        cfg.plugins = cfg.plugins || {};
                        cfg.plugins.enabled = true;
                        cfg.plugins.entries = cfg.plugins.entries || {};
                        cfg.plugins.entries.nim = { enabled: true };
                        cfg.plugins.allow = cfg.plugins.allow || [];
                        if (!cfg.plugins.allow.includes('nim')) cfg.plugins.allow.push('nim');
                        cfg.plugins.load = cfg.plugins.load || {};
                        cfg.plugins.load.paths = cfg.plugins.load.paths || [];
                        if (!cfg.plugins.load.paths.includes(NIM_EXTENSIONS_DIR)) cfg.plugins.load.paths.push(NIM_EXTENSIONS_DIR);

                        fs.writeFileSync('/root/.openclaw/openclaw.json', JSON.stringify(cfg, null, 2));
                        console.log('[config/simple] NIM 配置已补写完成，重启 Gateway...');

                        const result = await restartGateway();
                        console.log('[config/simple] Gateway 重启结果:', result);
                        await notifyNas(200);
                    } else {
                        console.error('[config/simple] NIM 插件安装失败，NIM 功能不可用');
                        const result = await restartGateway();
                        console.log('[config/simple] Gateway 重启结果:', result);
                        await notifyNas(200);
                    }
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
        // 构建 NIM 配置（根据传参情况决定）
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
        plugins.load = plugins.load || {};
        plugins.load.paths = plugins.load.paths || [];
        const nimPluginPath = '/root/.openclaw/extensions/openclaw-nim-yx-auth';
        if (!plugins.load.paths.includes(nimPluginPath)) {
            plugins.load.paths.push(nimPluginPath);
        }

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
        };'''

if old in content:
    content = content.replace(old, new)
    with open('routes/config.js', 'w') as f:
        f.write(content)
    print('PATCHED OK')
else:
    idx = content.find('\u6784\u5efa NIM \u914d\u7f6e\uff08\u6839\u636e\u4f20\u53c2\u60c5\u51b5\u51b3\u5b9a\uff09')
    if idx >= 0:
        print(f'Found at index {idx}')
        print('Context:', repr(content[idx:idx+100]))
    else:
        print('NOT FOUND')
