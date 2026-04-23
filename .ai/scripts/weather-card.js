#!/usr/bin/env node
/**
 * 天气早报卡片推送脚本
 * 使用飞书交互式卡片发送天气信息
 */

const https = require('https');
const crypto = require('crypto');

// 配置
const CONFIG = {
  appId: 'cli_a91476e0a5f8dbc0',
  appSecret: 'CRV8phtp1hTE7sz5tpwlCfGXnaIEvWCV',
  chatId: 'ou_7172afb8fa3c2f51bb02b6af097a4b27',
  location: '宜昌',
  coords: { lat: 30.77, lon: 111.33 }
};

// 获取飞书 access_token
async function getAccessToken() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      app_id: CONFIG.appId,
      app_secret: CONFIG.appSecret
    });
    
    const req = https.request({
      hostname: 'open.feishu.cn',
      path: '/open-apis/auth/v3/tenant_access_token/internal',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const json = JSON.parse(body);
        if (json.code === 0) resolve(json.tenant_access_token);
        else reject(new Error(json.msg));
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// 获取天气数据 (Open-Meteo)
async function getWeatherData() {
  return new Promise((resolve, reject) => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${CONFIG.coords.lat}&longitude=${CONFIG.coords.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=Asia/Shanghai&forecast_days=1`;
    
    https.get(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    }).on('error', reject);
  });
}

// WMO 天气代码转中文描述
function weatherCodeToDesc(code) {
  const map = {
    0: '晴朗', 1: '大部晴朗', 2: '多云', 3: '阴天',
    45: '雾', 48: '霜雾',
    51: '小毛毛雨', 53: '毛毛雨', 55: '大毛毛雨',
    61: '小雨', 63: '中雨', 65: '大雨',
    71: '小雪', 73: '中雪', 75: '大雪',
    80: '小阵雨', 81: '阵雨', 82: '大阵雨',
    95: '雷暴', 96: '雷暴伴小冰雹', 99: '雷暴伴大冰雹'
  };
  return map[code] || '未知';
}

// 获取农历 (简化版 - 仅显示月日)
function getLunarDate(date) {
  const lunar = require('./lunar.cjs');
  return lunar.getLunarDate(date);
}

// 根据天气生成建议
function getSuggestions(temp, weatherCode, humidity) {
  let clothing = '';
  let travel = '';
  
  // 穿搭建议
  if (temp <= 5) clothing = '厚羽绒服、保暖内衣、围巾手套';
  else if (temp <= 10) clothing = '厚外套、毛衣或卫衣';
  else if (temp <= 15) clothing = '薄外套或卫衣';
  else if (temp <= 20) clothing = '长袖衬衫或薄外套';
  else if (temp <= 25) clothing = '短袖、薄长裤';
  else clothing = '短袖、短裤、防晒';
  
  // 出行建议
  if ([61, 63, 65, 80, 81, 82].includes(weatherCode)) {
    travel = '☔ 带伞出行，注意路滑';
  } else if ([71, 73, 75].includes(weatherCode)) {
    travel = '❄️ 注意保暖，路面可能结冰';
  } else if ([95, 96, 99].includes(weatherCode)) {
    travel = '⛈️ 雷雨天气，尽量避免外出';
  } else if (humidity >= 90) {
    travel = '💧 湿度较高，注意防潮';
  } else {
    travel = '✅ 天气良好，适合出行';
  }
  
  return { clothing, travel };
}

// 构建卡片 JSON
function buildCard(data) {
  const now = new Date();
  const current = data.current;
  const daily = data.daily;
  
  const temp = Math.round(current.temperature_2m);
  const humidity = current.relative_humidity_2m;
  const windSpeed = current.wind_speed_10m;
  const weatherCode = current.weather_code;
  const weatherDesc = weatherCodeToDesc(weatherCode);
  const tempMin = Math.round(daily.temperature_2m_min[0]);
  const tempMax = Math.round(daily.temperature_2m_max[0]);
  
  const sunrise = daily.sunrise[0].split('T')[1].slice(0, 5);
  const sunset = daily.sunset[0].split('T')[1].slice(0, 5);
  
  const suggestions = getSuggestions(temp, weatherCode, humidity);
  
  // 简化农历
  const lunarMonths = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'];
  const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十', 
                     '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
                     '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];
  // 简化计算 (不准确，仅作展示)
  const lunarMonth = lunarMonths[now.getMonth()];
  const lunarDay = lunarDays[(now.getDate() - 1) % 30];
  
  const dateStr = `${now.getMonth() + 1}月${now.getDate()}日`;
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekDay = weekDays[now.getDay()];
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  // 天气趋势
  const trendCode = daily.weather_code[0];
  const trend = weatherCodeToDesc(trendCode);
  
  return {
    config: { wide_screen_mode: true },
    header: {
      template: 'blue',
      title: { tag: 'plain_text', content: '🌤️ 天气早报' }
    },
    elements: [
      {
        tag: 'div',
        text: { tag: 'lark_md', content: `**📅 ${dateStr} ${weekDay} | ${lunarMonth}${lunarDay}**\n🕐 当前时间：${timeStr}` }
      },
      { tag: 'hr' },
      {
        tag: 'div',
        text: { tag: 'lark_md', content: `**📍 ${CONFIG.location}** · ${weatherDesc}` }
      },
      {
        tag: 'div',
        fields: [
          { is_short: true, text: { tag: 'lark_md', content: `🌡️ **${temp}°C**` } },
          { is_short: true, text: { tag: 'lark_md', content: `💨 ${windSpeed}km/h` } }
        ]
      },
      {
        tag: 'div',
        fields: [
          { is_short: true, text: { tag: 'lark_md', content: `💧 ${humidity}%` } },
          { is_short: true, text: { tag: 'lark_md', content: `🌅 ${sunrise} | 🌇 ${sunset}` } }
        ]
      },
      { tag: 'hr' },
      {
        tag: 'div',
        text: { tag: 'lark_md', content: `**📊 今日气温**\n🌡️ ${tempMin}°C ~ ${tempMax}°C · ${trend}` }
      },
      { tag: 'hr' },
      {
        tag: 'div',
        text: { tag: 'lark_md', content: `**👕 穿搭建议**\n${suggestions.clothing}` }
      },
      {
        tag: 'div',
        text: { tag: 'lark_md', content: `**🚶 出行建议**\n${suggestions.travel}` }
      },
      { tag: 'hr' },
      {
        tag: 'note',
        elements: [
          { tag: 'plain_text', content: `Notify Bot · ${timeStr}` }
        ]
      }
    ]
  };
}

// 发送卡片消息
async function sendCard(token, card) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      receive_id: CONFIG.chatId,
      msg_type: 'interactive',
      content: JSON.stringify(card)
    });
    
    const req = https.request({
      hostname: 'open.feishu.cn',
      path: '/open-apis/im/v1/messages?receive_id_type=open_id',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const json = JSON.parse(body);
        if (json.code === 0) resolve(json.data);
        else reject(new Error(json.msg));
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// 主函数
async function main() {
  try {
    console.log('🌤️ 获取天气数据...');
    const weather = await getWeatherData();
    
    console.log('🎫 获取飞书 Token...');
    const token = await getAccessToken();
    
    console.log('📦 构建卡片...');
    const card = buildCard(weather);
    
    console.log('📤 发送卡片...');
    const result = await sendCard(token, card);
    
    console.log('✅ 发送成功:', result.message_id);
  } catch (err) {
    console.error('❌ 发送失败:', err.message);
    process.exit(1);
  }
}

main();
