import { NextRequest, NextResponse } from 'next/server';

export interface ApiOptimizationOptions {
  cacheMaxAge?: number;
  enableCompression?: boolean;
  enableETag?: boolean;
  enableCORS?: boolean;
}

/**
 * API响应优化中间件
 * 提供压缩、缓存控制、错误处理等功能
 */
export function withApiOptimization(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: ApiOptimizationOptions = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const {
      cacheMaxAge = 300, // 默认5分钟缓存
      enableCompression = true,
      enableETag = true,
      enableCORS = true,
    } = options;

    try {
      // 执行原始处理器
      const startTime = Date.now();
      const response = await handler(req);
      const duration = Date.now() - startTime;

      // 如果响应不是成功状态，直接返回
      if (!response.ok) {
        return response;
      }

      // 克隆响应以便修改头部
      const modifiedResponse = new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });

      // 添加缓存控制头
      if (cacheMaxAge > 0) {
        modifiedResponse.headers.set(
          'Cache-Control',
          `public, max-age=${cacheMaxAge}, s-maxage=${cacheMaxAge}`
        );
      }

      // 添加CORS头（如果启用）
      if (enableCORS) {
        modifiedResponse.headers.set('Access-Control-Allow-Origin', '*');
        modifiedResponse.headers.set(
          'Access-Control-Allow-Methods',
          'GET, POST, PUT, DELETE, OPTIONS'
        );
        modifiedResponse.headers.set(
          'Access-Control-Allow-Headers',
          'Content-Type, Authorization, X-Device-Id'
        );
      }

      // 添加压缩头（如果启用）
      if (enableCompression) {
        const acceptEncoding = req.headers.get('accept-encoding') || '';
        if (acceptEncoding.includes('gzip')) {
          modifiedResponse.headers.set('Content-Encoding', 'gzip');
        } else if (acceptEncoding.includes('br')) {
          modifiedResponse.headers.set('Content-Encoding', 'br');
        }
      }

      // 添加ETag（如果启用且响应有内容）
      if (enableETag && response.body) {
        try {
          const bodyText = await response.clone().text();
          const etag = generateETag(bodyText);
          modifiedResponse.headers.set('ETag', etag);

          // 检查If-None-Match头
          const ifNoneMatch = req.headers.get('if-none-match');
          if (ifNoneMatch === etag) {
            return new NextResponse(null, { status: 304 });
          }
        } catch (error) {
          console.warn('ETag生成失败:', error);
        }
      }

      // 添加性能头
      modifiedResponse.headers.set('X-Response-Time', `${duration}ms`);
      modifiedResponse.headers.set('X-Timestamp', new Date().toISOString());

      // 添加安全头
      modifiedResponse.headers.set('X-Content-Type-Options', 'nosniff');
      modifiedResponse.headers.set('X-Frame-Options', 'DENY');

      return modifiedResponse;
    } catch (error) {
      console.error('API优化中间件错误:', error);
      
      // 返回错误响应
      return NextResponse.json(
        {
          code: 500,
          errorMsg: '服务器内部错误',
          currentTime: Date.now(),
          data: null,
        },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          }
        }
      );
    }
  };
}

/**
 * 生成简单的ETag
 */
function generateETag(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return `"${Math.abs(hash).toString(16)}"`;
}

/**
 * API错误包装器
 * 统一处理API错误并返回标准格式
 */
export function withErrorHandling<T>(
  asyncFn: () => Promise<T>
): Promise<{ success: boolean; data?: T; error?: string }> {
  return asyncFn()
    .then(data => ({ success: true, data }))
    .catch(error => ({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }));
}

/**
 * 请求去重装饰器
 * 防止短时间内的重复请求
 */
const requestCache = new Map<string, { timestamp: number; promise: Promise<any> }>();
const DEDUP_WINDOW = 1000; // 1秒去重窗口

export function withRequestDeduplication<T>(
  fn: (...args: any[]) => Promise<T>,
  getKey: (...args: any[]) => string
) {
  return async (...args: any[]): Promise<T> => {
    const key = getKey(...args);
    const now = Date.now();
    
    // 检查是否有最近的请求
    const cached = requestCache.get(key);
    if (cached && (now - cached.timestamp) < DEDUP_WINDOW) {
      console.log(`请求去重: ${key}`);
      return cached.promise;
    }
    
    // 创建新请求
    const promise = fn(...args);
    requestCache.set(key, { timestamp: now, promise });
    
    // 请求完成后清理缓存
    promise.finally(() => {
      const entry = requestCache.get(key);
      if (entry && entry.timestamp === now) {
        requestCache.delete(key);
      }
    });
    
    return promise;
  };
} 