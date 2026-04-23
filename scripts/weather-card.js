#!/usr/bin/env node
/**
 * 天气早报推送脚本
 * 从 wttr.in 获取宜昌天气，组装飞书卡片消息推送
 * 
 * 用法: node weather-card.js
 * 
 * 环境变量:
 *   FEISHU_APP_ID     - 飞书应用 ID (默认: cli_a91476e0a5f8dbc0)
 *   FEISHU_APP_SECRET - 飞书应用 Secret
 *   FEISHU_USER_ID    - 推送目标用户 open_id
 *   WEATHER_LAT       - 纬度 (默认: 30.77)
 *   WEATHER_LON       - 经度 (默认: 111.33)
 */

const https = require('https');
const http = require('http');

// === 配置 ===
const LAT = process.env.WEATHER_LAT || '30.77';
const LON = process.env.WEATHER_LON || '111.33';
const APP_ID = process.env.FEISHU_APP_ID || 'cli_a91476e0a5f8dbc0';
const APP_SECRET = process.env.FEISHU_APP_SECRET;
const USER_ID = process.env.FEISHU_USER_ID || 'ou_7172afb8fa3c2f51bb02b6af097a4b27';

// 天气描述中文映射
const weatherMap = {
  'Sunny': '☀️ 晴',
  'Clear': '🌙 晴',
  'Partly cloudy': '⛅ 多云',
  'Partly Cloudy': '⛅ 多云',
  'Cloudy': '☁️ 多云',
  'Overcast': '🌥️ 阴天',
  'Mist': '🌫️ 雾',
  'Fog': '🌫️ 大雾',
  'Light rain': '🌦️ 小雨',
  'Light drizzle': '🌦️ 毛毛雨',
  'Patchy rain nearby': '🌦️ 零星小雨',
  'Patchy light drizzle': '🌦️ 零星细雨',
  'Moderate rain': '🌧️ 中雨',
  'Heavy rain': '🌧️ 大雨',
  'Light rain shower': '🌦️ 阵雨',
  'Moderate or heavy rain shower': '🌧️ 大阵雨',
  'Thunderstorm': '⛈️ 雷暴',
  'Light snow': '🌨️ 小雪',
  'Moderate snow': '🌨️ 中雪',
  'Heavy snow': '❄️ 大雪',
  'Patchy snow nearby': '🌨️ 零星小雪',
};

function mapWeather(desc) {
  if (!desc) return '🌈 未知';
  for (const [k, v] of Object.entries(weatherMap)) {
    if (desc.toLowerCase().includes(k.toLowerCase())) return v;
  }
  return '🌈 ' + desc;
}

// 农历简化对照表 (2026年)
const lunarTable2026 = {
  '2026-01-01':'冬月十三','2026-01-02':'冬月十四','2026-01-03':'冬月十五','2026-01-04':'冬月十六',
  '2026-01-05':'冬月十七','2026-01-06':'冬月十八','2026-01-07':'冬月十九','2026-01-08':'冬月二十',
  '2026-01-09':'冬月廿一','2026-01-10':'冬月廿二','2026-01-11':'冬月廿三','2026-01-12':'冬月廿四',
  '2026-01-13':'冬月廿五','2026-01-14':'冬月廿六','2026-01-15':'冬月廿七','2026-01-16':'冬月廿八',
  '2026-01-17':'冬月廿九','2026-01-18':'冬月三十','2026-01-19':'腊月初一','2026-01-20':'腊月初二',
  '2026-01-21':'腊月初三','2026-01-22':'腊月初四','2026-01-23':'腊月初五','2026-01-24':'腊月初六',
  '2026-01-25':'腊月初七','2026-01-26':'腊月初八','2026-01-27':'腊月初九','2026-01-28':'腊月初十',
  '2026-01-29':'腊月十一','2026-01-30':'腊月十二','2026-01-31':'腊月十三',
  '2026-02-01':'腊月十四','2026-02-02':'腊月十五','2026-02-03':'腊月十六','2026-02-04':'腊月十七',
  '2026-02-05':'腊月十八','2026-02-06':'腊月十九','2026-02-07':'腊月二十','2026-02-08':'腊月廿一',
  '2026-02-09':'腊月廿二','2026-02-10':'腊月廿三','2026-02-11':'腊月廿四','2026-02-12':'腊月廿五',
  '2026-02-13':'腊月廿六','2026-02-14':'腊月廿七','2026-02-15':'腊月廿八','2026-02-16':'腊月廿九',
  '2026-02-17':'除夕','2026-02-18':'正月初一','2026-02-19':'正月初二','2026-02-20':'正月初三',
  '2026-02-21':'正月初四','2026-02-22':'正月初五','2026-02-23':'正月初六','2026-02-24':'正月初七',
  '2026-02-25':'正月初八','2026-02-26':'正月初九','2026-02-27':'正月初十','2026-02-28':'正月十一',
  '2026-03-01':'正月十二','2026-03-02':'正月十三','2026-03-03':'正月十四','2026-03-04':'正月十五',
  '2026-03-05':'正月十六','2026-03-06':'正月十七','2026-03-07':'正月十八','2026-03-08':'正月十九',
  '2026-03-09':'正月二十','2026-03-10':'正月廿一','2026-03-11':'正月廿二','2026-03-12':'正月廿三',
  '2026-03-13':'正月廿四','2026-03-14':'正月廿五','2026-03-15':'正月廿六','2026-03-16':'正月廿七',
  '2026-03-17':'正月廿八','2026-03-18':'正月廿九','2026-03-19':'二月初一','2026-03-20':'二月初二',
  '2026-03-21':'二月初三','2026-03-22':'二月初四','2026-03-23':'二月初五','2026-03-24':'二月初六',
  '2026-03-25':'二月初七','2026-03-26':'二月初八','2026-03-27':'二月初九','2026-03-28':'二月初十',
  '2026-03-29':'二月十一','2026-03-30':'二月十二','2026-03-31':'二月十三',
  '2026-04-01':'二月十四','2026-04-02':'二月十五','2026-04-03':'二月十六','2026-04-04':'二月十七',
  '2026-04-05':'二月十八','2026-04-06':'二月十九','2026-04-07':'二月二十','2026-04-08':'二月廿一',
  '2026-04-09':'二月廿二','2026-04-10':'二月廿三','2026-04-11':'二月廿四','2026-04-12':'二月廿五',
  '2026-04-13':'二月廿六','2026-04-14':'二月廿七','2026-04-15':'二月廿八','2026-04-16':'二月廿九',
  '2026-04-17':'二月三十','2026-04-18':'三月初一','2026-04-19':'三月初二','2026-04-20':'三月初三',
  '2026-04-21':'三月初四','2026-04-22':'三月初五','2026-04-23':'三月初六','2026-04-24':'三月初七',
  '2026-04-25':'三月初八','2026-04-26':'三月初九','2026-04-27':'三月初十','2026-04-28':'三月十一',
  '2026-04-29':'三月十二','2026-04-30':'三月十三',
  '2026-05-01':'三月十四','2026-05-02':'三月十五','2026-05-03':'三月十六','2026-05-04':'三月十七',
  '2026-05-05':'三月十八','2026-05-06':'三月十九','2026-05-07':'三月二十','2026-05-08':'三月廿一',
  '2026-05-09':'三月廿二','2026-05-10':'三月廿三','2026-05-11':'三月廿四','2026-05-12':'三月廿五',
  '2026-05-13':'三月廿六','2026-05-14':'三月廿七','2026-05-15':'三月廿八','2026-05-16':'三月廿九',
  '2026-05-17':'三月三十','2026-05-18':'四月初一','2026-05-19':'四月初二','2026-05-20':'四月初三',
  '2026-05-21':'四月初四','2026-05-22':'四月初五','2026-05-23':'四月初六','2026-05-24':'四月初七',
  '2026-05-25':'四月初八','2026-05-26':'四月初九','2026-05-27':'四月初十','2026-05-28':'四月十一',
  '2026-05-29':'四月十二','2026-05-30':'四月十三','2026-05-31':'四月十四',
  '2026-06-01':'四月十五','2026-06-02':'四月十六','2026-06-03':'四月十七','2026-06-04':'四月十八',
  '2026-06-05':'四月十九','2026-06-06':'四月二十','2026-06-07':'四月廿一','2026-06-08':'四月廿二',
  '2026-06-09':'四月廿三','2026-06-10':'四月廿四','2026-06-11':'四月廿五','2026-06-12':'四月廿六',
  '2026-06-13':'四月廿七','2026-06-14':'四月廿八','2026-06-15':'四月廿九','2026-06-16':'四月三十',
  '2026-06-17':'五月初一','2026-06-18':'五月初二','2026-06-19':'五月初三','2026-06-20':'五月初四',
  '2026-06-21':'五月初五','2026-06-22':'五月初六','2026-06-23':'五月初七','2026-06-24':'五月初八',
  '2026-06-25':'五月初九','2026-06-26':'五月初十','2026-06-27':'五月十一','2026-06-28':'五月十二',
  '2026-06-29':'五月十三','2026-06-30':'五月十四',
};

function getLunarDate(dateStr) {
  return lunarTable2026[dateStr] || '';
}

// 穿搭建议
function getOutfitSuggestion(tempMin, tempMax, weatherDesc) {
  const avg = (parseInt(tempMin) + parseInt(tempMax)) / 2;
  let outfit = '';
  if (avg >= 30) outfit = '轻薄短袖、短裤，注意防晒';
  else if (avg >= 25) outfit = '短袖、薄长裤，可备薄外套';
  else if (avg >= 20) outfit = '长袖衬衫、薄外套或卫衣';
  else if (avg >= 15) outfit = '卫衣或针织衫，外搭薄风衣';
  else if (avg >= 10) outfit = '厚外套、毛衣，注意保暖';
  else if (avg >= 5) outfit = '羽绒服或棉服，围巾手套';
  else outfit = '厚羽绒服，帽子手套围巾全副武装';

  if (weatherDesc.toLowerCase().includes('rain') || weatherDesc.toLowerCase().includes('drizzle')) {
    outfit += '\n☔ 记得带伞！';
  }
  return outfit;
}

// 出行建议
function getTravelAdvice(weatherDesc, windSpeed, humidity) {
  const tips = [];
  const desc = weatherDesc.toLowerCase();
  if (desc.includes('rain') || desc.includes('drizzle')) {
    tips.push('路面湿滑，注意行车安全');
    tips.push('建议携带雨具');
  }
  if (parseInt(windSpeed) > 30) {
    tips.push('风力较大，注意防风');
  }
  if (parseInt(humidity) > 90 && desc.includes('fog')) {
    tips.push('能见度较低，出行注意安全');
  }
  if (desc.includes('snow')) {
    tips.push('道路可能结冰，小心慢行');
  }
  if (tips.length === 0) {
    tips.push('适宜出行，祝心情愉快 ☺️');
  }
  return tips.join('\n');
}

// HTTP 请求封装
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { timeout: 15000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse error: ' + e.message)); }
      });
    }).on('error', reject)
      .on('timeout', function() { this.destroy(); reject(new Error('timeout')); });
  });
}

function postJSON(url, body, headers) {
  headers = headers || {};
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const mod = u.protocol === 'https:' ? https : http;
    const opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
      timeout: 15000,
    };
    const req = mod.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse error: ' + e.message + ', raw: ' + data.slice(0, 200))); }
      });
    });
    req.on('error', reject);
    req.on('timeout', function() { req.destroy(); reject(new Error('timeout')); });
    req.write(JSON.stringify(body));
    req.end();
  });
}

// 获取飞书 tenant_access_token
async function getFeishuToken() {
  if (!APP_SECRET) throw new Error('FEISHU_APP_SECRET 未设置');
  const res = await postJSON('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    app_id: APP_ID,
    app_secret: APP_SECRET,
  });
  if (res.code !== 0) throw new Error('获取 token 失败: ' + res.msg);
  return res.tenant_access_token;
}

// 发送飞书卡片消息
async function sendCard(token, card) {
  const res = await postJSON(
    'https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id',
    {
      receive_id: USER_ID,
      msg_type: 'interactive',
      content: JSON.stringify(card),
    },
    { 'Authorization': 'Bearer ' + token }
  );
  if (res.code !== 0) throw new Error('发送消息失败: code=' + res.code + ', msg=' + res.msg);
  return res;
}

// === 主流程 ===
async function main() {
  console.log('[weather-card] 开始获取天气数据...');
  
  // 1. 获取天气
  const weather = await fetchJSON('https://wttr.in/' + LAT + ',' + LON + '?format=j1');
  const current = weather.current_condition[0];
  const today = weather.weather[0];
  const astro = today.astronomy[0];

  // 2. 组装数据
  const now = new Date();
  const shanghaiNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
  const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  const days = ['周日','周一','周二','周三','周四','周五','周六'];
  const dateStr = months[shanghaiNow.getMonth()] + shanghaiNow.getDate() + '日';
  const dayStr = days[shanghaiNow.getDay()];
  const yyyy = shanghaiNow.getFullYear();
  const mm = String(shanghaiNow.getMonth() + 1).padStart(2, '0');
  const dd = String(shanghaiNow.getDate()).padStart(2, '0');
  const isoDate = yyyy + '-' + mm + '-' + dd;
  const lunarStr = getLunarDate(isoDate);
  const timeStr = String(shanghaiNow.getHours()).padStart(2, '0') + ':' + String(shanghaiNow.getMinutes()).padStart(2, '0');
  
  const weatherDesc = mapWeather(current.weatherDesc[0].value);
  const temp = current.temp_C;
  const feelsLike = current.FeelsLikeC;
  const humidity = current.humidity;
  const windSpeed = current.windspeedKmph;
  const windDir = current.winddir16Point;
  const tempMin = today.mintempC;
  const tempMax = today.maxtempC;
  const sunrise = astro.sunrise;
  const sunset = astro.sunset;
  
  // 今日趋势 (取 6/9/12/15/18/21 点)
  const hourly = today.hourly;
  const trendParts = [];
  for (var i = 0; i < hourly.length; i++) {
    var h = hourly[i];
    var hour = parseInt(h.time) / 100;
    if (hour === 6 || hour === 9 || hour === 12 || hour === 15 || hour === 18 || hour === 21) {
      var wdesc = mapWeather(h.weatherDesc[0].value).replace(/[^\u4e00-\u9fa5a-zA-Z0-9°%]/g, '');
      trendParts.push(String(Math.round(hour)).padStart(2, '0') + ':00 ' + h.tempC + '°C ' + wdesc);
    }
  }
  var trend = trendParts.join(' → ');
  
  // 降雨概率
  var rainChance = 0;
  for (var i = 0; i < hourly.length; i++) {
    var rc = parseInt(hourly[i].chanceofrain || '0');
    if (rc > rainChance) rainChance = rc;
  }
  
  var outfit = getOutfitSuggestion(tempMin, tempMax, current.weatherDesc[0].value);
  var travel = getTravelAdvice(current.weatherDesc[0].value, windSpeed, humidity);

  // 3. 构建卡片
  var card = {
    config: { wide_screen_mode: true },
    header: {
      template: 'blue',
      title: { tag: 'plain_text', content: '🌤️ 宜昌夷陵区 · 天气早报' },
    },
    elements: [
      {
        tag: 'div',
        text: { tag: 'lark_md', content: '**📅 ' + dateStr + ' ' + dayStr + '**' + (lunarStr ? ' | ' + lunarStr : '') + '\n🕐 推送时间：' + timeStr },
      },
      { tag: 'hr' },
      {
        tag: 'div',
        text: { tag: 'lark_md', content: '**📍 宜昌夷陵区** · ' + weatherDesc },
      },
      {
        tag: 'div',
        fields: [
          { is_short: true, text: { tag: 'lark_md', content: '🌡️ **' + temp + '°C** (体感 ' + feelsLike + '°C)' } },
          { is_short: true, text: { tag: 'lark_md', content: '💨 ' + windSpeed + 'km/h ' + windDir + '风' } },
        ],
      },
      {
        tag: 'div',
        fields: [
          { is_short: true, text: { tag: 'lark_md', content: '💧 湿度 ' + humidity + '%' } },
          { is_short: true, text: { tag: 'lark_md', content: '🌅 ' + sunrise + ' | 🌇 ' + sunset } },
        ],
      },
      { tag: 'hr' },
      {
        tag: 'div',
        text: { tag: 'lark_md', content: '**📊 今日气温**\n🌡️ ' + tempMin + '°C ~ ' + tempMax + '°C · 降雨概率 ' + rainChance + '%' },
      },
      {
        tag: 'div',
        text: { tag: 'lark_md', content: '**📈 逐时趋势**\n' + trend },
      },
      { tag: 'hr' },
      {
        tag: 'div',
        text: { tag: 'lark_md', content: '**👕 穿搭建议**\n' + outfit },
      },
      {
        tag: 'div',
        text: { tag: 'lark_md', content: '**🚶 出行建议**\n' + travel },
      },
      { tag: 'hr' },
      {
        tag: 'note',
        elements: [
          { tag: 'plain_text', content: 'Notify Bot · ' + dateStr + ' ' + timeStr + ' · 数据来源: wttr.in' },
        ],
      },
    ],
  };

  // 4. 发送
  console.log('[weather-card] 获取飞书 token...');
  var token = await getFeishuToken();
  console.log('[weather-card] 发送卡片消息...');
  var result = await sendCard(token, card);
  console.log('[weather-card] ✅ 推送成功!');
}

main().catch(function(err) {
  console.error('[weather-card] ❌ 推送失败:', err.message);
  process.exit(1);
});
