import React, { ReactNode, useEffect, useRef, useCallback, useMemo, useState, memo } from 'react';
import Sidebar from './Sidebar';
import FrequentTools from './FrequentTools';
import Footer from './Footer';
import Loading from './ui/Loading';
import { Category, Tool } from '@/types/IndexToolList';
import { useAuth } from '@/hooks/useAuth';
import { useFrequentTools } from '@/hooks/useFrequentTools';
import { USER_DATA_UPDATED_EVENT, STORAGE_KEYS } from '@/constants/storage';

interface LayoutProps {
  children: ReactNode;
  categories: Category[];
  isLoading?: boolean;
  hasError?: boolean;
  onRetry?: () => void;
  useSidebarMargin?: boolean; // 添加新的属性控制是否使用侧边栏边距
  showFrequentTools?: boolean; // 新增属性：控制是否显示常用工具
  useFlowLayout?: boolean; // 新增属性：控制是否使用自然流式布局（Footer跟在内容后面）
  aggregatedTools?: any[]; // 新增属性：同步后的聚合常用工具数据
}

const Layout: React.FC<LayoutProps> = ({
  children,
  categories,
  isLoading = false,
  hasError = false,
  onRetry,
  useSidebarMargin = true, // 默认为true，保持向后兼容
  showFrequentTools = false, // 默认为false，只在首页等需要的地方显示常用工具
  useFlowLayout = false, // 默认为false，保持向后兼容
  aggregatedTools // 聚合工具数据，由父组件传入
}) => {
  // 优先显示本地缓存数据，接口返回后使用接口数据

  // 存储最终展示的工具数据（从 prop 获取，已经在外部计算合并好了）
  const [displayTools, setDisplayTools] = useState<Tool[]>([]);

  // 监听 aggregatedTools prop 变化，直接使用
  useEffect(() => {
    if (aggregatedTools && aggregatedTools.length > 0) {
      setDisplayTools(aggregatedTools);
      console.log('🔄 [Layout] displayTools 更新，数量:', aggregatedTools.length);
    } else {
      setDisplayTools([]);
    }
  }, [aggregatedTools]);

  // 处理工具点击事件
  const handleToolClick = (id: number) => {
    console.log('工具被点击:', id);
  };

  // 根据是否有分类和是否使用侧边栏边距决定内容区域的类名
  const contentClassName = `flex-1 ${(categories && categories.length > 0 && useSidebarMargin) ? 'lg:ml-48' : ''}`;

  // 判断是否显示侧边栏
  const hasSidebar = categories && categories.length > 0 && useSidebarMargin;

  return (
    <>
      {/* 侧边栏容器 - fixed定位，不受主布局影响，固定在Header下方 */}
      {hasSidebar && (
        <div className="hidden lg:block fixed top-20 left-8 z-10">
          <Sidebar 
            categories={categories} 
            className="w-40 h-auto text-center mt-8"
          />
        </div>
      )}
      
      {/* 主内容区域 - 根据是否有侧边栏采用不同布局 */}
      {hasSidebar ? (
        /* 有侧边栏时：不使用sticky footer，简单布局 */
        <div className={contentClassName}>
          <div className="bg-white rounded-t-lg py-4 px-2 sm:px-4 md:px-6 lg:px-8 shadow-sm overflow-x-hidden mt-2 sm:mt-8 mb-2">
            {isLoading ? (
              <div className="py-16 flex flex-col items-center justify-center min-h-[50vh]">
                <Loading title="正在加载精选工具" subtitle="为您准备最实用的开发者资源..." showProgress={true} variant="complex" size="lg" />
              </div>
            ) : hasError ? (
              <div className="py-12 min-h-[50vh] flex items-center justify-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 text-red-500 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">数据加载失败</h3>
                  <p className="text-gray-600 text-center mb-6">抱歉，无法加载数据，请检查您的网络连接。</p>
                  <button 
                    onClick={onRetry} 
                    className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                  >
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      重新加载
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* 常用工具组件 */}
                {showFrequentTools && displayTools.length > 0 && (
                  <div className="-mx-2 sm:-mx-4 md:-mx-6 lg:-mx-8 px-1 sm:px-2 md:px-3 lg:px-4">
                    <FrequentTools tools={displayTools} onToolClick={handleToolClick} categories={categories} />
                  </div>
                )}
                {/* 原有内容 - 使用flex布局确保高度正确 */}
                <div className="flex flex-col h-full">
                  {children}
                </div>
              </>
            )}
          </div>
          <Footer />
        </div>
      ) : useFlowLayout ? (
        /* 无侧边栏时：使用自然流式布局（Footer跟在内容后面），但加载时使用固定布局 */
        isLoading || hasError ? (
          /* 加载或错误状态时：使用固定高度布局，Footer固定在底部 */
          <div className="flex flex-col h-[calc(100vh-5rem)]">
            <div className="bg-white rounded-t-lg shadow-sm overflow-x-hidden mt-2 sm:mt-8 mb-2 flex-1 min-h-0">
              {isLoading ? (
                <div className="py-16 flex flex-col items-center justify-center min-h-[50vh]">
                  <Loading title="正在加载精选工具" subtitle="为您准备最实用的开发者资源..." showProgress={true} variant="complex" size="lg" />
                </div>
              ) : (
                <div className="py-12 min-h-[50vh] flex items-center justify-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 text-red-500 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">数据加载失败</h3>
                    <p className="text-gray-600 text-center mb-6">抱歉，无法加载数据，请检查您的网络连接。</p>
                    <button 
                      onClick={onRetry} 
                      className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                    >
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        重新加载
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
            <Footer />
          </div>
        ) : (
          /* 加载完成后：使用自然流式布局，Footer跟在内容后面 */
          <div>
            <div className="bg-white rounded-t-lg shadow-sm overflow-x-hidden mt-2 sm:mt-8 mb-2">
              {/* 常用工具组件 */}
              {showFrequentTools && displayTools.length > 0 && (
                <div className="px-1 sm:px-2 md:px-3 lg:px-4 pt-4">
                  <FrequentTools tools={displayTools} onToolClick={handleToolClick} categories={categories} />
                </div>
              )}
              {/* 原有内容 */}
              {children}
            </div>
            <Footer />
          </div>
        )
      ) : (
        /* 无侧边栏时：使用固定高度布局 */
        <div className="flex flex-col h-[calc(100vh-5rem)]">
          <div className="bg-white rounded-t-lg shadow-sm overflow-x-hidden mt-2 sm:mt-8 mb-2 flex-1 min-h-0">
            {isLoading ? (
              <div className="py-16 flex flex-col items-center justify-center min-h-[50vh]">
                <Loading title="正在加载精选工具" subtitle="为您准备最实用的开发者资源..." showProgress={true} variant="complex" size="lg" />
              </div>
            ) : hasError ? (
              <div className="py-12 min-h-[50vh] flex items-center justify-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 text-red-500 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">数据加载失败</h3>
                  <p className="text-gray-600 text-center mb-6">抱歉，无法加载数据，请检查您的网络连接。</p>
                  <button 
                    onClick={onRetry} 
                    className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                  >
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      重新加载
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* 常用工具组件 */}
                {showFrequentTools && displayTools.length > 0 && (
                  <div className="px-1 sm:px-2 md:px-3 lg:px-4 pt-4">
                    <FrequentTools tools={displayTools} onToolClick={handleToolClick} categories={categories} />
                  </div>
                )}
                {/* 原有内容 - 使用flex布局确保高度正确 */}
                <div className="flex flex-col h-full">
                  {children}
                </div>
              </>
            )}
          </div>
          <Footer />
        </div>
      )}
    </>
  );
};

export default Layout;