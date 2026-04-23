import { SearchProvider, SearchResult, SearchOptions } from '@/types/search';
import { fetchToolsData } from '@/services/api';
import { ApiResponse } from '@/types/IndexToolList';

export class HomeSearchProvider implements SearchProvider {
  name = 'home';
  private cachedData: any[] = [];
  private lastCacheTime = 0;
  private CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

  async search(query: string, options: Partial<SearchOptions> = {}): Promise<SearchResult[]> {
    const { limit = 10, signal } = options;

    // 获取数据
    const data = await this.getData(signal);
    const results: SearchResult[] = [];

    // 遍历所有分类和分组
    for (const category of data || []) {
      for (const group of category.glist || []) {
        for (const tool of group.tools || []) {
          if (signal?.aborted) return [];

          const score = this.calculateScore(tool, query);
          if (score > 0) {
            results.push({
              id: `home_${tool.id || tool.title}`,
              title: tool.title,
              description: tool.desc || tool.description || '',
              url: tool.url,
              score,
              source: 'home',
              metadata: {
                category: category.cname,
                group: group.groupName,
                icon: tool.img,
                imageUrl: tool.img,
                sl: tool.sl,
                sw: tool.sw // 访问权限标识：0=任何人都可以访问，>0=需要登录
              }
            });
          }
        }
      }
    }

    // 处理搜索结果：去重和排序
    return this.processSearchResults(results, limit);
  }

  /**
   * 处理搜索结果：去重、排序、限制数量
   */
  private processSearchResults(results: SearchResult[], limit: number): SearchResult[] {
    // 1. 按分数排序（分数高的在前）
    const sortedResults = results.sort((a, b) => b.score - a.score);

    // 2. 去重（保留分数高的）
    const deduplicatedResults = this.deduplicateByUrl(sortedResults);

    // 3. 限制数量
    return deduplicatedResults.slice(0, limit);
  }

  /**
   * 根据URL去重，保留分数高的结果
   */
  private deduplicateByUrl(results: SearchResult[]): SearchResult[] {
    const urlMap = new Map<string, SearchResult>();

    results.forEach(result => {
      const existing = urlMap.get(result.url);
      // 如果不存在当前URL，或者当前结果的分数更高，则保留/更新
      if (!existing || result.score > existing.score) {
        urlMap.set(result.url, result);
      }
      // 如果分数相同，随机保留一个（当前逻辑是保留第一个遇到的）
    });

    return Array.from(urlMap.values());
  }

  private calculateScore(tool: any, query: string): number {
    // 数据安全性检查
    if (!tool || !query || typeof query !== 'string') return 0;

    // 分词处理，基于空格分割多个关键词
    const keywords = query.toLowerCase()
      .split(/\s+/)
      .filter(keyword => keyword.trim().length > 0); // 过滤空字符串

    if (keywords.length === 0) return 0;

    let totalScore = 0;

    for (const keyword of keywords) {
      let keywordScore = 0;
      let hasMatch = false;

      // 标题匹配：1000分系数
      if (tool.title?.toLowerCase().includes(keyword)) {
        const position = tool.title.toLowerCase().indexOf(keyword);
        const positionWeight = this.calculatePositionWeight(position);
        keywordScore += 1000 * positionWeight;
        hasMatch = true;

        // 完全匹配额外加分
        if (tool.title.toLowerCase() === keyword) {
          keywordScore += 500;
        }
      }

      // URL匹配：100分系数
      if (tool.url?.toLowerCase().includes(keyword)) {
        const position = tool.url.toLowerCase().indexOf(keyword);
        const positionWeight = this.calculatePositionWeight(position);
        keywordScore += 100 * positionWeight;
        hasMatch = true;
      }

      // 描述匹配：10分系数
      if ((tool.desc || tool.description || '')?.toLowerCase().includes(keyword)) {
        const description = tool.desc || tool.description || '';
        const position = description.toLowerCase().indexOf(keyword);
        const positionWeight = this.calculatePositionWeight(position);
        keywordScore += 10 * positionWeight;
        hasMatch = true;
      }

      // 如果当前关键词没有任何匹配，则整个工具不匹配（保持AND逻辑）
      if (!hasMatch) {
        return 0;
      }

      totalScore += keywordScore;
    }

    return Math.round(totalScore);
  }

  /**
   * 计算位置权重
   * @param position 关键词首次出现位置
   * @returns 位置权重 (0.1 - 1.0)
   */
  private calculatePositionWeight(position: number): number {
    // 位置0：权重1.0（最大）
    // 位置1-20：快速衰减，从0.975逐渐降到0.5
    // 位置21-50：缓慢衰减，从0.49逐渐降到0.4
    // 位置50+：保持最小权重0.1

    if (position === 0) return 1.0;

    // 前20个字符快速衰减
    if (position <= 20) {
      // 线性衰减公式：1.0 - (position * 0.025)
      // position=1: 0.975, position=5: 0.875, position=10: 0.75, position=20: 0.5
      return Math.max(0.5, 1.0 - (position * 0.025));
    }

    // 21-50位缓慢衰减
    if (position <= 50) {
      // 线性衰减公式：0.5 - ((position - 20) * 0.0033)
      // position=21: 0.4967, position=30: 0.4667, position=50: 0.4
      return Math.max(0.4, 0.5 - ((position - 20) * 0.0033));
    }

    // 50位之后保持最小权重
    return 0.1;
  }

  private async getData(signal?: AbortSignal): Promise<any[]> {
    // 检查缓存
    const now = Date.now();
    if (this.cachedData.length > 0 && (now - this.lastCacheTime) < this.CACHE_DURATION) {
      return this.cachedData;
    }

    try {
      const response: ApiResponse = await fetchToolsData();
      if (signal?.aborted) return [];

      this.cachedData = response || [];
      this.lastCacheTime = now;
      return this.cachedData;
    } catch (error) {
      console.error('获取首页数据失败:', error);
      return [];
    }
  }

  async preload(): Promise<void> {
    // 预加载数据到缓存
    await this.getData();
  }

  clearCache(): void {
    this.cachedData = [];
    this.lastCacheTime = 0;
  }
}