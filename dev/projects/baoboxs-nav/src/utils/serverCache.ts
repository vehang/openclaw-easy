/**
 * 服务端缓存管理工具
 * 用于管理 API 代理层的缓存
 */

// 缓存存储类型定义
interface CacheItem {
  data: any;
  time: number;
}

// 全局缓存存储
let serverCacheStore: Record<string, CacheItem> = {};

/**
 * 设置服务端缓存
 * @param key 缓存键
 * @param data 缓存数据
 */
export function setServerCache(key: string, data: any): void {
  serverCacheStore[key] = {
    data,
    time: Date.now()
  };
}

/**
 * 获取服务端缓存
 * @param key 缓存键
 * @param maxAge 最大有效期（毫秒）
 * @returns 缓存数据或null
 */
export function getServerCache(key: string, maxAge: number): any | null {
  const item = serverCacheStore[key];
  if (!item) return null;
  
  if (Date.now() - item.time > maxAge) {
    delete serverCacheStore[key];
    return null;
  }
  
  return item.data;
}

/**
 * 清理服务端缓存
 * @param pattern 清理模式，如果不提供则清理所有缓存
 */
export function clearServerCache(pattern?: string): void {
  if (!pattern) {
    // 清空所有缓存
    serverCacheStore = {};
    console.log('🧹 已清理所有服务端缓存');
  } else {
    // 按模式清理缓存
    Object.keys(serverCacheStore).forEach(key => {
      if (key.includes(pattern)) {
        delete serverCacheStore[key];
        console.log(`🧹 已清理服务端缓存: ${key}`);
      }
    });
  }
}

/**
 * 获取缓存存储的引用（用于现有代码兼容）
 */
export function getServerCacheStore(): Record<string, CacheItem> {
  return serverCacheStore;
}

/**
 * 检查缓存是否存在且未过期
 * @param key 缓存键
 * @param maxAge 最大有效期（毫秒）
 * @returns 是否有效
 */
export function hasValidCache(key: string, maxAge: number): boolean {
  const item = serverCacheStore[key];
  if (!item) return false;
  
  return Date.now() - item.time <= maxAge;
} 