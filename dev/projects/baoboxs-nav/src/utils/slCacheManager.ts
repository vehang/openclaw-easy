import { Category } from '@/types/IndexToolList';

/**
 * SL缓存管理器
 * 使用localStorage持久化 + 内存缓存，提供高性能的sl字段查找和补全功能
 */
class SLCacheManager {
  private static instance: SLCacheManager;
  private memoryCache: Map<number, string> = new Map();
  private readonly CACHE_KEY = 'tool_sl_cache';
  private readonly CACHE_VERSION_KEY = 'tool_sl_cache_version';
  private readonly CURRENT_VERSION = '1.0.0';

  private constructor() {
    this.initCache();
  }

  static getInstance(): SLCacheManager {
    if (!SLCacheManager.instance) {
      SLCacheManager.instance = new SLCacheManager();
    }
    return SLCacheManager.instance;
  }

  /**
   * 初始化缓存，从localStorage加载到内存
   */
  private initCache(): void {
    // 检查是否在浏览器环境中
    if (typeof window === 'undefined') {
      return; // 服务端环境，不初始化localStorage
    }

    try {
      // 安全检查：确保常用工具缓存存在且完整
      this.validateFrequentToolsIntegrity();

      // 检查缓存版本
      const cachedVersion = localStorage.getItem(this.CACHE_VERSION_KEY);
      if (cachedVersion !== this.CURRENT_VERSION) {
        // 版本不匹配，清空缓存
        this.clearCache();
        localStorage.setItem(this.CACHE_VERSION_KEY, this.CURRENT_VERSION);
        return;
      }

      // 从localStorage加载缓存
      const cachedData = localStorage.getItem(this.CACHE_KEY);
      if (cachedData) {
        const cacheObject = JSON.parse(cachedData) as Record<number, string>;
        this.memoryCache = new Map(Object.entries(cacheObject).map(([k, v]) => [parseInt(k), v]));
        console.log(`[SLCache] 从localStorage加载了 ${this.memoryCache.size} 个sl缓存`);
      }
    } catch (error) {
      console.warn('[SLCache] 初始化缓存失败:', error);
      this.clearCache();
    }
  }

  /**
   * 验证常用工具缓存的完整性（安全检查）
   */
  private validateFrequentToolsIntegrity(): void {
    if (typeof window === 'undefined') {
      return; // 服务端环境，跳过检查
    }

    try {
      // 优先检查 v3 数据，如果没有再检查 v2 数据
      let frequentToolsData = localStorage.getItem('frequent-tools-visits-v3');
      let dataType = 'v3';

      if (!frequentToolsData) {
        frequentToolsData = localStorage.getItem('frequent-tools-visits-v2');
        dataType = 'v2';
      }

      if (frequentToolsData) {
        const parsed = JSON.parse(frequentToolsData);
        let toolCount = 0;

        if (Array.isArray(parsed)) {
          // v2 格式：直接是工具数组
          toolCount = parsed.length;
        } else if (parsed && parsed.tools && Array.isArray(parsed.tools)) {
          // v3 格式：包含 tools 字段的对象
          toolCount = parsed.tools.length;
        }

        console.log(`[SLCache] 安全检查：常用工具缓存完整（${dataType}格式），包含 ${toolCount} 个工具`);
      } else {
        console.log('[SLCache] 安全检查：常用工具缓存为空，这是正常情况');
      }
    } catch (error) {
      console.warn('[SLCache] 安全检查失败，但不影响SL缓存功能:', error);
    }
  }

  /**
   * 保存内存缓存到localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') {
      return; // 服务端环境，跳过保存
    }

    try {
      const cacheObject = Object.fromEntries(this.memoryCache);
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheObject));
    } catch (error) {
      console.warn('[SLCache] 保存缓存到localStorage失败:', error);
    }
  }

  /**
   * 批量预加载sl字段
   * @param categories 首页分类数据
   */
  preloadSLs(categories: Category[]): void {
    if (!categories || categories.length === 0) return;

    let newSLsCount = 0;
    const now = Date.now();

    categories.forEach(category => {
      category.glist.forEach(group => {
        group.tools.forEach(tool => {
          if (tool.id && tool.sl && !this.memoryCache.has(tool.id)) {
            this.memoryCache.set(tool.id, tool.sl);
            newSLsCount++;
          }
        });
      });
    });

    if (newSLsCount > 0) {
      this.saveToStorage();
      console.log(`[SLCache] 预加载了 ${newSLsCount} 个新的sl字段，耗时 ${Date.now() - now}ms`);
    }
  }

  /**
   * 根据工具ID获取sl字段
   * @param toolId 工具ID
   * @returns sl字段或undefined
   */
  getSL(toolId: number): string | undefined {
    return this.memoryCache.get(toolId);
  }

  /**
   * 补全工具数组的sl字段
   * @param tools 工具数组
   * @returns 补全后的工具数组
   */
  enrichTools<T extends { id?: number; sl?: string; lastSource?: string }>(tools: T[]): T[] {
    return tools.map(tool => {
      // 如果已经有sl字段，直接返回
      if (tool.sl) {
        return tool;
      }

      // 如果有ID且来源是homepage，尝试从缓存获取sl
      if (tool.id && tool.lastSource === 'homepage') {
        const cachedSL = this.memoryCache.get(tool.id);
        if (cachedSL) {
          return { ...tool, sl: cachedSL };
        }
      }

      return tool;
    });
  }

  /**
   * 批量设置sl字段（用于手动更新）
   * @param slMap 工具ID到sl的映射
   */
  setSLs(slMap: Record<number, string>): void {
    let newCount = 0;
    Object.entries(slMap).forEach(([toolId, sl]) => {
      const id = parseInt(toolId);
      if (!this.memoryCache.has(id)) {
        this.memoryCache.set(id, sl);
        newCount++;
      }
    });

    if (newCount > 0) {
      this.saveToStorage();
      console.log(`[SLCache] 新增了 ${newCount} 个sl字段到缓存`);
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): { size: number; version: string } {
    return {
      size: this.memoryCache.size,
      version: this.CURRENT_VERSION
    };
  }

  /**
   * 清空所有缓存
   */
  clearCache(): void {
    this.memoryCache.clear();
    if (typeof window === 'undefined') {
      return; // 服务端环境，跳过清空localStorage
    }

    try {
      localStorage.removeItem(this.CACHE_KEY);
      localStorage.removeItem(this.CACHE_VERSION_KEY);
      console.log('[SLCache] 缓存已清空');
    } catch (error) {
      console.warn('[SLCache] 清空localStorage缓存失败:', error);
    }
  }

  /**
   * 检查缓存是否包含指定工具ID
   * @param toolId 工具ID
   */
  has(toolId: number): boolean {
    return this.memoryCache.has(toolId);
  }

  /**
   * 获取所有缓存的工具ID
   */
  getAllToolIds(): number[] {
    return Array.from(this.memoryCache.keys());
  }
}

// 导出单例实例
export const slCacheManager = SLCacheManager.getInstance();

// 导出类型
export type { SLCacheManager };