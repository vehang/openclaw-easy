// 内存缓存管理工具
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expires?: number;
}

class CacheManager {
  private cache = new Map<string, CacheItem<any>>();
  private maxSize = 100; // 最大缓存条目数
  
  // 设置缓存
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void { // 默认5分钟
    // 如果缓存已满，删除最老的条目
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expires: Date.now() + ttl,
    });
  }
  
  // 获取缓存
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    // 检查是否过期
    if (item.expires && Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  // 删除缓存
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  // 清空缓存
  clear(): void {
    this.cache.clear();
  }
  
  // 获取缓存大小
  size(): number {
    return this.cache.size;
  }
  
  // 清理过期缓存
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (item.expires && now > item.expires) {
        this.cache.delete(key);
      }
    }
  }
  
  // 获取所有缓存键
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }
}

// 创建全局缓存实例
export const globalCache = new CacheManager();

// 定期清理过期缓存
if (typeof window !== 'undefined') {
  setInterval(() => {
    globalCache.cleanup();
  }, 60000); // 每分钟清理一次
}

// LocalStorage 缓存工具
export class LocalStorageCache {
  private prefix: string;
  
  constructor(prefix: string = 'app_cache_') {
    this.prefix = prefix;
  }
  
  // 设置 localStorage 缓存
  set<T>(key: string, data: T, ttl: number = 24 * 60 * 60 * 1000): void { // 默认1天
    if (typeof window === 'undefined') return;
    
    try {
      const item = {
        data,
        timestamp: Date.now(),
        expires: Date.now() + ttl,
      };
      
      localStorage.setItem(this.prefix + key, JSON.stringify(item));
    } catch (error) {
      console.warn('LocalStorage缓存设置失败:', error);
    }
  }
  
  // 获取 localStorage 缓存
  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const itemStr = localStorage.getItem(this.prefix + key);
      if (!itemStr) return null;
      
      const item = JSON.parse(itemStr);
      
      // 检查是否过期
      if (item.expires && Date.now() > item.expires) {
        localStorage.removeItem(this.prefix + key);
        return null;
      }
      
      return item.data;
    } catch (error) {
      console.warn('LocalStorage缓存获取失败:', error);
      return null;
    }
  }
  
  // 删除 localStorage 缓存
  delete(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.prefix + key);
  }
  
  // 清空所有缓存
  clear(): void {
    if (typeof window === 'undefined') return;
    
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }
  
  // 清理过期缓存
  cleanup(): void {
    if (typeof window === 'undefined') return;
    
    const keys = Object.keys(localStorage);
    const now = Date.now();
    
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        try {
          const itemStr = localStorage.getItem(key);
          if (itemStr) {
            const item = JSON.parse(itemStr);
            if (item.expires && now > item.expires) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // 如果解析失败，删除该项
          localStorage.removeItem(key);
        }
      }
    });
  }
  
  // 获取所有缓存键（去除前缀）
  getKeys(): string[] {
    if (typeof window === 'undefined') return [];
    
    const keys = Object.keys(localStorage);
    return keys
      .filter(key => key.startsWith(this.prefix))
      .map(key => key.substring(this.prefix.length));
  }
}

// 创建默认的 localStorage 缓存实例
export const localCache = new LocalStorageCache();

// 图片缓存工具
export class ImageCache {
  private static instance: ImageCache;
  private cache = new Map<string, HTMLImageElement>();
  private loadingPromises = new Map<string, Promise<HTMLImageElement>>();
  
  static getInstance(): ImageCache {
    if (!ImageCache.instance) {
      ImageCache.instance = new ImageCache();
    }
    return ImageCache.instance;
  }
  
  // 预加载图片
  async preload(src: string): Promise<HTMLImageElement> {
    // 如果已经缓存，直接返回
    if (this.cache.has(src)) {
      return this.cache.get(src)!;
    }
    
    // 如果正在加载，返回加载Promise
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src)!;
    }
    
    // 创建新的加载Promise
    const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.cache.set(src, img);
        this.loadingPromises.delete(src);
        resolve(img);
      };
      
      img.onerror = () => {
        this.loadingPromises.delete(src);
        reject(new Error(`Failed to load image: ${src}`));
      };
      
      img.src = src;
    });
    
    this.loadingPromises.set(src, loadPromise);
    return loadPromise;
  }
  
  // 批量预加载图片
  async preloadBatch(urls: string[]): Promise<HTMLImageElement[]> {
    const promises = urls.map(url => this.preload(url).catch(() => null));
    const results = await Promise.all(promises);
    return results.filter(Boolean) as HTMLImageElement[];
  }
  
  // 获取缓存的图片
  get(src: string): HTMLImageElement | null {
    return this.cache.get(src) || null;
  }
  
  // 清空图片缓存
  clear(): void {
    this.cache.clear();
    this.loadingPromises.clear();
  }
}

// 创建图片缓存实例
export const imageCache = ImageCache.getInstance();

/**
 * 统一缓存清理工具
 * 提供登录状态变化时的缓存清理功能
 */

// 缓存清理配置
const CACHE_CLEAR_CONFIG = {
  // 内存缓存key
  MEMORY_CACHE_KEYS: [
    'user_info_',
    'tools_',
    'weather_',
  ],
  
  // localStorage缓存key
  LOCAL_CACHE_KEYS: [
    'user_info',
    'tools_cache',
    'weather_cache',
  ],
  
  // localStorage缓存前缀
  LOCAL_CACHE_PREFIXES: [
    'weather.cache',
    'weather.failure',
    'tools_',
    'user_',
  ],
  
  // 用户相关缓存key
  USER_RELATED_CACHE_KEYS: [
    'user_info',
    'user_tools',
    'user_favorites',
  ],
};

export class CacheCleaner {
  /**
   * 清理内存缓存中的指定key
   * @param keys 要清理的key数组
   */
  static clearMemoryCache(keys: string[]): void {
    console.log('🧹 开始清理内存缓存:', keys);
    
    keys.forEach(key => {
      // 支持前缀匹配清理
      if (key.endsWith('_')) {
        // 前缀匹配模式
        const allKeys = globalCache.getKeys();
        const matchedKeys = allKeys.filter(cacheKey => cacheKey.startsWith(key));
        matchedKeys.forEach(matchedKey => {
          globalCache.delete(matchedKey);
          console.log(`  ✅ 清理内存缓存: ${matchedKey}`);
        });
      } else {
        // 精确匹配模式
        const deleted = globalCache.delete(key);
        if (deleted) {
          console.log(`  ✅ 清理内存缓存: ${key}`);
        }
      }
    });
  }

  /**
   * 清理localStorage缓存中的指定key
   * @param keys 要清理的key数组
   */
  static clearLocalStorageCache(keys: string[]): void {
    console.log('🧹 开始清理localStorage缓存:', keys);
    
    keys.forEach(key => {
      localCache.delete(key);
      console.log(`  ✅ 清理localStorage缓存: ${key}`);
    });
  }

  /**
   * 根据前缀清理localStorage缓存
   * @param prefixes 要清理的前缀数组
   */
  static clearLocalStorageCacheByPrefix(prefixes: string[]): void {
    if (typeof window === 'undefined') return;
    
    console.log('🧹 开始按前缀清理localStorage缓存:', prefixes);
    
    const allKeys = Object.keys(localStorage);
    
    prefixes.forEach(prefix => {
      const matchedKeys = allKeys.filter(key => key.startsWith(prefix));
      matchedKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`  ✅ 清理localStorage缓存: ${key}`);
      });
    });
  }

  /**
   * 清理天气相关的旧格式缓存key（专用清理方法）
   * 用于清理从旧格式迁移到新格式时遗留的缓存
   */
  static clearWeatherLegacyCacheKeys(): void {
    if (typeof window === 'undefined') return;
    
    console.log('🧹 开始清理天气旧格式缓存key...');
    
    const allKeys = Object.keys(localStorage);
    
    // 旧格式的天气缓存前缀
    const legacyPrefixes = [
      'weather_vvhan_',
      'weather_openmeteo_',
      'vvhan_failure_',
      'weather_auto',
      'weather_'
    ];
    
    // 新格式的前缀（不应该被清理）
    const newPrefixes = [
      'weather.cache',
      'weather.failure'
    ];
    
    allKeys.forEach(key => {
      // 检查是否是旧格式的key
      const isLegacyKey = legacyPrefixes.some(prefix => key.startsWith(prefix));
      // 确保不是新格式的key
      const isNewKey = newPrefixes.some(prefix => key.startsWith(prefix));
      
      if (isLegacyKey && !isNewKey) {
        localStorage.removeItem(key);
        console.log(`  ✅ 清理天气旧格式缓存key: ${key}`);
      }
    });
    
    console.log('✅ 天气旧格式缓存key清理完成');
  }

  /**
   * 执行完整的缓存清理
   * 根据配置清理所有相关缓存
   */
  static clearAllConfiguredCache(): void {
    console.log('🚀 执行完整缓存清理...');
    
    // 清理内存缓存
    this.clearMemoryCache(CACHE_CLEAR_CONFIG.MEMORY_CACHE_KEYS);
    
    // 清理localStorage缓存
    this.clearLocalStorageCache(CACHE_CLEAR_CONFIG.LOCAL_CACHE_KEYS);
    
    // 按前缀清理localStorage缓存
    this.clearLocalStorageCacheByPrefix(CACHE_CLEAR_CONFIG.LOCAL_CACHE_PREFIXES);
    
    console.log('✅ 完整缓存清理完成');
  }

  /**
   * 清理用户相关缓存
   * 登录状态变化时调用，只清理与用户相关的缓存
   */
  static async clearUserRelatedCache(reason: string = '用户相关缓存清理'): Promise<void> {
    console.log('🔄 清理用户相关缓存...');
    
    // 清理内存中的用户相关缓存
    this.clearMemoryCache(CACHE_CLEAR_CONFIG.USER_RELATED_CACHE_KEYS);
    
    // 清理localStorage中的用户相关缓存
    this.clearLocalStorageCache(CACHE_CLEAR_CONFIG.USER_RELATED_CACHE_KEYS);
    
    // 清理API层面的请求缓存
    this.clearApiRequestCache();
    
    // 清理服务端缓存
    await this.clearServerCache(reason, 'tools');
    
    console.log('✅ 用户相关缓存清理完成');
  }

  /**
   * 清理API层面的请求缓存
   * 通过触发自定义事件通知API层清理pendingRequest等缓存
   */
  static clearApiRequestCache(): void {
    if (typeof window !== 'undefined') {
      // 触发API缓存清理事件
      window.dispatchEvent(new CustomEvent('CLEAR_API_CACHE', {
        detail: { timestamp: Date.now() }
      }));
      console.log('📡 已触发API缓存清理事件');
    }
  }

  /**
   * 清理服务端缓存
   * 调用服务端API清理缓存
   */
  static async clearServerCache(reason: string, pattern?: string): Promise<void> {
    try {
      const response = await fetch('/api/utility/cache-clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pattern, reason }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ 服务端缓存清理成功:', result.data?.message);
      } else {
        console.warn('⚠️ 服务端缓存清理失败:', response.status);
      }
    } catch (error) {
      console.warn('⚠️ 服务端缓存清理请求失败:', error);
    }
  }

  /**
   * 登录成功后的缓存清理
   * 清理可能包含旧用户数据的缓存
   */
  static async clearCacheOnLogin(): Promise<void> {
    console.log('🎉 登录成功，清理缓存...');
    await this.clearUserRelatedCache('登录成功');
  }

  /**
   * 退出登录后的缓存清理
   * 清理所有用户相关的缓存数据
   */
  static async clearCacheOnLogout(): Promise<void> {
    console.log('👋 退出登录，清理缓存...');
    await this.clearUserRelatedCache('退出登录');
  }

  /**
   * 登录失效(9996错误)后的缓存清理
   * 清理所有可能过期的缓存数据
   */
  static async clearCacheOnTokenExpired(): Promise<void> {
    console.log('⚠️ 登录已过期，清理缓存...');
    await this.clearUserRelatedCache('登录过期');
  }
}

/**
 * 快捷方法：登录状态变化时的统一缓存清理和数据重新加载
 * @param eventType 事件类型：'login' | 'logout' | 'token_expired'
 * @param forceReload 是否强制重新加载页面数据
 */
export async function handleAuthStateChange(
  eventType: 'login' | 'logout' | 'token_expired',
  forceReload: boolean = true
): Promise<void> {
  console.log(`🔄 处理认证状态变化: ${eventType}`);
  
  // 根据事件类型清理相应缓存
  try {
    switch (eventType) {
      case 'login':
        await CacheCleaner.clearCacheOnLogin();
        break;
      case 'logout':
        await CacheCleaner.clearCacheOnLogout();
        break;
      case 'token_expired':
        await CacheCleaner.clearCacheOnTokenExpired();
        break;
    }
  } catch (error) {
    console.error('缓存清理过程中出现错误:', error);
  }
  
  // 如果需要强制重新加载数据，触发相关事件
  if (forceReload && typeof window !== 'undefined') {
    // 延迟一点时间确保缓存清理完成
    setTimeout(() => {
      // 触发数据重新加载事件
      window.dispatchEvent(new CustomEvent('CACHE_CLEARED', {
        detail: { eventType, timestamp: Date.now() }
      }));
      console.log('📡 已触发缓存清理完成事件');
    }, 200);
  }
} 