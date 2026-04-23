// 搜索相关的类型定义

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  url: string;
  score: number;
  source: 'home' | 'bookmarks' | 'favorites';
  metadata?: {
    // 首页工具特有字段
    category?: string;
    group?: string;
    icon?: string;
    sl?: string; // 短地址字段
    sw?: number; // 访问权限标识：0=任何人都可以访问，>0=需要登录

    // 书签特有字段
    folder?: string;
    favicon?: string;
    dateAdded?: string;

    // 收藏特有字段
    tags?: string[];
    customTitle?: string;
    customDesc?: string;
    groupId?: number;

    // 通用字段
    imageUrl?: string;
    createdAt?: string;
  };
}

export interface SearchOptions {
  query: string;
  source: string;
  limit?: number;
  sortBy?: 'score' | 'title' | 'date';
  signal?: AbortSignal;
}

export interface SearchProvider {
  name: string;
  search: (query: string, options?: SearchOptions) => Promise<SearchResult[]>;
  preload?: () => Promise<void>;
  clearCache?: () => void;
}

export interface UseSearchOptions {
  debounceMs?: number;
  enabled?: boolean;
  limit?: number;
  sortBy?: 'score' | 'title' | 'date';
  source?: string;
}

export interface SearchHookResult {
  results: SearchResult[];
  loading: boolean;
  error: Error | null;
  search: (query: string, source?: string) => void;
  cancel: () => void;
  clear: () => void;
}

// 搜索结果分组
export interface GroupedResults {
  all: SearchResult[];
  home: SearchResult[];
  bookmarks: SearchResult[];
  favorites: SearchResult[];
}

// 搜索统计信息
export interface SearchStats {
  total: number;
  home: number;
  bookmarks: number;
  favorites: number;
  query: string;
  searchTime: number;
}