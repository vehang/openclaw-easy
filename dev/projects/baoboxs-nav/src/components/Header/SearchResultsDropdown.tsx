'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FaExternalLinkAlt, FaFolder, FaBookmark, FaStar, FaSpinner, FaClock, FaTag, FaSearch, FaUser } from 'react-icons/fa';
import type { SearchResult } from '@/types/search';
import { isUserLoggedIn } from '@/utils/auth';

interface SearchResultsDropdownProps {
  results: SearchResult[];
  loading: boolean;
  query: string;
  onSelect: (result: SearchResult) => void;
  onClose: () => void;
  currentSource?: string;
}

const SearchResultsDropdown: React.FC<SearchResultsDropdownProps> = ({
  results,
  loading,
  query,
  onSelect,
  onClose,
  currentSource = 'home'
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 手动处理滚动容器的滚轮事件（解决 Edge 浏览器兼容性问题）
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || !isClient) return;

    const handleWheel = (e: WheelEvent) => {
      // 手动控制滚动
      scrollContainer.scrollTop += e.deltaY;
    };

    // 使用原生事件监听器，passive: false 允许 preventDefault
    scrollContainer.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      scrollContainer.removeEventListener('wheel', handleWheel);
    };
  }, [isClient]);

  // 当下拉框打开时，锁定 body 滚动
  useEffect(() => {
    if (!isClient) return;

    // 保存原始样式
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    // 锁定滚动（不用 position: fixed，避免影响下拉框布局）
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      // 恢复滚动
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [isClient]);

  // 当搜索完成且没有结果时，延迟关闭下拉框
  useEffect(() => {
    if (!loading && results.length === 0 && query.trim()) {
      const timer = setTimeout(() => {
        onClose();
      }, 500); // 500ms后自动关闭，让用户看到搜索完成的反馈

      return () => clearTimeout(timer);
    }
  }, [loading, results, query, onClose]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedIndex(prev =>
            prev < results.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex(prev =>
            prev > 0 ? prev - 1 : results.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < results.length) {
            onSelect(results[highlightedIndex]);
          }
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [results, highlightedIndex, onSelect, onClose]);

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-[#00bba7]/20 text-[#00bba7] rounded px-0.5 font-medium">
          {part}
        </mark>
      ) : (
        <span key={index}>{part}</span>
      )
    );
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'home': return <FaStar className="text-yellow-500" />;
      case 'bookmarks': return <FaBookmark className="text-blue-500" />;
      case 'favorites': return <FaStar className="text-red-500" />;
      default: return <FaStar className="text-gray-500" />;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'home': return '工具';
      case 'bookmarks': return '书签';
      case 'favorites': return '收藏';
      default: return '其他';
    }
  };

  const shouldShowCategory = (source: string) => {
    return source === 'home' || source === 'favorites';
  };

  // Prevent hydration mismatch by only rendering after client-side mount
  if (!isClient) {
    return null;
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 z-[60] max-h-[500px] overflow-hidden search-dropdown-no-overflow search-dropdown-container"
    >
        {/* 搜索状态栏 */}
        <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              {loading ? (
                <div className="animate-spin">
                  <FaSpinner className="text-[#00bba7] text-lg" />
                </div>
              ) : (
                <div className="w-5 h-5 bg-[#00bba7]/10 rounded-full flex items-center justify-center">
                  <FaSearch className="text-[#00bba7] text-xs" />
                </div>
              )}
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {loading ? '正在搜索...' : `找到 ${results.length} 个结果`}
                </div>
                {query && (
                  <div className="text-xs text-gray-500">
                    关键词: "{query}"
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 搜索结果列表 */}
        <div ref={scrollContainerRef} className="max-h-[350px] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 mx-auto mb-4">
                <FaSpinner className="text-[#00bba7] text-2xl" />
              </div>
              <p className="text-sm text-gray-500 font-medium">搜索{getSourceLabel(currentSource)}中...</p>
              <p className="text-xs text-gray-400 mt-1">正在为您匹配最佳结果</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => {
                const isHovered = hoveredIndex === index || highlightedIndex === index;
                const isKeyboardHighlighted = highlightedIndex === index && hoveredIndex === null;

                // 检查是否需要登录
                const requiresLogin = (result.metadata?.sw || 0) > 0;
                const isLoggedIn = isUserLoggedIn();

                return (
                  <div
                    key={`${result.source}_${result.id}`}
                    className={`px-4 py-3 cursor-pointer transition-all search-result-hover overflow-hidden relative ${
                      (isHovered || isKeyboardHighlighted)
                        ? 'bg-gradient-to-r from-[#00bba7]/5 to-transparent'
                        : 'hover:bg-gray-50'
                    } ${requiresLogin && !isLoggedIn ? 'opacity-70' : ''}`}
                    onClick={() => onSelect(result)}
                    onMouseEnter={() => {
                      setHoveredIndex(index);
                      setHighlightedIndex(index);
                    }}
                    onMouseLeave={() => {
                      setHoveredIndex(null);
                      // 如果之前是鼠标悬停触发的键盘高亮，也需要重置
                      if (highlightedIndex === index) {
                        setHighlightedIndex(-1);
                      }
                    }}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {/* 左侧选中指示器 */}
                    {(isHovered || isKeyboardHighlighted) && (
                      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#00bba7]" />
                    )}
                    {/* 主要内容区域 */}
                    <div className="flex-1 min-w-0">
                      {/* 上行：图标 + 标题 */}
                      <div className="flex items-center mb-1">
                        {/* 图标 */}
                        <div className="flex-shrink-0 mr-3">
                          {result.metadata?.imageUrl ? (
                            <div className="relative">
                              <img
                                src={result.metadata.imageUrl}
                                alt={result.title}
                                className="w-6 h-6 rounded-lg object-cover shadow-sm"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                              <div className="hidden w-6 h-6 rounded-lg bg-gradient-to-br from-[#00bba7] to-[#00a593] flex items-center justify-center shadow-sm">
                                {getSourceIcon(result.source)}
                              </div>
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-sm">
                              {getSourceIcon(result.source)}
                            </div>
                          )}
                        </div>

                        {/* 标题区域 */}
                        <div className="flex items-center min-w-0 overflow-hidden">
                          {/* 标题 */}
                          <h3 className={`text-sm font-semibold truncate leading-tight ${
                            requiresLogin && !isLoggedIn ? 'text-gray-600' : 'text-gray-900'
                          }`}>
                            {highlightText(result.title, query)}
                          </h3>

                          {/* 登录指示器 */}
                          {requiresLogin && !isLoggedIn && (
                            <FaUser
                              className="w-3 h-3 text-gray-400 ml-1.5 flex-shrink-0"
                              title="需要登录后才能访问"
                            />
                          )}
                        </div>
                      </div>

                      {/* 下行：描述 + 分类信息（仅在悬停或键盘聚焦时显示） */}
                      {(isHovered || isKeyboardHighlighted) && (
                        <div className="mt-1 space-y-1 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
                          {/* 描述 */}
                          {result.description && (
                            <p className={`line-clamp-2 leading-relaxed ${
                              requiresLogin && !isLoggedIn ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {highlightText(result.description, query)}
                            </p>
                          )}

                          {/* 分类信息（只在首页和收藏显示） */}
                          {shouldShowCategory(result.source) && result.metadata?.category && result.metadata?.group && (
                            <div className="flex items-start space-x-1 text-gray-500 min-w-0">
                              <FaTag className="w-3 h-3 flex-shrink-0 mt-0.5" />
                              <span className="break-words">
                                {result.metadata.category} / {result.metadata.group}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <FaSearch className="text-gray-400 text-2xl" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">未找到相关结果</h3>
              <p className="text-sm text-gray-500 mb-4">尝试使用不同的关键词或检查拼写</p>
            </div>
          )}
        </div>

        {/* 底部快捷键提示 */}
        {!loading && results.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 overflow-hidden">
            <div className="flex items-center justify-between text-xs text-gray-500 min-w-0">
              <div className="flex items-center space-x-3 min-w-0 overflow-hidden">
                <span className="flex items-center space-x-1 flex-shrink-0">
                  <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 font-mono text-[10px]">↑↓</kbd>
                  <span>导航</span>
                </span>
                <span className="flex items-center space-x-1 flex-shrink-0">
                  <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 font-mono text-[10px]">Enter</kbd>
                  <span>选择</span>
                </span>
                <span className="flex items-center space-x-1 flex-shrink-0">
                  <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 font-mono text-[10px]">Esc</kbd>
                  <span>关闭</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default SearchResultsDropdown;