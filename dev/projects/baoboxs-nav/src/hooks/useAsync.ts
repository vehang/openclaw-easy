import { useState, useEffect, useCallback, useRef } from 'react';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// 全局请求缓存，用于去重
const pendingRequests = new Map<string, Promise<any>>();

export function useAsync<T>(
  asyncFunction: (forceRefresh?: boolean) => Promise<T>,
  dependencies: any[] = []
): AsyncState<T> & {
  execute: (forceRefresh?: boolean) => Promise<void>;
  reset: () => void;
} {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const functionKeyRef = useRef<string>('');

  // 生成函数的唯一标识
  const getFunctionKey = useCallback((forceRefresh?: boolean) => {
    if (!functionKeyRef.current) {
      functionKeyRef.current = `async_${asyncFunction.toString().substring(0, 50)}_${Date.now()}`;
    }
    return `${functionKeyRef.current}_${forceRefresh ? 'force' : 'normal'}`;
  }, [asyncFunction]);

  const execute = useCallback(async (forceRefresh?: boolean) => {
    const functionKey = getFunctionKey(forceRefresh);
    
    // 如果不是强制刷新，检查是否有相同的请求正在进行
    if (!forceRefresh && pendingRequests.has(functionKey)) {
      console.log('检测到重复请求，等待现有请求完成');
      try {
        const result = await pendingRequests.get(functionKey);
        setState({ data: result, loading: false, error: null });
        return;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        setState({ data: null, loading: false, error: errorMessage });
        return;
      }
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // 创建请求Promise并缓存
      const requestPromise = asyncFunction(forceRefresh);
      pendingRequests.set(functionKey, requestPromise);
      
      const result = await requestPromise;
      setState({ data: result, loading: false, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setState({ data: null, loading: false, error: errorMessage });
    } finally {
      // 请求完成后清除缓存
      pendingRequests.delete(functionKey);
    }
  }, [asyncFunction, getFunctionKey]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
    // 清除可能的pending请求
    const functionKey = getFunctionKey();
    pendingRequests.delete(functionKey);
  }, [getFunctionKey]);

  useEffect(() => {
    execute();
  }, dependencies); // 注意：dependencies中不应包含函数，否则可能导致无限循环

  return {
    ...state,
    execute,
    reset,
  };
}

// 用于缓存的异步Hook
export function useAsyncWithCache<T>(
  key: string,
  asyncFunction: () => Promise<T>,
  cacheTime: number = 5 * 60 * 1000, // 默认5分钟缓存
  dependencies: any[] = []
): AsyncState<T> & {
  execute: () => Promise<void>;
  reset: () => void;
  clearCache: () => void;
} {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const getCachedData = useCallback((): T | null => {
    try {
      if (typeof window === 'undefined') return null;
      
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();
      
      if (now - timestamp < cacheTime) {
        return data;
      }
      
      // 缓存过期，删除
      localStorage.removeItem(key);
      return null;
    } catch (error) {
      console.error(`Error reading cache for key "${key}":`, error);
      return null;
    }
  }, [key, cacheTime]);

  const setCachedData = useCallback((data: T) => {
    try {
      if (typeof window === 'undefined') return;
      
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error(`Error setting cache for key "${key}":`, error);
    }
  }, [key]);

  const execute = useCallback(async () => {
    // 首先检查缓存
    const cachedData = getCachedData();
    if (cachedData) {
      setState({ data: cachedData, loading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await asyncFunction();
      setCachedData(result);
      setState({ data: result, loading: false, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setState({ data: null, loading: false, error: errorMessage });
    }
  }, [asyncFunction, getCachedData, setCachedData]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  const clearCache = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error clearing cache for key "${key}":`, error);
    }
  }, [key]);

  useEffect(() => {
    execute();
  }, dependencies);

  return {
    ...state,
    execute,
    reset,
    clearCache,
  };
} 