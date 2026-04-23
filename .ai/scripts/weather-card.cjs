#!/usr/bin/env node
/**
 * 天气早报卡片推送脚本
 * 获取天气数据并发送飞书交互式卡片
 */

const https = require('https');

// 配置
const CONFIG = {
  appId: 'cli_a91476e0a5f8dbc0',
  appSecret: 'CRV8phtp1hTE7sz5tpwlCfGXnaIEvWCV',
  chatId: 'oc_ffc3e3276fcf68d1759933ec0e494ae8',
  location: 'Shanghai',  // 可改为其他城市
  lang: 'zh-CN'
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
        try {
          const json = JSON.parse(body);
          if (json.code === 0) resolve(json.tenant_access_token);
          else reject(new Error(json.msg));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// 获取天气数据（JSON格式）
async function fetchWeather() {
  return new Promise((resolve, reject) => {
    const url = `https://wttr.in/${encodeURIComponent(CONFIG.location)}?format=j1&lang=${CONFIG.lang}`;
    
    https.get(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// 天气代码转 emoji
function weatherCodeToEmoji(code) {
  const codeNum = parseInt(code);
  // WMO天气代码映射
  if (codeNum === 0) return '☀️';  // 晴
  if (codeNum <= 3) return '⛅';   // 多云
  if (codeNum <= 49) return '🌫️';  // 雾
  if (codeNum <= 59) return '🌧️';  // 小雨
  if (codeNum <= 69) return '🌧️';  // 雨
  if (codeNum <= 79) return '❄️';   // 雪
  if (codeNum <= 99) return '⛈️';   // 雷暴
  return '🌤️';
}

// 风向转中文
function windDirToChinese(dir) {
  const dirs = {
    'N': '北', 'NNE': '北东北', 'NE': '东北', 'ENE': '东东北',
    'E': '东', 'ESE': '东东南', 'SE': '东南', 'SSE': '南东南',
    'S': '南', 'SSW': '南西南', 'SW': '西南', 'WSW': '西西南',
    'W': '西', 'WNW': '西西北', 'NW': '西北', 'NNW': '北西北'
  };
  return dirs[dir] || dir;
}

// 构建卡片 JSON
function buildCard(weatherData) {
  const now = new Date();
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekDay = weekDays[now.getDay()];
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  // 当前天气
  const current = weatherData.current_condition[0];
  const currentTemp = current.temp_C;
  const feelsLike = current.FeelsLikeC;
  const humidity = current.humidity;
  const windSpeed = current.windspeedKmph;
  const windDir = windDirToChinese(current.winddir16Point);
  const weatherDesc = current.weatherDesc[0].value;
  const weatherEmoji = weatherCodeToEmoji(current.weatherCode);
  
  // 今日预报
  const today = weatherData.weather[0];
  const maxTemp = today.maxtempC;
  const minTemp = today.mintempC;
  const sunrise = today.astronomy[0].sunrise;
  const sunset = today.astronomy[0].sunset;
  
  // 空气质量（如果有）
  let aqiInfo = '';
  if (current.air_quality) {
    const pm25 = parseFloat(current.air_quality.pm2_5);
    let aqiLevel = '良好';
    let aqiEmoji = '🟢';
    if (pm25 > 75) { aqiLevel = '轻度污染'; aqiEmoji = '🟡'; }
    if (pm25 > 115) { aqiLevel = '中度污染'; aqiEmoji = '🟠'; }
    if (pm25 > 150) { aqiLevel = '重度污染'; aqiEmoji = '🔴'; }
    aqiInfo = `${aqiEmoji} **空气质量**: ${aqiLevel} (PM2.5: ${pm25.toFixed(0)})`;
  }
  
  // 未来两天预报
  const tomorrow = weatherData.weather[1];
  const dayAfter = weatherData.weather[2];
  
  const tomorrowEmoji = weatherCodeToEmoji(tomorrow.hourly[4].weatherCode);
  const dayAfterEmoji = weatherCodeToEmoji(dayAfter.hourly[4].weatherCode);
  
  // 生活建议
  const suggestions = [];
  const temp = parseInt(currentTemp);
  if (temp <= 5) suggestions.push('🥶 天气寒冷，注意保暖');
  else if (temp <= 15) suggestions.push('🧥 天气较凉，建议穿外套');
  else if (temp <= 25) suggestions.push('👕 天气温和，穿着舒适');
  else suggestions.push('🥵 天气炎热，注意防暑');
  
  if (parseInt(humidity) >= 80) suggestions.push('💧 湿度较高，体感闷热');
  if (parseInt(windSpeed) >= 30) suggestions.push('💨 风力较大，外出注意');
  
  // 降水概率
  const hourlyData = today.hourly;
  let maxRainChance = 0;
  hourlyData.forEach(h => {
    const chance = parseInt(h.chanceofrain);
    if (chance > maxRainChance) maxRainChance = chance;
  });
  if (maxRainChance >= 50) {
    suggestions.push(`☔ 今日降水概率 ${maxRainChance}%，建议带伞`);
  }
  
  const elements = [
    {
      tag: 'div',
      text: { tag: 'lark_md', content: `📅 ${dateStr} ${weekDay}` }
    },
    {
      tag: 'div',
      text: { tag: 'lark_md', content: `---` }
    },
    // 当前天气
    {
      tag: 'div',
      text: { tag: 'lark_md', content: `${weatherEmoji} **当前天气**: ${weatherDesc}` }
    },
    {
      tag: 'div',
      text: { tag: 'lark_md', content: `🌡️ **温度**: ${currentTemp}°C (体感 ${feelsLike}°C)` }
    },
    {
      tag: 'div',
      text: { tag: 'lark_md', content: `📊 **今日**: ${minTemp}°C ~ ${maxTemp}°C` }
    },
    {
      tag: 'div',
      text: { tag: 'lark_md', content: `💧 **湿度**: ${humidity}%  |  🌬️ **风力**: ${windDir}风 ${windSpeed}km/h` }
    },
    {
      tag: 'div',
      text: { tag: 'lark_md', content: `🌅 **日出**: ${sunrise}  |  🌇 **日落**: ${sunset}` }
    }
  ];
  
  // 添加空气质量
  if (aqiInfo) {
    elements.push({
      tag: 'div',
      text: { tag: 'lark_md', content: aqiInfo }
    });
  }
  
  // 未来预报
  elements.push({
    tag: 'div',
    text: { tag: 'lark_md', content: `---` }
  });
  elements.push({
    tag: 'div',
    text: { tag: 'lark_md', content: `📆 **未来预报**` }
  });
  elements.push({
    tag: 'div',
    text: { tag: 'lark_md', content: `${tomorrowEmoji} **明天**: ${tomorrow.mintempC}°C ~ ${tomorrow.maxtempC}°C` }
  });
  elements.push({
    tag: 'div',
    text: { tag: 'lark_md', content: `${dayAfterEmoji} **后天**: ${dayAfter.mintempC}°C ~ ${dayAfter.maxtempC}°C` }
  });
  
  // 生活建议
  if (suggestions.length > 0) {
    elements.push({
      tag: 'div',
      text: { tag: 'lark_md', content: `---` }
    });
    elements.push({
      tag: 'div',
      text: { tag: 'lark_md', content: `💡 **生活建议**` }
    });
    suggestions.forEach(s => {
      elements.push({
        tag: 'div',
        text: { tag: 'lark_md', content: s }
      });
    });
  }
  
  // 底部
  elements.push({
    tag: 'note',
    elements: [
      { tag: 'plain_text', content: `Weather Bot · ${timeStr} | 数据来源: wttr.in` }
    ]
  });
  
  return {
    config: { wide_screen_mode: true },
    header: {
      template: 'turquoise',
      title: { tag: 'plain_text', content: `🌤️ ${CONFIG.location} 天气早报` }
    },
    elements: elements
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
      path: '/open-apis/im/v1/messages?receive_id_type=chat_id',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.code === 0) resolve(json.data);
          else reject(new Error(json.msg));
        } catch (e) {
          reject(e);
        }
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
    console.log(`🌤️ 获取 ${CONFIG.location} 天气数据...`);
    
    // 获取天气数据
    const weatherData = await fetchWeather();
    console.log(`✅ 天气数据获取成功`);
    
    // 获取 token
    console.log('🎫 获取飞书 Token...');
    const token = await getAccessToken();
    
    // 构建卡片
    console.log('📦 构建天气卡片...');
    const card = buildCard(weatherData);
    
    // 发送
    console.log('📤 发送卡片到飞书...');
    const result = await sendCard(token, card);
    
    console.log('✅ 天气卡片发送成功:', result.message_id);
    
    // 输出天气摘要
    const current = weatherData.current_condition[0];
    const today = weatherData.weather[0];
    console.log(`📊 天气摘要: ${current.temp_C}°C, ${current.weatherDesc[0].value}, ${today.mintempC}°C ~ ${today.maxtempC}°C`);
  } catch (err) {
    console.error('❌ 发送失败:', err.message);
    process.exit(1);
  }
}

main();
