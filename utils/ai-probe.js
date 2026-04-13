/**
 * AI 配置连通性探测
 *
 * 通过向目标 AI API 发送一个最小化的 chat completions 请求，
 * 验证 apiUrl / apiKey / modelName 是否可用。
 */
const https = require('https');
const http = require('http');

const PROBE_TIMEOUT = 15 * 1000; // 15 秒超时

/**
 * 探测 AI API 连通性
 * @param {string} apiUrl    - 基础地址，如 https://api.deepseek.com/v1
 * @param {string} apiKey    - API Key
 * @param {string} modelName - 模型 ID
 * @returns {Promise<{ok: boolean, msg: string}>}
 */
async function probeAiConfig(apiUrl, apiKey, modelName) {
    // 拼接完整请求 URL
    let endpoint;
    try {
        // 兼容用户末尾带不带 /
        const base = apiUrl.replace(/\/+$/, '');
        endpoint = new URL(base + '/chat/completions');
    } catch (e) {
        return { ok: false, msg: 'API URL 格式不正确，请检查' };
    }

    const body = JSON.stringify({
        model: modelName,
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 5,
        stream: false
    });

    const options = {
        method: 'POST',
        hostname: endpoint.hostname,
        port: endpoint.port,
        path: endpoint.pathname + endpoint.search,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'Content-Length': Buffer.byteLength(body)
        },
        timeout: PROBE_TIMEOUT
    };

    const transport = endpoint.protocol === 'https:' ? https : http;

    return new Promise((resolve) => {
        const req = transport.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                const status = res.statusCode;

                // 200 - 成功
                if (status === 200) {
                    resolve({ ok: true, msg: 'AI 配置验证通过' });
                    return;
                }

                // 429 - 限流，配置本身正确
                if (status === 429) {
                    resolve({ ok: true, msg: 'API 可用，当前请求频率超限，配置有效' });
                    return;
                }

                // 尝试从响应体提取错误信息
                let detail = '';
                try {
                    const parsed = JSON.parse(data);
                    detail = parsed.error?.message || parsed.message || parsed.msg || '';
                } catch (e) {
                    // 响应不是 JSON，忽略
                }

                switch (status) {
                    case 401:
                    case 403:
                        resolve({ ok: false, msg: 'API Key 无效或已过期，请检查' });
                        return;
                    case 404:
                        resolve({ ok: false, msg: 'API URL 或模型名称不正确，请检查' });
                        return;
                    default:
                        if (status >= 500) {
                            resolve({ ok: false, msg: 'AI 服务暂时不可用，请稍后重试' });
                        } else {
                            resolve({ ok: false, msg: detail || `连接测试失败 (HTTP ${status})` });
                        }
                        return;
                }
            });
        });

        req.on('error', (err) => {
            const msg = err.message || '';
            if (msg.includes('ENOTFOUND') || msg.includes('getaddrinfo')) {
                resolve({ ok: false, msg: '无法解析 API 地址，请检查 URL 是否正确' });
            } else if (msg.includes('ECONNREFUSED')) {
                resolve({ ok: false, msg: '无法连接到 API 地址，请检查网络或 URL' });
            } else if (msg.includes('ETIMEDOUT') || msg.includes('TIMEDOUT')) {
                resolve({ ok: false, msg: '连接 API 超时，请检查网络或 URL 是否正确' });
            } else if (msg.includes('UNABLE_TO_VERIFY_LEAF_SIGNATURE') || msg.includes('CERT')) {
                resolve({ ok: false, msg: 'API 地址 SSL 证书异常，请检查 URL' });
            } else if (msg.includes('HPE_INVALID')) {
                resolve({ ok: false, msg: 'API 地址格式异常，请检查 URL' });
            } else {
                resolve({ ok: false, msg: `连接测试失败：${msg}` });
            }
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({ ok: false, msg: '连接 API 超时，请检查网络或 URL 是否正确' });
        });

        req.write(body);
        req.end();
    });
}

module.exports = { probeAiConfig };
