import { SearchProvider, SearchResult, SearchOptions } from '@/types/search';
import { HomeSearchProvider } from './HomeSearchProvider';

export class SearchManager {
  private static instance: SearchManager;
  private providers: Map<string, SearchProvider> = new Map();
  private currentController: AbortController | null = null;
  private searchCache = new Map<string, { results: SearchResult[]; timestamp: number }>();
  private CACHE_DURATION = 2 * 60 * 1000; // 2分钟缓存

  static getInstance(): SearchManager {
    if (!SearchManager.instance) {
      SearchManager.instance = new SearchManager();
    }
    return SearchManager.instance;
  }

  private constructor() {
    this.initProviders();
  }

  private initProviders(): void {
    this.providers.set('home', new HomeSearchProvider());
    // TODO: 后续添加书签和收藏提供者
    // this.providers.set('bookmarks', new BookmarksSearchProvider());
    // this.providers.set('favorites', new FavoritesSearchProvider());
  }

  async search(query: string, source: string, options: Partial<SearchOptions> = {}): Promise<SearchResult[]> {
    // 取消之前的搜索
    this.cancelCurrentSearch();

    // 检查缓存
    const cacheKey = `${source}_${query}_${JSON.stringify(options)}`;
    const cached = this.searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.results;
    }

    const provider = this.providers.get(source);
    if (!provider) {
      throw new Error(`Unknown search provider: ${source}`);
    }

    // 创建新的AbortController
    this.currentController = new AbortController();
    const searchOptions: SearchOptions = {
      query,
      source,
      limit: 10,
      signal: this.currentController.signal,
      ...options
    };

    try {
      const results = await provider.search(query, searchOptions);

      // 缓存结果
      this.searchCache.set(cacheKey, {
        results,
        timestamp: Date.now()
      });

      return results;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return [];
      }
      throw error;
    }
  }

  getCurrentSource(): string {
    // 根据当前路径返回搜索源
    if (typeof window === 'undefined') return 'home';

    const path = window.location.pathname;
    if (path === '/' || path.includes('/tools')) return 'home';
    if (path.includes('/bookmarks')) return 'bookmarks';
    if (path.includes('/favorites')) return 'favorites';
    return 'home';
  }

  cancelCurrentSearch(): void {
    if (this.currentController) {
      this.currentController.abort();
      this.currentController = null;
    }
  }

  async preloadData(): Promise<void> {
    // 预加载当前搜索源的数据
    const currentSource = this.getCurrentSource();
    const provider = this.providers.get(currentSource);
    if (provider?.preload) {
      try {
        await provider.preload();
      } catch (error) {
        console.error(`预加载 ${currentSource} 数据失败:`, error);
      }
    }
  }

  clearCache(): void {
    this.searchCache.clear();
    // 清空所有提供者的缓存
    this.providers.forEach(provider => {
      if (provider.clearCache) {
        provider.clearCache();
      }
    });
  }

  // 清理过期的缓存条目
  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.searchCache.entries()) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        this.searchCache.delete(key);
      }
    }
  }

  // 获取缓存统计信息
  getCacheStats(): { size: number; expired: number } {
    this.cleanExpiredCache();
    return {
      size: this.searchCache.size,
      expired: 0 // 清理后过期数量为0
    };
  }
}

// 导出单例实例
export const searchManager = SearchManager.getInstance();