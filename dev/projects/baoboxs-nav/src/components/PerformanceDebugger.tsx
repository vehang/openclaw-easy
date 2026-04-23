'use client';

import React, { useState, useEffect } from 'react';
import { globalCache, localCache } from '@/utils/cache';

interface RequestLog {
  timestamp: number;
  url: string;
  method: string;
  duration: number;
  cacheHit: boolean;
  size?: number;
}

export default function PerformanceDebugger() {
  const [visible, setVisible] = useState(false);
  const [requestLogs, setRequestLogs] = useState<RequestLog[]>([]);
  const [cacheStats, setCacheStats] = useState({
    memorySize: 0,
    localSize: 0,
    memoryKeys: [] as string[],
    localKeys: [] as string[],
  });

  // 获取缓存统计信息
  const updateCacheStats = () => {
    const memoryKeys = globalCache.getKeys();
    const localKeys = localCache.getKeys();
    
    setCacheStats({
      memorySize: memoryKeys.length,
      localSize: localKeys.length,
      memoryKeys,
      localKeys,
    });
  };

  // 监控网络请求
  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const urlArg = args[0];
      const options = args[1] || {};
      const method = options.method || 'GET';

      // 确保url是字符串类型
      let url: string;
      if (typeof urlArg === 'string') {
        url = urlArg;
      } else if (urlArg instanceof Request) {
        url = urlArg.url;
      } else {
        url = String(urlArg);
      }

      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);

                 // 检查是否是缓存命中（通过检查响应头）
         const cacheControl = response.headers.get('cache-control');
         const xCache = response.headers.get('x-cache');
         const cacheHit = xCache === 'HIT' ||
                         (cacheControl !== null && cacheControl.includes('max-age'));

        const contentLength = response.headers.get('content-length');
        const size = contentLength ? parseInt(contentLength) : undefined;

        setRequestLogs(prev => [...prev.slice(-19), {
          timestamp: Date.now(),
          url: url.replace(/^.*\//, ''), // 只显示最后一部分URL
          method,
          duration,
          cacheHit,
          size,
        }]);

        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);

        setRequestLogs(prev => [...prev.slice(-19), {
          timestamp: Date.now(),
          url: url.replace(/^.*\//, ''),
          method,
          duration,
          cacheHit: false,
        }]);

        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // 定期更新缓存统计
  useEffect(() => {
    updateCacheStats();
    const interval = setInterval(updateCacheStats, 2000);
    return () => clearInterval(interval);
  }, []);

  // 清除缓存
  const clearCaches = () => {
    globalCache.clear();
    localCache.clear();
    updateCacheStats();
    console.log('✅ 已清除所有缓存');
  };

  // 清除日志
  const clearLogs = () => {
    setRequestLogs([]);
  };

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded-full shadow-lg z-50 hover:bg-blue-600 transition-colors"
        title="显示性能调试器"
      >
        🚀
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white border shadow-lg rounded-lg z-50 max-h-96 overflow-y-auto">
      <div className="sticky top-0 bg-gray-100 p-3 border-b flex justify-between items-center">
        <h3 className="font-semibold text-sm">性能调试器</h3>
        <div className="flex gap-2">
          <button
            onClick={clearCaches}
            className="text-xs bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600"
            title="清除所有缓存"
          >
            清缓存
          </button>
          <button
            onClick={clearLogs}
            className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
            title="清除日志"
          >
            清日志
          </button>
          <button
            onClick={() => setVisible(false)}
            className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
          >
            关闭
          </button>
        </div>
      </div>
      
      {/* 缓存统计 */}
      <div className="p-3 border-b">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">缓存统计</h4>
        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span>内存缓存:</span>
            <span className="font-mono">{cacheStats.memorySize} 项</span>
          </div>
          <div className="flex justify-between">
            <span>本地缓存:</span>
            <span className="font-mono">{cacheStats.localSize} 项</span>
          </div>
          {cacheStats.memoryKeys.length > 0 && (
            <div className="mt-2">
              <div className="text-gray-600 text-xs">内存缓存键:</div>
              <div className="text-xs bg-gray-50 p-1 rounded max-h-16 overflow-y-auto">
                {cacheStats.memoryKeys.map(key => (
                  <div key={key} className="truncate">{key}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 请求日志 */}
      <div className="p-3">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">
          最近请求 ({requestLogs.length}/20)
        </h4>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {requestLogs.slice().reverse().map((log, index) => (
            <div
              key={index}
              className={`text-xs p-2 rounded ${
                log.cacheHit 
                  ? 'bg-green-50 border-l-2 border-green-400' 
                  : log.duration > 2000 
                    ? 'bg-red-50 border-l-2 border-red-400'
                    : log.duration > 1000 
                      ? 'bg-yellow-50 border-l-2 border-yellow-400'
                      : 'bg-gray-50 border-l-2 border-gray-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="truncate font-mono">
                    {log.method} {log.url}
                  </div>
                  <div className="text-gray-500 mt-1">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                <div className="text-right ml-2">
                  <div className={`font-mono ${
                    log.duration > 2000 ? 'text-red-600' :
                    log.duration > 1000 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {log.duration}ms
                  </div>
                  {log.cacheHit && (
                    <div className="text-green-600 text-xs">缓存命中</div>
                  )}
                  {log.size && (
                    <div className="text-gray-500 text-xs">
                      {log.size > 1024 ? `${Math.round(log.size/1024)}KB` : `${log.size}B`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {requestLogs.length === 0 && (
            <div className="text-center text-gray-500 text-xs py-4">
              暂无请求记录
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 