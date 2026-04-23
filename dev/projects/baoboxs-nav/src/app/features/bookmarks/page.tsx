"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchUserBookmarks, isLoggedIn } from '@/services/api';
import { QRCodeSVG } from 'qrcode.react';
import { addToFrequentTools } from '@/utils/frequentToolsManager';
import LoginModal from '@/components/LoginModal';
import Loading from '@/components/ui/Loading';
import Footer from '@/components/Footer';
import { getLinkRel } from '@/lib/utils';

// 定义书签数据类型
interface BookmarkItem {
  id: string;
  title: string;
  url?: string;
  dateAdded: number;
  dateLastUsed?: number;
  dateGroupModified?: number; // 添加这个属性
  parentId: string;
  index: number;
  children?: BookmarkItem[];
}

interface BookmarkCollection {
  id: number;
  deviceId: string;
  browserName: string;
  createTime: string;
  lastUploadTime: string;
  bookmarks: {
    id: string;
    title: string;
    dateAdded: number;
    children: BookmarkItem[];
  }[];
}

// 书签文件夹组件
const BookmarkFolder: React.FC<{ 
  folder: BookmarkItem, 
  onSelect: (folderId: string) => void,
  isActive: boolean,
  level?: number, // 添加层级属性
  expandedFolders?: Set<string>, // 添加展开的文件夹集合
  onToggleExpand?: (folderId: string) => void, // 添加切换展开/收起的回调
  selectedFolderId?: string // 添加selectedFolderId属性
}> = ({ folder, onSelect, isActive, level = 0, expandedFolders = new Set(), onToggleExpand, selectedFolderId }) => {
  const hasChildren = folder.children && folder.children.length > 0;
  const isExpanded = expandedFolders.has(folder.id);
  
  return (
    <div>
      <div 
        className={`p-2 cursor-pointer rounded-md hover:bg-gray-100 ${isActive ? 'bg-gray-100 text-[#00bba7]' : 'text-gray-700'} transition-colors duration-200`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onSelect(folder.id)}
      >
        <div className="flex items-center">
          {/* 展开/收起按钮 */}
          {hasChildren && (
            <button 
              className="w-5 h-5 mr-1 flex items-center justify-center text-gray-400 hover:text-gray-700"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand && onToggleExpand(folder.id);
              }}
            >
              {isExpanded ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          )}
          
          {/* 文件夹图标 */}
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${isActive ? 'text-[#00bba7]' : 'text-yellow-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span className="truncate">{folder.title}</span>
        </div>
      </div>
      
      {/* 子文件夹 */}
      {hasChildren && isExpanded && (
        <div>
          {folder.children!.filter(child => child.children && child.children.length > 0).map(childFolder => (
            <BookmarkFolder 
              key={childFolder.id}
              folder={childFolder}
              onSelect={onSelect}
              isActive={selectedFolderId === childFolder.id}
              level={level + 1}
              expandedFolders={expandedFolders}
              onToggleExpand={onToggleExpand}
              selectedFolderId={selectedFolderId} // 传递selectedFolderId
            />
          ))}
        </div>
      )}
    </div>
  );
};

// 添加简化版的文件夹组件，用于右侧列表显示
const BookmarkFolderSimple: React.FC<{ 
  folder: BookmarkItem, 
  onSelect: (folderId: string) => void
}> = ({ folder, onSelect }) => {
  return (
    <div className="block p-3 h-full rounded-lg transition-all duration-200 hover:shadow-xl hover:bg-white group border border-transparent hover:border-gray-100"
      onClick={() => onSelect(folder.id)}>
      <div className="flex">
        <div className="w-6 h-6 relative flex-shrink-0 mt-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>
        <div className="ml-2 flex-1 flex flex-col min-w-0">
          <h3 className="font-medium text-sm text-gray-900 truncate group-hover:text-[#39aba4]">
            {folder.title}
          </h3>
          <p className="text-xs text-gray-500 truncate mt-0.5">文件夹</p>
        </div>
      </div>
    </div>
  );
};

// 书签项组件 - 重新设计为类似SiteCard的样式
const BookmarkLink: React.FC<{ bookmark: BookmarkItem }> = ({ bookmark }) => {
  const [showQRCode, setShowQRCode] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [fallbackIcon, setFallbackIcon] = useState('');
  const [isDescriptionTruncated, setIsDescriptionTruncated] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // 默认图标数组
  const defaultIcons = [
    '/icons/default-icon1.png',
    '/icons/default-icon2.png',
    '/icons/default-icon3.png',
    '/icons/default-icon4.png',
    '/icons/default-icon5.png',
  ];

  // 处理图片加载错误
  const handleImageError = () => {
    // 使用 URL 的 hash 来确保服务端和客户端一致
    const urlHash = bookmark.url ? bookmark.url.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0) : 0;
    const randomIndex = Math.abs(urlHash) % defaultIcons.length;
    setFallbackIcon(defaultIcons[randomIndex]);
    setImageError(true);
  };
  
  // 获取安全的图片源
  const getSafeImageSrc = () => {
    if (imageError && fallbackIcon) {
      return fallbackIcon;
    }
    
    if (bookmark.url && typeof bookmark.url === 'string') {
      try {
        const match = bookmark.url.match(/^(https?:\/\/[^/]+)/);
        if (match && match[1]) {
          return match[1] + '/favicon.ico';
        }
      } catch (error) {
        console.error('Error parsing URL for favicon:', error);
      }
    }
    
    return '/icons/default-icon1.png';
  };
  
  // 检查是否应该渲染图片
  const shouldRenderImage = () => {
    return bookmark.url && bookmark.url.trim() !== '';
  };
  
  // 检测描述文本是否被截断
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkIfTruncated = () => {
      const element = descriptionRef.current;
      if (element) {
        setIsDescriptionTruncated(
          element.scrollWidth > element.clientWidth || 
          element.scrollHeight > element.clientHeight
        );
      }
    };
    
    checkIfTruncated();
    window.addEventListener('resize', checkIfTruncated);
    
    return () => {
      window.removeEventListener('resize', checkIfTruncated);
    };
  }, [bookmark.url]);
  
  // 更新提示框位置
  useEffect(() => {
    if (showQRCode && cardRef.current && typeof window !== 'undefined') {
      const updatePosition = () => {
        const rect = cardRef.current?.getBoundingClientRect();
        if (rect) {
          // 只有当元素可见且有有效位置时才更新
          if (rect.width > 0 && rect.height > 0 && rect.top >= 0) {
            setTooltipPosition({
              top: rect.bottom + 10,
              left: rect.left + rect.width / 2
            });
          } else {
            // 如果元素不可见，隐藏提示框
            setShowQRCode(false);
          }
        }
      };
      
      // 初始更新位置
      updatePosition();
      
      // 监听滚动事件，实时更新位置
      window.addEventListener('scroll', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition);
      };
    }
  }, [showQRCode]);

  // 将书签转换为标准格式并保存使用记录
  const handleBookmarkClick = (e: React.MouseEvent) => {
    if (bookmark.url) {
      e.preventDefault();
      e.stopPropagation();
      
      // 使用新的跳转逻辑
      const { handleToolClick: handleRedirect } = require('@/utils/toolRedirect');
      
      handleRedirect({
        title: bookmark.title || bookmark.url,
        url: bookmark.url,
        desc: bookmark.url,
        img: getSafeImageSrc(),
        source: 'bookmark'
      }, e);
    }
  };

  return (
    <div className="relative" ref={cardRef}>
      <a
        href={bookmark.url}
        target="_blank"
        rel={bookmark.url ? getLinkRel(bookmark.url) : undefined}
        className="block p-3 h-full rounded-lg transition-all duration-200 hover:shadow-xl hover:bg-white group border border-transparent hover:border-gray-100"
        onMouseEnter={() => {
          setIsHovered(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
        }}
        onClick={handleBookmarkClick} // 添加点击事件处理
      >
        <div className="flex">
          <div className="w-6 h-6 relative flex-shrink-0 mt-1">
            {shouldRenderImage() && (
              <img 
                src={getSafeImageSrc()}
                alt={bookmark.title} 
                className="w-full h-full rounded object-cover"
                onError={(e) => {
                  handleImageError();
                }}
              />
            )}
          </div>
          <div className="ml-2 flex-1 flex flex-col min-w-0">
            <h3 className="font-medium text-sm text-gray-900 truncate group-hover:text-[#39aba4]">
              {bookmark.title}
            </h3>
            <p ref={descriptionRef} className="text-xs text-gray-500 line-clamp-1 mt-0.5">{bookmark.url}</p>
          </div>
          
          <div 
            id={`qrcode-btn-${bookmark.id}`}
            className="w-0 group-hover:w-6 flex-shrink-0 overflow-hidden transition-all duration-200 ml-0 group-hover:ml-2 self-center"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowQRCode(!showQRCode);
            }}
            onMouseEnter={(e) => {
              e.stopPropagation();
              setShowQRCode(true);
            }}
            onMouseLeave={(e) => {
              e.stopPropagation();
              setShowQRCode(false);
            }}
          >
            <div className="p-1 hover:bg-gray-100 rounded-full cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
          </div>
        </div>
      </a>
      
      {/* 书签暂时不弹描述 描述提示框 - 只在描述被截断时显示 */}
      {false && isHovered && isDescriptionTruncated && tooltipPosition.top > 0 && tooltipPosition.left > 0 && (
        <div className="fixed z-[100] p-4 bg-white rounded-lg shadow-xl max-w-xs border border-gray-100" style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          transform: 'translateX(-50%)'
        }}>
          <p className="text-sm text-gray-600 break-all overflow-hidden">{bookmark.url}</p>
        </div>
      )}
      
      {/* 二维码弹窗 */}
      {showQRCode && bookmark.url && typeof window !== 'undefined' && (
        <div 
          className="fixed z-50 p-4 bg-white rounded-lg shadow-xl" 
          style={{
            top: 'auto',
            left: 'auto',
            right: `${window.innerWidth - (document.getElementById('qrcode-btn-' + bookmark.id)?.getBoundingClientRect().right || 0)}px`,
            bottom: `${window.innerHeight - (document.getElementById('qrcode-btn-' + bookmark.id)?.getBoundingClientRect().top || 0)}px`
          }}
          onMouseEnter={() => setShowQRCode(true)}
          onMouseLeave={() => setShowQRCode(false)}
        >
          <div className="flex flex-col items-center">
            <QRCodeSVG value={bookmark.url} size={90} />
            <p className="mt-2 text-xs text-gray-600">扫码访问</p>
          </div>
        </div>
      )}
    </div>
  );
};

// 添加简化版的文件夹组件，用于右侧列表显示
const BookmarkFolderCard: React.FC<{ 
  folder: BookmarkItem, 
  onSelect: (folderId: string) => void
}> = ({ folder, onSelect }) => {
  return (
    <div className="relative">
      <div 
        className="block p-3 h-full rounded-lg transition-all duration-200 hover:shadow-xl hover:bg-white group border border-transparent hover:border-gray-100 cursor-pointer"
        onClick={() => onSelect(folder.id)}
      >
        <div className="flex">
          <div className="w-6 h-6 relative flex-shrink-0 mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <div className="ml-2 flex-1 flex flex-col min-w-0">
            <h3 className="font-medium text-sm text-gray-900 truncate group-hover:text-[#39aba4]">
              {folder.title}
            </h3>
            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">文件夹</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function BookmarksPage() {
  const [bookmarkCollections, setBookmarkCollections] = useState<BookmarkCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError,] = useState(false); // 添加加载错误状态
  const [loginIn, setLoginIn] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("0");
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [currentBookmarks, setCurrentBookmarks] = useState<BookmarkItem[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isClient, setIsClient] = useState(false); // 添加客户端标记

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [userManuallyClosedLogin, setUserManuallyClosedLogin] = useState(false); // 跟踪用户是否手动关闭了登录窗口

  // TabsList 横向滚动相关状态
  const tabsScrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftScrollButton, setShowLeftScrollButton] = useState(false);
  const [showRightScrollButton, setShowRightScrollButton] = useState(false);

  // 确保组件在客户端才开始执行关键逻辑
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // 从本地存储读取显示文件夹的状态，默认为true
  const [showFolders, setShowFolders] = useState<boolean>(() => {
    // 检查是否在浏览器环境
    if (typeof window !== 'undefined') {
      const savedValue = localStorage.getItem('bookmarks-show-folders');
      return savedValue !== null ? savedValue === 'true' : true;
    }
    return true;
  });
  

  
  // 切换文件夹展开/收起状态
  const handleToggleExpand = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };
  
  // 切换显示文件夹状态并保存到本地存储
  const handleToggleShowFolders = () => {
    setShowFolders(prev => {
      const newValue = !prev;
      // 保存到本地存储
      if (typeof window !== 'undefined') {
        localStorage.setItem('bookmarks-show-folders', newValue.toString());
      }
      return newValue;
    });
  };

  // TabsList 滚动相关函数
  // 检查是否需要显示滚动按钮
  const checkTabsScrollButtons = () => {
    const container = tabsScrollContainerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftScrollButton(scrollLeft > 0);
      setShowRightScrollButton(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  // 滚动到指定位置
  const scrollTabsTo = (direction: 'left' | 'right') => {
    const container = tabsScrollContainerRef.current;
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
  };
  
  // 添加一个函数来处理标签页切换
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    
    // 查找对应的书签集合
    const selectedCollection = bookmarkCollections.find(
      collection => collection.id.toString() === tabId
    );
    
    if (selectedCollection && selectedCollection.bookmarks && selectedCollection.bookmarks.length > 0) {
      const rootBookmarks = selectedCollection.bookmarks[0];
      if (rootBookmarks && rootBookmarks.children && rootBookmarks.children.length > 0) {
        // 默认展开第一级文件夹
        const topLevelFolders = rootBookmarks.children
          .filter(item => item.children && item.children.length > 0)
          .map(folder => folder.id);
        
        setExpandedFolders(new Set(topLevelFolders));
        
        // 修改这里：优先选择第一个有子项的文件夹，如果没有则选择第一个文件夹
        const firstFolder = rootBookmarks.children.find(item => item.children && item.children.length > 0) || 
                           (rootBookmarks.children.length > 0 ? rootBookmarks.children[0] : null);
        
        if (firstFolder) {
          setSelectedFolderId(firstFolder.id);
          setCurrentBookmarks(firstFolder.children || []);
        } else {
          // 如果没有找到任何文件夹，则显示根目录下的所有书签
          setSelectedFolderId(rootBookmarks.id);
          setCurrentBookmarks(rootBookmarks.children || []);
        }
      } else if (rootBookmarks && rootBookmarks.children) {
        // 如果根目录没有子文件夹但有书签，直接显示根目录内容
        setSelectedFolderId(rootBookmarks.id);
        setCurrentBookmarks(rootBookmarks.children);
      }
    }
  };

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      setLoadError(false); // 清除之前的错误
      
      // 先检查本地是否有token，避免不必要的请求
      const hasValidToken = await isLoggedIn();
      
      if (!hasValidToken) {
        // 没有token，直接显示登录窗口，不发请求
        setLoginIn(false);
        setLoading(false);
        setLoadError(true);
        if (!userManuallyClosedLogin) {
          setShowLoginModal(true);
        }
        return;
      }
      
      // 有token，尝试加载数据
      try {
        const data = await fetchBookmarks();
        setBookmarkCollections(data);
        setLoginIn(true); // 加载成功说明已登录
        setUserManuallyClosedLogin(false); // 重置手动关闭标记
        
        // 默认选择第一个集合
        if (data && data.length > 0) {
          const firstCollection = data[0];
          setActiveTab(firstCollection.id.toString());
          
          // 初始化展开的文件夹和选中的文件夹
          if (firstCollection.bookmarks && firstCollection.bookmarks.length > 0) {
            const rootBookmarks = firstCollection.bookmarks[0];
            if (rootBookmarks && rootBookmarks.children && rootBookmarks.children.length > 0) {
              // 默认展开第一级文件夹
              const topLevelFolders = rootBookmarks.children
                .filter(item => item.children && item.children.length > 0)
                .map(folder => folder.id);
              
              setExpandedFolders(new Set(topLevelFolders));
              
              // 选择第一个有子项的文件夹
              const firstFolder = rootBookmarks.children.find(item => item.children && item.children.length > 0) || 
                                 (rootBookmarks.children.length > 0 ? rootBookmarks.children[0] : null);
              
              if (firstFolder) {
                setSelectedFolderId(firstFolder.id);
                setCurrentBookmarks(firstFolder.children || []);
              } else {
                setSelectedFolderId(rootBookmarks.id);
                setCurrentBookmarks(rootBookmarks.children || []);
              }
            }
          }
        }
      } catch (error: any) {
        // 如果是认证错误，说明token无效，显示登录窗口
        if (error.code === 9996 || error.message?.includes('未登录') || error.message?.includes('登录')) {
          setLoginIn(false);
          if (!userManuallyClosedLogin) {
            setShowLoginModal(true);
          }
          setLoadError(true);
        } else {
          // 其他错误直接显示
          setLoginIn(true);
          setLoadError(true);
          console.error("加载书签失败:", error);
        }
      }
    } catch (error) {
      setLoadError(true); // 重置错误状态
      console.error("加载书签失败:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (isClient) {
      loadBookmarks();
    }
  }, [isClient]); // 依赖 isClient 确保只在客户端执行

  // 监听TabsList滚动事件
  useEffect(() => {
    const container = tabsScrollContainerRef.current;
    if (container) {
      checkTabsScrollButtons();
      container.addEventListener('scroll', checkTabsScrollButtons);
      window.addEventListener('resize', checkTabsScrollButtons);
      
      return () => {
        container.removeEventListener('scroll', checkTabsScrollButtons);
        window.removeEventListener('resize', checkTabsScrollButtons);
      };
    }
  }, [bookmarkCollections]); // 当书签集合变化时重新检查

  // 监听登录成功事件，重新加载数据
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleLoginSuccess = () => {
      console.log('书签页接收到登录成功事件，重新加载数据');
      loadBookmarks();
    };
    
    window.addEventListener('LOGIN_SUCCESS_RELOAD_DATA', handleLoginSuccess);
    
    return () => {
      window.removeEventListener('LOGIN_SUCCESS_RELOAD_DATA', handleLoginSuccess);
    };
  }, []);  // 空依赖数组，避免重复绑定

  // 查找并设置当前选中文件夹的书签
  const handleFolderSelect = (folderId: string) => {
    setSelectedFolderId(folderId);
    
    // 在当前活动的书签集合中查找选中的文件夹
    const activeCollection = bookmarkCollections.find(
      collection => collection.id.toString() === activeTab
    );
    
    if (!activeCollection) return;
    
    // 递归查找文件夹
    const findFolder = (items: BookmarkItem[]): BookmarkItem | null => {
      for (const item of items) {
        if (item.id === folderId) {
          return item;
        }
        if (item.children) {
          const found = findFolder(item.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    // 递归查找文件夹的父文件夹路径
    const findFolderPath = (items: BookmarkItem[], targetId: string, path: string[] = []): string[] | null => {
      for (const item of items) {
        if (item.id === targetId) {
          return [...path, item.id];
        }
        if (item.children) {
          const foundPath = findFolderPath(item.children, targetId, [...path, item.id]);
          if (foundPath) return foundPath;
        }
      }
      return null;
    };
    
    // 从根书签开始查找
    const rootBookmarks = activeCollection.bookmarks && activeCollection.bookmarks[0];
    if (rootBookmarks && rootBookmarks.children) {
      // 查找选中文件夹
      const folder = findFolder(rootBookmarks.children);
      
      // 查找文件夹路径并展开所有父文件夹
      const folderPath = findFolderPath(rootBookmarks.children, folderId);
      if (folderPath && folderPath.length > 0) {
        // 展开路径上的所有文件夹（除了最后一个，即当前选中的文件夹）
        setExpandedFolders(prev => {
          const newSet = new Set(prev);
          folderPath.forEach(id => {
            newSet.add(id);
          });
          return newSet;
        });
      }
      
      if (folder && folder.children) {
        setCurrentBookmarks(folder.children);
      } else {
        setCurrentBookmarks([]);
      }
    }
  };

  // 获取当前标签页的所有文件夹
  const getFolders = (collection: BookmarkCollection): BookmarkItem[] => {
    if (!collection.bookmarks || !collection.bookmarks[0] || !collection.bookmarks[0].children) return [];
    
    // 只返回顶层文件夹，子文件夹通过展开/收起功能显示
    return collection.bookmarks[0].children.filter(item => item.children && item.children.length > 0);
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-80px)] flex flex-col bg-gray-100 overflow-hidden">
        {/* 中间内容区域 - 占据Header和Footer之间的所有剩余空间 */}
        <div className="flex-1 flex flex-col items-center justify-center pt-6">
          <Loading title="正在加载书签数据" subtitle="随时随地都能用上您的宝贝书签..." />
        </div>
        {/* 底部Footer - 固定高度 */}
        <div className="flex-shrink-0">
          <Footer />
        </div>
      </div>
    );
  }
  
  // 添加加载失败的状态处理
  if (loadError) {
    if(!loginIn){
      return (
        <div className="h-[calc(100vh-80px)] flex flex-col bg-gray-100 overflow-hidden">
          {/* 登录弹窗 */}
          {showLoginModal && (
            <LoginModal onClose={(reason) => {
              setShowLoginModal(false);
              if (reason === 'success') {
                // 登录成功后重新加载数据
                loadBookmarks();
                setUserManuallyClosedLogin(false); // 重置手动关闭标记
              } else if (reason === 'manual') {
                // 用户手动关闭，设置标记避免再次弹出
                setUserManuallyClosedLogin(true);
              }
            }} />
          )}
          
          {/* 中间内容区域 - 占据Header和Footer之间的所有剩余空间 */}
          <div className="flex-1 flex flex-col items-center justify-center pt-6">
            <button 
              onClick={() => {
                setUserManuallyClosedLogin(false); // 重置手动关闭标记
                setShowLoginModal(true); // 显示登录窗口
              }}
              className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                点击登录
              </div>
            </button>
            <p className="text-gray-600 text-center mb-6">登录同步最新书签信息</p>
          </div>
          
          {/* 底部Footer - 固定高度 */}
          <div className="flex-shrink-0">
            <Footer />
          </div>
        </div>
      );
    }else{
      return (
        <div className="h-[calc(100vh-80px)] flex flex-col bg-gray-100 overflow-hidden">
          {/* 中间内容区域 - 占据Header和Footer之间的所有剩余空间 */}
          <div className="flex-1 flex flex-col items-center justify-center pt-6">
            <div className="w-16 h-16 text-red-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">数据加载失败</h3>
            <p className="text-gray-600 text-center mb-6">抱歉，无法加载数据，请稍后重试...</p>
            <button 
              onClick={loadBookmarks}
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
          
          {/* 底部Footer - 固定高度 */}
          <div className="flex-shrink-0">
            <Footer />
          </div>
        </div>
      );
    }
  }

  // 固定三部分布局：Header + 中间区域 + Footer，整个页面不出现滚动条
  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-gray-100 overflow-hidden">
      {/* 中间内容区域 - 占据Header和Footer之间的所有剩余空间 */}
      <div className="flex-1 flex flex-col px-4 md:px-6 pt-6 pb-4 max-w-screen-1xl mx-auto w-full min-h-0 overflow-hidden">
        {bookmarkCollections.length > 0 ? (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full h-full flex flex-col min-h-0">
          {/* 顶部标签和按钮区域 - 固定高度 */}
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative min-w-0 overflow-hidden bg-gray-100 p-1 rounded-lg">
                {/* 左侧滚动按钮 */}
                {showLeftScrollButton && (
                  <button
                    onClick={() => scrollTabsTo('left')}
                    className="absolute left-1 top-1/2 transform -translate-y-1/2 z-10 w-6 h-6 bg-gradient-to-r from-gray-100 via-gray-100 to-transparent flex items-center justify-center hover:from-gray-200 transition-colors rounded"
                    aria-label="向左滚动"
                  >
                    <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}

                {/* 右侧滚动按钮 */}
                {showRightScrollButton && (
                  <button
                    onClick={() => scrollTabsTo('right')}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 z-10 w-6 h-6 bg-gradient-to-l from-gray-100 via-gray-100 to-transparent flex items-center justify-center hover:from-gray-200 transition-colors rounded"
                    aria-label="向右滚动"
                  >
                    <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}

                {/* 滚动容器 */}
                <div 
                  ref={tabsScrollContainerRef}
                  className="flex overflow-x-auto hide-scrollbar scroll-smooth"
                  style={{
                    scrollbarWidth: 'none', // Firefox
                    msOverflowStyle: 'none', // IE and Edge
                  }}
                >
                  <TabsList className="bg-transparent p-0 flex">
                {bookmarkCollections.map(collection => (
                  <TabsTrigger 
                    key={collection.id} 
                    value={collection.id.toString()}
                        className="px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#00bba7] whitespace-nowrap flex-shrink-0 mr-1 last:mr-0"
                  >
                    {collection.browserName}
                  </TabsTrigger>
                ))}
              </TabsList>
                </div>

                {/* 左侧渐变遮罩 */}
                {showLeftScrollButton && (
                  <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-gray-100 to-transparent pointer-events-none rounded-l" />
                )}

                {/* 右侧渐变遮罩 */}
                {showRightScrollButton && (
                  <div className="absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-l from-gray-100 to-transparent pointer-events-none rounded-r" />
                )}
              </div>
            </div>
            
            <div className="flex gap-2 flex-shrink-0">
              <button 
                className="hidden md:flex bg-gradient-to-r from-[#00bba7] to-[#00a593] hover:from-[#00a593] hover:to-[#009080] text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-md hover:shadow-lg items-center gap-2 group"
                onClick={() => window.location.href = '/bookmarks/sync-tutorial'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                同步书签
              </button>
            </div>
          </div>
          
          {/* 主内容区域 - 占据剩余空间并允许内部滚动 */}
          {bookmarkCollections.map(collection => (
            <TabsContent key={collection.id} value={collection.id.toString()} className="flex-1 min-h-0 overflow-hidden">
              <div className="flex gap-4 h-full min-h-0">
                {/* 左侧文件夹列表 - 固定宽度，内容可滚动 */}
                <div className="hidden lg:block w-1/6 rounded-lg bg-white shadow-sm flex flex-col min-h-0 max-h-full">
                  {/* 左侧头部 - 固定 */}
                  <div className="flex-shrink-0 p-4 border-b border-gray-200">
                    <div className="flex items-center gap-4">
                    <h3 className="font-medium text-gray-700 truncate">目录</h3>
                    </div>
                    <div className="mt-2">
                      <span className="text-xs text-gray-500 truncate block">
                          同步于：{new Date(collection.lastUploadTime).toLocaleString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false
                          })}
                    </span>
                  </div>
                  </div>
                  
                   {/* 左侧滚动区域 */}
                   <div 
                     className="flex-1 min-h-0 max-h-full overflow-y-auto overflow-x-hidden p-4 elegant-scrollbar"
                     style={{
                       scrollbarWidth: 'thin',
                       scrollbarColor: 'rgba(0, 187, 167, 0.6) transparent'
                     }}
                   >
                     <div className="space-y-1">
                    {getFolders(collection).map(folder => (
                      <BookmarkFolder 
                        key={folder.id} 
                        folder={folder} 
                        onSelect={handleFolderSelect}
                        isActive={selectedFolderId === folder.id}
                        expandedFolders={expandedFolders}
                        onToggleExpand={handleToggleExpand}
                        selectedFolderId={selectedFolderId}
                      />
                    ))}
                     </div>
                  </div>
                </div>
                
                {/* 右侧书签列表 - 弹性宽度，内容可滚动 */}
                <div className="w-full lg:w-5/6 rounded-lg bg-white shadow-sm flex flex-col min-h-0 max-h-full">
                  {/* 右侧头部 - 固定 */}
                  <div className="flex-shrink-0 p-4 border-b border-gray-200">
                    <div className="flex justify-between items-end">
                      <div className="flex items-end gap-4">
                      <h3 className="font-medium text-gray-700 truncate">书签列表</h3>
                      <div className="text-sm text-gray-500 flex items-end flex-wrap">
                      {(() => {
                        // 递归查找当前文件夹的路径
                        const findFolderPathWithItems = (items: BookmarkItem[], targetId: string, path: BookmarkItem[] = []): BookmarkItem[] | null => {
                          for (const item of items) {
                            if (item.id === targetId) {
                              return [...path, item];
                            }
                            if (item.children) {
                              const foundPath = findFolderPathWithItems(item.children, targetId, [...path, item]);
                              if (foundPath) return foundPath;
                            }
                          }
                          return null;
                        };
                        
                        // 获取当前活动的书签集合
                        const activeCollection = bookmarkCollections.find(
                          collection => collection.id.toString() === activeTab
                        );
                        
                        if (!activeCollection || !selectedFolderId) return null;
                        
                        // 从根书签开始查找路径
                        const rootBookmarks = activeCollection.bookmarks[0];
                        if (!rootBookmarks.children) return null;
                        
                        const folderPath = findFolderPathWithItems(rootBookmarks.children, selectedFolderId);
                        
                        if (!folderPath) return null;
                        
                        // 渲染路径
                        return (
                          <>
                            {folderPath.map((folder, index) => (
                              <React.Fragment key={folder.id}>
                                <span 
                                  className="hover:text-[#00bba7] cursor-pointer" 
                                  onClick={() => handleFolderSelect(folder.id)}
                                >
                                  {folder.title}
                                </span>
                                {index < folderPath.length - 1 && (
                                  <span className="mx-1 text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </span>
                                )}
                              </React.Fragment>
                            ))}
                          </>
                        );
                      })()}
                    </div>
                    </div>
                    <div className="hidden lg:flex lg:items-center lg:truncate">
                      <span className="text-sm text-gray-500 mr-2">显示文件夹</span>
                      <button 
                        className={`w-10 h-5 rounded-full flex items-center transition-colors duration-300 focus:outline-none ${showFolders ? 'bg-[#00bba7] justify-end' : 'bg-gray-300 justify-start'}`}
                        onClick={handleToggleShowFolders}
                      >
                        <span className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${showFolders ? 'translate-x-0.5' : '-translate-x-0.5'}`}></span>
                      </button>
                    </div>
                  </div>
                  </div>
                  
                   {/* 右侧滚动区域 */}
                   <div 
                     className="flex-1 min-h-0 max-h-full overflow-y-auto overflow-x-hidden p-4 elegant-scrollbar"
                     style={{
                       scrollbarWidth: 'thin',
                       scrollbarColor: 'rgba(0, 187, 167, 0.6) transparent'
                     }}
                   >
                  {currentBookmarks.length > 0 ? (
                       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 pb-4">
                        {/* 根据屏幕大小和showFolders状态决定是否显示文件夹 */}
                        {((typeof window !== 'undefined' && window.innerWidth >= 1024 && showFolders) || 
                          (typeof window !== 'undefined' && window.innerWidth < 1024)) && 
                          currentBookmarks
                            .filter(bookmark => !bookmark.url)
                            .map(bookmark => (
                              <div key={bookmark.id} className="rounded hover:bg-white hover:shadow-md transition-all duration-200">
                                <BookmarkFolderCard 
                                  folder={bookmark} 
                                  onSelect={handleFolderSelect}
                                />
                              </div>
                            ))}
                        
                        {/* 书签链接始终显示 */}
                        {currentBookmarks
                          .filter(bookmark => bookmark.url)
                          .map(bookmark => (
                            <div key={bookmark.id} className="rounded hover:bg-white hover:shadow-md transition-all duration-200">
                              <BookmarkLink bookmark={bookmark} />
                            </div>
                          ))}
                    </div>
                  ) : (
                       <div className="h-full flex items-center justify-center text-center">
                      <div className="max-w-md mx-auto px-6">
                        {/* 书签图标 */}
                        <div className="w-24 h-24 mx-auto mb-8 text-gray-300">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </div>
                        
                        {/* 主标题 */}
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                          我的书签
                        </h2>
                        
                        {/* 描述文字 */}
                        <p className="text-gray-600 text-base leading-relaxed mb-8">
                          将您的浏览器书签同步到这里，<br/>
                          在任何设备上都能快速访问您喜爱的网站。<br/>
                          支持Chrome、Edge等主流浏览器的书签同步。
                        </p>
                        
                        {/* 操作按钮 */}
                        <button 
                          onClick={() => window.location.href = '/bookmarks/sync-tutorial'}
                          className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-[#00bba7] to-[#00a593] hover:from-[#00a593] hover:to-[#009080] text-white rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          开始同步书签
                        </button>
                        
                        {/* 特性说明 */}
                        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-[#00bba7] bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                              <svg className="w-4 h-4 text-[#00bba7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">自动同步</h4>
                              <p className="text-sm text-gray-600">实时同步浏览器书签，无需手动导入</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-[#00bba7] bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                              <svg className="w-4 h-4 text-[#00bba7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">多设备访问</h4>
                              <p className="text-sm text-gray-600">电脑、手机、平板随时随地访问</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-[#00bba7] bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                              <svg className="w-4 h-4 text-[#00bba7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">安全可靠</h4>
                              <p className="text-sm text-gray-600">数据加密存储，隐私安全有保障</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                   </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="max-w-lg mx-auto text-center px-6">
              {/* 书签图标 */}
              <div className="w-24 h-24 mx-auto mb-8 text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              
              {/* 主标题 */}
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                我的书签
              </h2>
              
              {/* 描述文字 */}
              <p className="text-gray-600 text-base leading-relaxed mb-8">
                将您的浏览器书签同步到这里，<br/>
                在任何设备上都能快速访问您喜爱的网站。<br/>
                支持Chrome、Edge等主流浏览器的书签同步。
              </p>
              
              {/* 操作按钮 */}
              <button 
                onClick={() => window.location.href = '/bookmarks/sync-tutorial'}
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-[#00bba7] to-[#00a593] hover:from-[#00a593] hover:to-[#009080] text-white rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                开始同步书签
              </button>
              
              {/* 特性说明 */}
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-[#00bba7] bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-[#00bba7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">自动同步</h4>
                    <p className="text-sm text-gray-600">实时同步浏览器书签，无需手动导入</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-[#00bba7] bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-[#00bba7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">多设备访问</h4>
                    <p className="text-sm text-gray-600">电脑、手机、平板随时随地访问</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-[#00bba7] bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-[#00bba7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">安全可靠</h4>
                    <p className="text-sm text-gray-600">数据加密存储，隐私安全有保障</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 底部Footer - 固定高度 */}
      <div className="flex-shrink-0">
        <Footer />
      </div>
    </div>
  );
}

// 从API获取书签数据
const fetchBookmarks = async (): Promise<BookmarkCollection[]> => {
  try {
    // 调用API获取书签数据
    const result = await fetchUserBookmarks();
    
    // 检查响应状态码
    if (result.code !== 0) {
      console.error('获取书签失败:', result.errorMsg);
      throw new Error(result.errorMsg);
    }
    
    // 返回API响应中的数据
    return result.data;
  } catch (error) {
    console.error('获取书签数据出错:', error);
    // 发生错误时返回空数组
    //return [];
    throw error;
  }
};