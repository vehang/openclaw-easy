#!/usr/bin/env node
const https = require('https');
const fs = require('fs');

const CONFIG = {
  appId: 'cli_a91476e0a5f8dbc0',
  appSecret: 'CRV8phtp1hTE7sz5tpwlCfGXnaIEvWCV',
  openId: 'ou_7172afb8fa3c2f51bb02b6af097a4b27',
};

function req(method, url, body, headers) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = body ? JSON.stringify(body) : null;
    const h = Object.assign({ 'Content-Type': 'application/json' }, headers || {});
    const r = https.request({ hostname: u.hostname, path: u.pathname + u.search, method, headers: h }, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

(async () => {
  const card = JSON.parse(fs.readFileSync(__dirname + '/daily-card.json', 'utf8'));
  const token = await req('POST', 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    app_id: CONFIG.appId, app_secret: CONFIG.appSecret,
  });
  if (!token.tenant_access_token) { console.error('token fail', token); process.exit(1); }
  const res = await req('POST',
    'https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id',
    { receive_id: CONFIG.openId, msg_type: 'interactive', content: JSON.stringify(card) },
    { Authorization: 'Bearer ' + token.tenant_access_token });
  console.log(JSON.stringify(res));
})();
