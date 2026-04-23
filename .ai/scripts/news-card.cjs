#!/usr/bin/env node
/**
 * 科技资讯卡片推送脚本
 * 获取 RSS 资讯并发送飞书交互式卡片
 * 支持去重：已发送过的资讯不会重复发送
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  appId: 'cli_a91476e0a5f8dbc0',
  appSecret: 'CRV8phtp1hTE7sz5tpwlCfGXnaIEvWCV',
  chatId: 'oc_ffc3e3276fcf68d1759933ec0e494ae8',
  rssFeeds: [
    { name: '虎嗅', url: 'https://www.huxiu.com/rss/' },
    { name: '36氪', url: 'https://36kr.com/feed' }
  ],
  keywords: ['AI', '英伟达', '芯片', '半导体', '大模型', 'DeepSeek', 'OpenAI', '特斯拉', '苹果', '微软', '谷歌', 'Anthropic', '月之暗面', 'MiniMax', '存储', '新能源'],
  // 去重配置
  sentNewsFile: '/root/.openclaw/workspace/scripts/sent-news.json',
  maxSentRecords: 1000,  // 最多保留1000条记录
  expireDays: 7          // 记录过期天数
};

// ==================== 去重功能 ====================

// 生成资讯的唯一ID（用标题+链接的hash）
function generateNewsId(item) {
  const crypto = require('crypto');
  const content = `${item.title}|${item.link}`;
  return crypto.createHash('md5').update(content).digest('hex').substring(0, 16);
}

// 加载已发送的资讯记录
function loadSentNews() {
  try {
    if (fs.existsSync(CONFIG.sentNewsFile)) {
      const data = fs.readFileSync(CONFIG.sentNewsFile, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.log('⚠️ 加载已发送记录失败，将创建新文件');
  }
  return { records: {}, lastClean: Date.now() };
}

// 保存已发送的资讯记录
function saveSentNews(sentNews) {
  try {
    const dir = path.dirname(CONFIG.sentNewsFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CONFIG.sentNewsFile, JSON.stringify(sentNews, null, 2));
  } catch (e) {
    console.error('⚠️ 保存已发送记录失败:', e.message);
  }
}

// 清理过期记录
function cleanExpiredRecords(sentNews) {
  const now = Date.now();
  const expireMs = CONFIG.expireDays * 24 * 60 * 60 * 1000;
  
  // 每天清理一次
  if (now - sentNews.lastClean < 24 * 60 * 60 * 1000) {
    return sentNews;
  }
  
  const ids = Object.keys(sentNews.records);
  let cleaned = 0;
  
  ids.forEach(id => {
    if (now - sentNews.records[id].time > expireMs) {
      delete sentNews.records[id];
      cleaned++;
    }
  });
  
  // 如果记录数超过限制，删除最旧的
  if (Object.keys(sentNews.records).length > CONFIG.maxSentRecords) {
    const sortedIds = Object.entries(sentNews.records)
      .sort((a, b) => a[1].time - b[1].time)
      .map(entry => entry[0]);
    
    const toDelete = sortedIds.slice(0, sortedIds.length - CONFIG.maxSentRecords);
    toDelete.forEach(id => {
      delete sentNews.records[id];
      cleaned++;
    });
  }
  
  sentNews.lastClean = now;
  console.log(`🧹 清理了 ${cleaned} 条过期记录`);
  return sentNews;
}

// 检查资讯是否已发送
function isNewsSent(sentNews, newsId) {
  return sentNews.records.hasOwnProperty(newsId);
}

// 标记资讯为已发送
function markNewsAsSent(sentNews, newsId, title) {
  sentNews.records[newsId] = {
    time: Date.now(),
    title: title.substring(0, 50)  // 只保留前50个字符
  };
}

// 过滤掉已发送的资讯
function filterSentNews(items, sentNews) {
  const newItems = [];
  let duplicateCount = 0;
  
  items.forEach(item => {
    const newsId = generateNewsId(item);
    if (isNewsSent(sentNews, newsId)) {
      duplicateCount++;
    } else {
      newItems.push({ ...item, _id: newsId });
    }
  });
  
  if (duplicateCount > 0) {
    console.log(`🔄 过滤掉 ${duplicateCount} 条已发送的资讯`);
  }
  
  return newItems;
}

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

// 获取 RSS 内容（简化版，直接用 HTTP 获取）
async function fetchRSS(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

// 解析 RSS XML（简化版）
function parseRSS(xml, feedName) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    
    // 标题：支持 CDATA 和普通格式
    const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/i) || itemXml.match(/<title>(.*?)<\/title>/i);
    
    // 链接：支持 CDATA 和普通格式
    const linkMatch = itemXml.match(/<link><!\[CDATA\[(.*?)\]\]><\/link>/i) || itemXml.match(/<link>(.*?)<\/link>/i);
    
    if (titleMatch && linkMatch) {
      let link = linkMatch[1].trim();
      // 移除可能的查询参数中的特殊字符
      link = link.split('"')[0].split("'")[0].trim();
      
      items.push({
        title: titleMatch[1].trim(),
        link: link,
        source: feedName
      });
    }
  }
  
  return items;
}

// 过滤关键词匹配的新闻
function filterByKeywords(items, keywords) {
  return items.filter(item => {
    const text = item.title.toLowerCase();
    return keywords.some(kw => text.includes(kw.toLowerCase()));
  });
}

// 分类新闻
function categorizeNews(items) {
  const categories = {
    '🔥 热点头条': [],
    '📈 市场动态': [],
    '🏢 公司动态': [],
    '💡 技术突破': []
  };
  
  // 简单分类逻辑
  items.forEach(item => {
    const title = item.title;
    if (title.includes('英伟达') || title.includes('NVIDIA') || title.includes('营收') || title.includes('融资')) {
      categories['🔥 热点头条'].push(item);
    } else if (title.includes('市场') || title.includes('涨价') || title.includes('下跌') || title.includes('增长')) {
      categories['📈 市场动态'].push(item);
    } else if (title.includes('公司') || title.includes('架构') || title.includes('CEO') || title.includes('合作')) {
      categories['🏢 公司动态'].push(item);
    } else if (title.includes('AI') || title.includes('模型') || title.includes('芯片') || title.includes('技术')) {
      categories['💡 技术突破'].push(item);
    } else {
      categories['🔥 热点头条'].push(item);
    }
  });
  
  // 每个分类最多5条
  Object.keys(categories).forEach(cat => {
    categories[cat] = categories[cat].slice(0, 5);
  });
  
  return categories;
}

// 构建卡片 JSON
function buildCard(categories, timeLabel) {
  const now = new Date();
  const dateStr = `${now.getMonth() + 1}月${now.getDate()}日`;
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekDay = weekDays[now.getDay()];
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  const elements = [
    {
      tag: 'div',
      text: { tag: 'lark_md', content: `📅 ${dateStr} ${weekDay}` }
    }
  ];
  
  // 添加每个分类 - 使用纯文本标题，不带链接
  Object.entries(categories).forEach(([catName, items]) => {
    if (items.length > 0) {
      // 分类标题
      elements.push({
        tag: 'div',
        text: { tag: 'lark_md', content: `**${catName}**` }
      });
      
      // 每条新闻一个可点击的 div
      items.forEach(item => {
        // 转义标题中的特殊字符
        const safeTitle = item.title.replace(/([[\]()])/g, '\\$1');
        // 确保 URL 以 https:// 开头
        let safeUrl = item.link;
        if (!safeUrl.startsWith('http://') && !safeUrl.startsWith('https://')) {
          safeUrl = 'https://' + safeUrl;
        }
        
        elements.push({
          tag: 'div',
          text: { tag: 'lark_md', content: `• [${safeTitle}](${safeUrl})` }
        });
      });
    }
  });
  
  // 添加底部
  elements.push({
    tag: 'note',
    elements: [
      { tag: 'plain_text', content: `Notify Bot · ${timeStr} | 点击标题查看详情` }
    ]
  });
  
  return {
    config: { wide_screen_mode: true },
    header: {
      template: 'blue',
      title: { tag: 'plain_text', content: `📰 科技资讯${timeLabel}` }
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
  const timeLabel = process.argv[2] || '早报';
  
  try {
    console.log(`📰 获取 ${timeLabel} 资讯...`);
    
    // 加载已发送记录
    let sentNews = loadSentNews();
    sentNews = cleanExpiredRecords(sentNews);
    
    // 获取所有 RSS 源
    let allItems = [];
    for (const feed of CONFIG.rssFeeds) {
      try {
        console.log(`  获取 ${feed.name}...`);
        const xml = await fetchRSS(feed.url);
        const items = parseRSS(xml, feed.name);
        console.log(`  ${feed.name}: ${items.length} 条`);
        allItems = allItems.concat(items);
      } catch (e) {
        console.log(`  ${feed.name} 获取失败: ${e.message}`);
      }
    }
    
    // 过滤关键词
    const filtered = filterByKeywords(allItems, CONFIG.keywords);
    console.log(`关键词匹配: ${filtered.length} 条`);
    
    // 过滤已发送的资讯
    const newItems = filterSentNews(filtered, sentNews);
    
    if (newItems.length === 0) {
      console.log('📭 没有新的资讯需要发送');
      return;
    }
    
    console.log(`📰 新资讯: ${newItems.length} 条`);
    
    // 分类
    const categories = categorizeNews(newItems);
    
    // 获取 token
    console.log('🎫 获取飞书 Token...');
    const token = await getAccessToken();
    
    // 构建卡片
    console.log('📦 构建卡片...');
    const card = buildCard(categories, timeLabel);
    
    // 发送
    console.log('📤 发送卡片...');
    const result = await sendCard(token, card);
    
    // 标记已发送
    newItems.forEach(item => {
      markNewsAsSent(sentNews, item._id, item.title);
    });
    saveSentNews(sentNews);
    
    console.log('✅ 发送成功:', result.message_id);
    console.log(`📊 统计: 发送 ${newItems.length} 条新资讯`);
  } catch (err) {
    console.error('❌ 发送失败:', err.message);
    process.exit(1);
  }
}

main();
