import { NextRequest, NextResponse } from 'next/server';

// 缓存配置
const CACHE_TIME = 20 * 60 * 1000; // 20分钟
const cache = new Map<string, { data: any; timestamp: number }>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    
    // 生成缓存key
    const cacheKey = `weather_${city || 'auto'}`;
    
    // 检查缓存
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TIME) {
      console.log('使用服务端缓存的天气数据');
      return NextResponse.json(cached.data);
    }
    
    // 构建请求URL
    const apiUrl = city 
      ? `https://www.apii.cn/api/weather/?city=${encodeURIComponent(city)}`
      : 'https://www.apii.cn/api/weather/';
    
    console.log('调用 Apii.cn API:', apiUrl);
    
    // 请求天气数据
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      // 设置超时
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // 验证响应数据
    if (data.code !== '1') {
      throw new Error(`API业务错误: code=${data.code}`);
    }
    
    // 保存到缓存
    cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    // 清理过期缓存
    cleanupCache();
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('天气API代理失败:', error);
    
    return NextResponse.json(
      { 
        error: '获取天气信息失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

// 清理过期缓存
function cleanupCache() {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TIME) {
      cache.delete(key);
    }
  }
}