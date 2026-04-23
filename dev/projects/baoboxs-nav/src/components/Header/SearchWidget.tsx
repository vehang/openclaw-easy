import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FaSearch, FaTimes, FaSpinner } from 'react-icons/fa';
import { usePathname } from 'next/navigation';
import { useSearch } from '@/hooks/useSearch';
import { searchManager } from '@/services/search/SearchManager';
import SearchResultsDropdown from './SearchResultsDropdown';
import LoginModal from '@/components/LoginModal';
import { isUserLoggedIn } from '@/utils/auth';

interface SearchWidgetProps {
  onSearch?: (query: string, engine: string) => void;
}

const SearchWidget: React.FC<SearchWidgetProps> = ({ onSearch }) => {
  const pathname = usePathname();
  const [activeSearchEngine, setActiveSearchEngine] = useState('站内');
  const [searchText, setSearchText] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 根据当前路径确定搜索源 - 使用 useMemo 缓存避免重复计算
  const currentSource = useMemo(() => {
    if (pathname === '/' || pathname.includes('/tools')) return 'home';
    if (pathname.includes('/bookmarks')) return 'bookmarks';
    if (pathname.includes('/favorites')) return 'favorites';
    return 'home';
  }, [pathname]);

  // 缓存 useSearch 的选项，防止不必要的重新初始化
  // 只有在 activeSearchEngine 或 currentSource 真正变化时才更新
  const searchOptions = useMemo(() => ({
    debounceMs: 300,
    enabled: activeSearchEngine === '站内',
    limit: 10,
    source: currentSource
  }), [activeSearchEngine, currentSource]);

  const { results, loading, search, cancel, clear } = useSearch(searchOptions);

  
  const searchEngines = [
    { name: '站内', placeholder: '搜索站内工具、内容...', isLocal: true, width: 60 },
    { name: '百度', placeholder: '请输入您想搜索的内容', url: 'https://www.baidu.com/s?wd=', width: 48 },
    { name: '公众号', placeholder: '搜索公众号文章', url: 'https://weixin.sogou.com/weixin?type=2&query=', width: 60 },
    { name: '知乎', placeholder: '搜索知乎内容', url: 'https://www.zhihu.com/search?q=', width: 48 },
    { name: '翻译', placeholder: '输入要翻译的文本', url: 'https://fanyi.baidu.com/#en/zh/', width: 48 },
    { name: 'Github', placeholder: '搜索Github仓库', url: 'https://github.com/search?q=', width: 70 },
    { name: 'S.O.', placeholder: '搜索Stack Overflow', url: 'https://stackoverflow.com/search?q=', width: 48 }
  ];

  const currentEngine = searchEngines.find(engine => engine.name === activeSearchEngine) || searchEngines[0];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchText.trim()) {
      if (activeSearchEngine === '站内') {
        // 站内手动触发搜索
        search(searchText.trim());
        setShowDropdown(true);
        return;
      }

      if (onSearch) {
        onSearch(searchText.trim(), activeSearchEngine);
      } else {
        window.open(currentEngine.url + encodeURIComponent(searchText.trim()), '_blank');
      }
    }
  };

  const handleTabClick = (engine: string) => {
    setActiveSearchEngine(engine);
    setShowDropdown(false);
    clear();

    // 预加载数据
    if (engine === '站内') {
      searchManager.preloadData();
    }

    // 自动聚焦输入框
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 0);
  };

  // 处理搜索输入
  const handleInputChange = (value: string) => {
    setSearchText(value);

    if (activeSearchEngine === '站内') {
      if (value.trim()) {
        search(value);
        setShowDropdown(true);
      } else {
        clear();
        setShowDropdown(false);
      }
    }
  };

  const clearSearch = () => {
    setSearchText('');
    if (activeSearchEngine === '站内') {
      clear();
      setShowDropdown(false);
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <>
      {/* 搜索引擎选项卡 */}
      <div className="flex bg-[#2e3f4b] rounded-t-md overflow-hidden">
        {searchEngines.map(engine => (
          <button
            key={engine.name}
            className={`px-3 py-1 text-xs ${
              activeSearchEngine === engine.name
                ? `${isClient && isInputFocused ? 'bg-white text-[#39aba4]' : 'bg-gray-100 text-gray-800'} font-medium rounded-t-md`
                : 'text-gray-300 hover:bg-gray-700 hover:rounded-t-md'
            } whitespace-nowrap overflow-hidden overflow-ellipsis transition-colors duration-200`}
            style={{ maxWidth: `${engine.width}px` }}
            onClick={() => handleTabClick(engine.name)}
            title={engine.name}
          >
            {engine.name}
          </button>
        ))}
      </div>
      
      {/* 搜索框 */}
      <div className="relative">
        <form onSubmit={handleSearch}>
          <input
            id="search-input"
            ref={inputRef}
            type="text"
            value={searchText}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => {
              setIsInputFocused(false);
              setTimeout(() => setShowDropdown(false), 200);
            }}
            placeholder={currentEngine.placeholder}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            className={`w-full py-2 pl-4 pr-12 rounded-md rounded-tl-none focus:outline-none border-0 focus:ring-0 focus:border-0 ${
              isClient && isInputFocused ? 'bg-white text-[#2a8a84]' : 'bg-gray-100 text-gray-800'
            } transition-colors duration-200`}
          />

          {/* 清空按钮，只在有内容时显示 */}
          {searchText && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
              title="清空搜索"
            >
              <FaTimes className="text-sm" />
            </button>
          )}

          <button
            type="submit"
            className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center text-gray-500 hover:text-teal-500 bg-transparent hover:bg-gray-50 transition-colors duration-200 rounded-tr-md rounded-br-md"
            title="搜索"
          >
            {loading && activeSearchEngine === '站内' ? (
              <FaSpinner className="animate-spin text-base" />
            ) : (
              <FaSearch className="text-base" />
            )}
          </button>
        </form>

        {/* 搜索结果下拉框 */}
        {isClient && showDropdown && (
          <SearchResultsDropdown
            results={results}
            loading={loading}
            onSelect={(result) => {
              setShowDropdown(false);

              // 检查是否需要登录且用户未登录
              const requiresLogin = (result.metadata?.sw || 0) > 0;
              const isLoggedIn = isUserLoggedIn();

              if (requiresLogin && !isLoggedIn) {
                // 显示登录弹窗，不进行跳转
                setShowLoginModal(true);
                return;
              }

              // 处理结果选择
              // 站内搜索优先跳转到详情页
              if (result.metadata?.sl) {
                // 有短地址则在新标签页打开详情页
                window.open(`/site/${result.metadata.sl}`, '_blank', 'noopener,noreferrer');
              } else {
                // 没有短地址则使用原有跳转逻辑
                const { handleToolClick } = require('@/utils/toolRedirect');

                // 根据当前页面决定跳转方式，而不是搜索结果来源
                if (currentSource === 'home') {
                  // 在主页搜索 → 按主页工具跳转
                  handleToolClick({
                    toolId: parseInt(result.id.replace(/^(home|bookmarks|favorites)_/, '')) || undefined,
                    title: result.title,
                    url: result.url,
                    desc: result.description,
                    img: result.metadata?.imageUrl,
                    sl: result.metadata?.sl,
                    source: 'homepage'
                  });
                } else if (currentSource === 'favorites') {
                  // 在收藏页面搜索 → 按收藏工具跳转
                  handleToolClick({
                    toolId: parseInt(result.id.replace(/^(home|bookmarks|favorites)_/, '')) || undefined,
                    title: result.title,
                    url: result.url,
                    desc: result.description,
                    img: result.metadata?.imageUrl,
                    source: 'favorite',
                    bindId: result.metadata?.groupId // 从metadata获取groupId作为bindId
                  });
                } else if (currentSource === 'bookmarks') {
                  // 在书签页面搜索 → 按书签工具跳转
                  handleToolClick({
                    title: result.title,
                    url: result.url,
                    desc: result.description,
                    img: result.metadata?.imageUrl,
                    source: 'bookmark'
                  });
                } else {
                  // 默认按主页方式处理
                  handleToolClick({
                    toolId: parseInt(result.id.replace(/^(home|bookmarks|favorites)_/, '')) || undefined,
                    title: result.title,
                    url: result.url,
                    desc: result.description,
                    img: result.metadata?.imageUrl,
                    sl: result.metadata?.sl,
                    source: 'homepage'
                  });
                }
              }
            }}
            onClose={() => setShowDropdown(false)}
            query={searchText}
            currentSource={currentSource}
          />
        )}
      </div>

      {/* 登录弹窗 */}
      {showLoginModal && (
        <LoginModal
          onClose={(reason) => {
            setShowLoginModal(false);
            if (reason === 'success') {
              // 登录成功后可以重新聚焦搜索框
              setTimeout(() => {
                if (inputRef.current) inputRef.current.focus();
              }, 0);
            }
          }}
        />
      )}
    </>
  );
};

export default React.memo(SearchWidget); 