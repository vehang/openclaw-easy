import React, { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface CategoryTabsProps {
  categories: string[];
  onTabChange: (index: number) => void;
  activeTab: number;
  viewAllHref?: string; // 直接传入完整的跳转链接
}

const CategoryTabs: React.FC<CategoryTabsProps> = React.memo(({ 
  categories, 
  onTabChange, 
  activeTab,
  viewAllHref 
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(false);

  // 简单直接的点击处理
  const handleTabClick = useCallback((index: number) => {
    onTabChange(index);
  }, [onTabChange]);

  // 检查是否需要显示滚动按钮
  const checkScrollButtons = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftButton(scrollLeft > 0);
      // 右侧预留查看全部按钮的空间
      setShowRightButton(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, []);

  // 滚动到指定位置
  const scrollTo = useCallback((direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 200;
      const targetScrollLeft = direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

      container.scrollTo({
        left: targetScrollLeft,
        behavior: 'smooth'
      });
    }
  }, []);

  // 监听滚动事件
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      checkScrollButtons();
      container.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);

      return () => {
        container.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, [categories, checkScrollButtons]);

  return (
    <div className="relative border-b border-gray-200 mb-4">
      <div className="flex items-center">
        {/* 左侧滚动按钮 */}
        {showLeftButton && (
          <button
            onClick={() => scrollTo('left')}
            className="absolute left-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-r from-white via-white to-transparent flex items-center justify-center hover:from-gray-50 transition-colors"
            aria-label="向左滚动"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* 滚动容器 - 右侧预留查看全部按钮空间 */}
        <div
          ref={scrollContainerRef}
          className="flex-1 flex overflow-x-auto hide-scrollbar scroll-smooth pr-8"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {categories.map((category, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <span className="self-center text-gray-300 mx-1 flex-shrink-0">|</span>
              )}
              <button
                className={`py-2 px-3 text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors duration-150 ${
                  activeTab === index
                    ? 'text-[#39aba4] border-b-2 border-[#39aba4]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => handleTabClick(index)}
                style={{
                  cursor: 'pointer',
                }}
              >
                {category}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* 右侧滚动按钮 - 紧贴查看全部按钮左侧 */}
        {showRightButton && (
          <button
            onClick={() => scrollTo('right')}
            className="flex-shrink-0 w-6 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="向右滚动"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* 查看全部按钮 - 简洁的 > 图标，固定在最右侧 */}
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="flex-shrink-0 ml-1 p-2 text-gray-400 hover:text-[#39aba4] transition-colors"
            title="查看全部"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>

      {/* 左侧渐变遮罩 */}
      {showLeftButton && (
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white to-transparent pointer-events-none" />
      )}
    </div>
  );
});

CategoryTabs.displayName = 'CategoryTabs';

export default CategoryTabs;