/**
 * 渠道必填字段定义
 */
const CHANNEL_REQUIRED_FIELDS = {
    feishu: {
        name: '飞书',
        fields: [
            { key: 'appId', label: 'App ID' },
            { key: 'appSecret', label: 'App Secret' }
        ]
    },
    dingtalk: {
        name: '钉钉',
        fields: [
            { key: 'clientId', label: 'Client ID' },
            { key: 'clientSecret', label: 'Client Secret' }
        ]
    },
    qqbot: {
        name: 'QQ机器人',
        fields: [
            { key: 'appId', label: 'App ID' },
            { key: 'clientSecret', label: 'Client Secret' }
        ]
    },
    wecom: {
        name: '企业微信',
        fields: [
            { key: 'token', label: 'Token' },
            { key: 'encodingAesKey', label: 'Encoding AES Key' }
        ]
    }
    // 注意：nim (网易云信) 有两种认证方式：
    // 1. appId + appSecret
    // 2. authToken
    // 两组数据有一组即可，不在此处验证
};

module.exports = { CHANNEL_REQUIRED_FIELDS };
