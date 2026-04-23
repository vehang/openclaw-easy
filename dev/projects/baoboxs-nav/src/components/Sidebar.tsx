import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Category } from '@/types/IndexToolList';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import SiteRecommendModal from './SiteRecommendModal';
import ToastContainer from './ui/ToastContainer';
import { useToast } from '@/hooks/useToast';

interface SidebarProps {
  categories: Category[];
  className?: string;
}

interface GroupPopupProps {
  category: Category;
  categoryIndex: number;
  position: { top: number; left: number };
  isOnLeft: boolean; // 弹窗是否在按钮左侧
  onGroupClick: (categoryIndex: number, groupIndex: number, groupName: string) => void;
  onClose: () => void;
}

// 分组弹窗组件
const GroupPopup: React.FC<GroupPopupProps> = ({ category, categoryIndex, position, isOnLeft, onGroupClick, onClose }) => {
  const popupRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭弹窗
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={popupRef}
      className="fixed z-[9999] bg-gray-100 shadow-xl border border-gray-200/60 w-36 overflow-hidden backdrop-blur-sm"
      style={{
        top: position.top,
        left: position.left,
        borderTopLeftRadius: isOnLeft ? '12px' : '0',
        borderBottomLeftRadius: isOnLeft ? '12px' : '12px',
        borderTopRightRadius: isOnLeft ? '0' : '12px',
        borderBottomRightRadius: isOnLeft ? '0' : '12px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* 装饰性渐变边框 */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-gray-50/30 to-gray-200/20 pointer-events-none"
        style={{
          borderTopLeftRadius: isOnLeft ? '12px' : '0',
          borderBottomLeftRadius: isOnLeft ? '12px' : '12px',
          borderTopRightRadius: isOnLeft ? '0' : '12px',
          borderBottomRightRadius: isOnLeft ? '0' : '12px',
        }}
      />

      {/* 内容区域 */}
      <div className="relative">
        {category.glist.map((group, groupIndex) => (
          <button
            key={groupIndex}
            onClick={() => onGroupClick(categoryIndex, groupIndex, group.groupName)}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 transition-all duration-200 ease-out block truncate relative group"
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#39aba4';
              e.currentTarget.style.backgroundColor = 'rgba(57, 171, 164, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#374151';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {/* 悬停时的左侧装饰条 */}
            <div className="absolute left-0 top-0 bottom-0 w-0.5 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-200 ease-out" style={{ backgroundColor: '#39aba4' }} />

            {/* 文字内容 */}
            <span className="relative z-10 font-medium">
              {group.groupName}
            </span>

            {/* 悬停时的右侧箭头指示器 */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <svg className="w-3 h-3" fill="none" stroke="#39aba4" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      {/* 底部装饰性阴影 */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"
      />
    </div>
  );
};

// 常量定义
const POPUP_WIDTH = 144; // 弹窗宽度 (w-36 = 144px)
const POPUP_ITEM_HEIGHT = 40; // 每个分组项的高度 (py-2.5 = 10px*2 + 文字高度约20px)
const POPUP_PADDING = 8; // 弹窗内边距 (增加一些缓冲区域)

const Sidebar: React.FC<SidebarProps> = ({ categories, className = "" }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { toasts, showSuccess, showError, removeToast } = useToast();
  
  // 🚀 优化：使用 useMemo 缓存状态，减少不必要的重新渲染
  const [sidebarState, setSidebarState] = useState({
    activeCategory: '',
    showRecommendModal: false,
    hoveredCategory: null as {
      category: Category;
      categoryIndex: number;
      position: { top: number; left: number };
      buttonRect: DOMRect;
      isOnLeft: boolean;
    } | null
  });

  // 🚀 极简设计：只保留必要的状态
  const refs = useRef({
    lastActiveCategory: '',
    manualScrollTimer: null as NodeJS.Timeout | null,
    hoverTimeoutRef: null as NodeJS.Timeout | null,
    showPopupTimeoutRef: null as NodeJS.Timeout | null,
    isMouseInHoverArea: false,
    lastScrollTime: 0,
    lastScrollY: 0, // 🚀 添加缺失的滚动位置
    isProcessingGroupSwitch: false,
    groupSwitchStartTime: 0,
    // 🎯 极简用户选择保护
    userSelectedTime: 0 // 用户选择的时间戳，0表示无用户选择
  });

  // 🚀 优化：使用 useMemo 缓存计算结果
  const memoizedValues = useMemo(() => ({
    activeCategory: sidebarState.activeCategory,
    hoveredCategory: sidebarState.hoveredCategory
  }), [sidebarState]);

  // 🚀 优化：更新状态的函数，避免频繁的重新渲染
  const updateSidebarState = useCallback((updates: Partial<typeof sidebarState>) => {
    setSidebarState(prev => ({ ...prev, ...updates }));
  }, []);

  // 🎯 极简调试函数
  const debugLog = useCallback((message: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[Sidebar ${timestamp}] ${message}`, data || '');
  }, []);

  // 🚀 增强保护检查：用户选择后5秒内受保护
  const isUserSelectionProtected = useCallback(() => {
    const now = Date.now();
    const timeSinceSelection = now - refs.current.userSelectedTime;
    const isProtected = refs.current.userSelectedTime > 0 && timeSinceSelection < 5000; // 从2秒增加到5秒

    if (isProtected) {
      debugLog('用户选择保护生效', { timeSinceSelection, remainingTime: 5000 - timeSinceSelection });
    }

    return isProtected;
  }, [debugLog]);

  // 🚀 新增：检查元素是否在视口内 - 优化版本
  const isElementInViewport = useCallback((element: Element) => {
    const rect = element.getBoundingClientRect();
    const headerElement = document.querySelector('header');
    const headerHeight = headerElement ? headerElement.getBoundingClientRect().height : 120;

    // 🚀 优化：更宽松的视口检测条件
    // 1. 元素顶部在屏幕可见区域内（header下方）
    const topVisible = rect.top > headerHeight && rect.top < window.innerHeight;

    // 2. 元素底部在屏幕可见区域内，或者至少有一部分在视口内
    const bottomVisible = rect.bottom > headerHeight;

    // 3. 元素有一部分在视口内（顶部或底部可见）
    const partiallyVisible = (rect.top < window.innerHeight && rect.bottom > headerHeight);

    // 🚀 降低可见度阈值到10%，并增加备选条件
    const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, headerHeight);
    const isVisibleEnough = visibleHeight > Math.max(20, rect.height * 0.1); // 至少10%或20px

    // 🚀 最终判断：部分可见即可，或者满足可见度要求
    const isInViewport = partiallyVisible && isVisibleEnough;

    debugLog('视口检测', {
      elementId: element.id,
      rectTop: rect.top.toFixed(0),
      rectBottom: rect.bottom.toFixed(0),
      headerHeight,
      topVisible,
      bottomVisible,
      partiallyVisible,
      isVisibleEnough,
      visibleHeight: visibleHeight.toFixed(0),
      elementHeight: rect.height,
      threshold: Math.max(20, rect.height * 0.1).toFixed(0),
      finalResult: isInViewport
    });

    return isInViewport;
  }, [debugLog]);

  // 计算哪个分类应该被激活 - 🚀 极简版本
  const calculateActiveCategory = useCallback(() => {
    // 🚀 在平滑滚动动画期间完全禁用自动跟随
    if (refs.current.isProcessingGroupSwitch) {
      debugLog('跳过自动跟随计算 - 动画进行中');
      return;
    }

    // 🚀 极简保护：用户选择后2秒内不自动切换
    if (isUserSelectionProtected()) {
      debugLog('用户选择保护期，跳过自动跟随');
      return;
    }

    // 获取Header高度
    const headerElement = document.querySelector('header');
    const headerHeight = headerElement ? headerElement.getBoundingClientRect().height : 120;

    // 获取常用工具区域的准确边界信息
    const frequentToolsElement = document.getElementById('frequent-tools-section');
    let frequentToolsInfo = { height: 0, marginBottom: 0 };

    if (frequentToolsElement) {
      const rect = frequentToolsElement.getBoundingClientRect();
      const styles = window.getComputedStyle(frequentToolsElement);
      frequentToolsInfo = {
        height: rect.height,
        marginBottom: parseFloat(styles.marginBottom) || 24
      };
    }

    // 计算基础触发线位置 - 大幅调整：切换更早
    const baseTriggerLine = headerHeight - 30; // 调整为-30，让切换更早发生

    let activeId = '';
    let closestDistance = Infinity;

    // 🚀 改进的分类选择逻辑：优先选择在视口内的分类
    categories.forEach((category, index) => {
      const categoryId = `category-${index}-${category.cname.replace(/\s+/g, '-').toLowerCase()}`;
      const element = document.getElementById(categoryId);

      if (element) {
        const rect = element.getBoundingClientRect();
        const elementTop = rect.top;

        // 🚀 简化：暂时去掉第一个分类的特殊处理
        const adjustedTop = elementTop;

        // 🚀 简化逻辑：找到最接近触发线的分类
        const distanceToTrigger = Math.abs(adjustedTop - baseTriggerLine);

        // 只考虑已到达或接近触发线的元素 - 大幅扩大触发范围
        if (adjustedTop <= baseTriggerLine + 50 && distanceToTrigger < closestDistance) {
          closestDistance = distanceToTrigger;
          activeId = categoryId;
        }
      }
    });

    // 如果没有找到合适的分类，默认选择第一个可见的
    if (!activeId && categories.length > 0) {
      const firstCategoryId = `category-0-${categories[0].cname.replace(/\s+/g, '-').toLowerCase()}`;
      const firstElement = document.getElementById(firstCategoryId);
      if (firstElement) {
        const rect = firstElement.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          activeId = firstCategoryId;
        }
      }
    }

    // 🚀 极简更新逻辑 + 调试
    if (activeId && activeId !== refs.current.lastActiveCategory) {
      debugLog('🔄 自动跟随更新分类', {
        from: refs.current.lastActiveCategory,
        to: activeId,
        triggerLine: baseTriggerLine,
        closestDistance: closestDistance.toFixed(0)
      });
      refs.current.lastActiveCategory = activeId;
      updateSidebarState({ activeCategory: activeId });
    } else if (!activeId && refs.current.lastActiveCategory !== '') {
      debugLog('🔄 自动跟随清除分类', {
        from: refs.current.lastActiveCategory
      });
      refs.current.lastActiveCategory = '';
      updateSidebarState({ activeCategory: '' });
    }
  }, [categories, updateSidebarState, debugLog, isUserSelectionProtected]);

  // 🚀 优化：节流函数，减少频繁调用
  const throttle = useCallback((func: Function, limit: number) => {
    let inThrottle = false;
    return function (this: any, ...args: any[]) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }, []);

  // 检测用户手动滚动并恢复自动追踪功能
  const handleUserScroll = useCallback(() => {
    const now = Date.now();
    const timeSinceSelection = now - refs.current.userSelectedTime;
    const timeSinceGroupSwitch = now - refs.current.groupSwitchStartTime;

    // 🚀 多重时序保护：确保动画完全结束后才允许清除保护
    if (timeSinceSelection < 1500) {
      // 用户选择后的1.5秒内，绝对不清除保护
      debugLog('用户选择保护期内，绝对保持选择保护', {
        timeSinceSelection,
        timeSinceGroupSwitch
      });
      refs.current.lastScrollTime = now;
      calculateActiveCategory();
      return;
    }

    // 🚀 动画期间保护：如果还在动画中，不清除保护
    if (refs.current.isProcessingGroupSwitch || timeSinceGroupSwitch < 1000) {
      debugLog('动画期间或动画刚结束，保持选择保护', {
        timeSinceSelection,
        timeSinceGroupSwitch,
        isProcessing: refs.current.isProcessingGroupSwitch
      });
      refs.current.lastScrollTime = now;
      calculateActiveCategory();
      return;
    }

    // 🚀 滚动距离检查：只有真正的用户滚动才清除保护
    const currentScrollY = window.scrollY;
    const scrollDistance = Math.abs(currentScrollY - refs.current.lastScrollY);

    if (scrollDistance < 10) {
      // 滚动距离太小，可能是惯性滚动，不清除保护
      debugLog('微小滚动，保持选择保护', { scrollDistance });
      refs.current.lastScrollTime = currentScrollY;
      calculateActiveCategory();
      return;
    }

    // 真正的用户手动滚动，才清除保护
    if (refs.current.userSelectedTime > 0) {
      debugLog('真正的用户手动滚动，清除选择保护', {
        timeSinceSelection,
        scrollDistance,
        lastScrollY: refs.current.lastScrollY,
        currentScrollY
      });
      refs.current.userSelectedTime = 0; // 清除保护
    }

    refs.current.lastScrollTime = currentScrollY;
    calculateActiveCategory();
  }, [calculateActiveCategory]);

  // 🚀 优化：节流后的滚动处理函数
  const throttledScrollHandler = useCallback(
    throttle(handleUserScroll, 100), // 增加节流时间到100ms
    [handleUserScroll, throttle]
  );

  // 滚动事件监听
  useEffect(() => {
    // 初始计算，延迟确保DOM渲染完成
    setTimeout(calculateActiveCategory, 200);

    // 添加滚动监听
    window.addEventListener('scroll', throttledScrollHandler, { passive: true });

    // 添加resize监听
    const handleResize = () => {
      setTimeout(calculateActiveCategory, 300);
    };
    window.addEventListener('resize', handleResize);

         // 监听分组切换完成事件（仅用于非分组切换的情况）
     const handleGroupSwitchComplete = () => {
       // 分组切换完成时，立即重新计算激活分类
       setTimeout(calculateActiveCategory, 100);
     };
     window.addEventListener('SWITCH_TO_GROUP', handleGroupSwitchComplete);

    // 监听常用工具区域的变化
    const observeConfig = { childList: true, subtree: true, attributes: true };
    const observer = new MutationObserver(() => {
      setTimeout(calculateActiveCategory, 100);
    });

    const frequentToolsElement = document.getElementById('frequent-tools-section');
    if (frequentToolsElement) {
      observer.observe(frequentToolsElement, observeConfig);
    }

    return () => {
      window.removeEventListener('scroll', throttledScrollHandler);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('SWITCH_TO_GROUP', handleGroupSwitchComplete);
      observer.disconnect();
      
      // 清理所有定时器
      if (refs.current.manualScrollTimer) {
        clearTimeout(refs.current.manualScrollTimer);
      }
      if (refs.current.hoverTimeoutRef) {
        clearTimeout(refs.current.hoverTimeoutRef);
      }
      if (refs.current.showPopupTimeoutRef) {
        clearTimeout(refs.current.showPopupTimeoutRef);
      }
    };
  }, [categories, throttledScrollHandler, calculateActiveCategory, updateSidebarState]);

  // 统一的菜单切换处理函数
  const handleMenuSwitch = useCallback((categoryId: string, groupInfo?: { categoryIndex: number; groupIndex: number; groupName: string }) => {
    try {
      const element = document.getElementById(categoryId);
      if (!element) {
        console.warn(`⚠️ 未找到目标元素: ${categoryId}`);
        return;
      }

      // 🚀 极简状态管理
      const now = Date.now();
      refs.current.isProcessingGroupSwitch = true;
      refs.current.groupSwitchStartTime = now;
      refs.current.userSelectedTime = now;

      // 立即更新活动类别，提供即时反馈
      debugLog('用户选择分类', {
        categoryId,
        groupInfo: groupInfo?.groupName || '无分组',
        scrollDistance: `待计算`,
        isUserSelected: true
      });

      updateSidebarState({ activeCategory: categoryId });
      refs.current.lastActiveCategory = categoryId;

      // 如果有分组信息，立即触发分组切换事件
      if (groupInfo) {
        const event = new CustomEvent('SWITCH_TO_GROUP', {
          detail: groupInfo
        });
        window.dispatchEvent(event);
        debugLog('触发分组切换事件', groupInfo);
      }

      // 计算精确的滚动位置
      const headerElement = document.querySelector('header');
      const headerHeight = headerElement ? headerElement.getBoundingClientRect().height : 120;

      const elementRect = element.getBoundingClientRect();
      const currentScrollY = window.scrollY;

      // 检查是否是第一个分类，需要考虑常用工具区域
      const isFirstCategory = categoryId.includes('category-0-');
      let additionalOffset = 0;

      if (isFirstCategory) {
        const frequentToolsElement = document.getElementById('frequent-tools-section');
        if (frequentToolsElement) {
          const rect = frequentToolsElement.getBoundingClientRect();
          const styles = window.getComputedStyle(frequentToolsElement);
          const marginBottom = parseFloat(styles.marginBottom) || 24;
          additionalOffset = rect.height + marginBottom;
        }
      }

      // 目标位置：元素顶部 - header高度 - 缓冲区 - 常用工具区域偏移
      let targetScrollY = currentScrollY + elementRect.top - headerHeight - 20 - additionalOffset;
      targetScrollY = Math.max(0, targetScrollY);

      // 🚀 优化：添加安全边界检查
      const maxScrollY = document.documentElement.scrollHeight - window.innerHeight;
      targetScrollY = Math.min(targetScrollY, maxScrollY);

      window.scrollTo({
        top: targetScrollY,
        behavior: 'smooth'
      });

    // 🚀 优化：智能估算动画时间 + 异常处理
    if (refs.current.manualScrollTimer) {
      clearTimeout(refs.current.manualScrollTimer);
    }

    // 智能计算动画时间，考虑多种因素
    const scrollDistance = Math.abs(targetScrollY - currentScrollY);
    const baseTime = 300; // 基础动画时间
    const distanceFactor = Math.min(0.8, Math.max(0.3, scrollDistance / 2000)); // 距离因子
    const estimatedAnimationTime = Math.min(1200, Math.max(600, baseTime + scrollDistance * distanceFactor));

    // 添加性能监控
    const startTime = performance.now();

    refs.current.manualScrollTimer = setTimeout(() => {
      const endTime = performance.now();
      const actualTime = endTime - startTime;

      // 🎯 如果实际动画时间与估算差异过大，动态调整参数
      if (Math.abs(actualTime - estimatedAnimationTime) > estimatedAnimationTime * 0.3) {
        debugLog('动画时间估算偏差', {
          估算: `${estimatedAnimationTime}ms`,
          实际: `${actualTime.toFixed(0)}ms`,
          偏差: `${((actualTime - estimatedAnimationTime) / estimatedAnimationTime * 100).toFixed(1)}%`
        });
      }

      debugLog('菜单切换完成', {
        categoryId,
        动画时长: `${actualTime.toFixed(0)}ms`,
        估算时长: `${estimatedAnimationTime}ms`
      });

      refs.current.isProcessingGroupSwitch = false;
      // 🚀 注意：不清除用户选择标记，让用户选择保持"粘性"
      // 只有当用户选择的分类完全离开视口时才清除（在calculateActiveCategory中处理）

      // 动画结束后立即计算一次正确的激活状态
      setTimeout(calculateActiveCategory, 30); // 稍微缩短恢复延迟
    }, estimatedAnimationTime);

    } catch (error) {
      console.error('❌ 菜单切换处理失败:', error);
      // 确保在异常情况下也能恢复状态
      refs.current.isProcessingGroupSwitch = false;
    }
  }, [updateSidebarState, calculateActiveCategory, debugLog]);

  // 保持向后兼容的滚动函数
  const scrollToSection = useCallback((id: string) => {
    handleMenuSwitch(id);
  }, [handleMenuSwitch]);

  // 处理分组点击 - 使用统一的菜单切换处理函数
  const handleGroupClick = useCallback((categoryIndex: number, groupIndex: number, groupName: string) => {
    // 立即关闭弹窗，避免视觉延迟
    updateSidebarState({ hoveredCategory: null });

    // 清除所有相关定时器
    if (refs.current.hoverTimeoutRef) {
      clearTimeout(refs.current.hoverTimeoutRef);
      refs.current.hoverTimeoutRef = null;
    }
    if (refs.current.showPopupTimeoutRef) {
      clearTimeout(refs.current.showPopupTimeoutRef);
      refs.current.showPopupTimeoutRef = null;
    }

    // 如果在首页，使用统一的菜单切换处理函数
    if (pathname === '/') {
      const categoryId = `category-${categoryIndex}-${categories[categoryIndex].cname.replace(/\s+/g, '-').toLowerCase()}`;
      
      // 使用统一的处理函数，传入分组信息
      handleMenuSwitch(categoryId, {
        categoryIndex,
        groupIndex,
        groupName
      });
    } else {
      // 如果不在首页，先跳转到首页，然后切换分组
      sessionStorage.setItem('pendingGroupSwitch', JSON.stringify({
        categoryIndex,
        groupIndex,
        groupName
      }));

      router.push('/');
    }
  }, [categories, pathname, router, handleMenuSwitch, updateSidebarState]);

  // 检查鼠标是否在悬停区域内（按钮 + 弹窗 + 连接区域）
  const isMouseInHoverZone = useCallback((mouseX: number, mouseY: number, buttonRect: DOMRect, popupRect: { top: number; left: number; width: number; height: number }) => {
    // 按钮区域
    if (mouseX >= buttonRect.left && mouseX <= buttonRect.right &&
      mouseY >= buttonRect.top && mouseY <= buttonRect.bottom) {
      return true;
    }

    // 弹窗区域
    if (mouseX >= popupRect.left && mouseX <= popupRect.left + popupRect.width &&
      mouseY >= popupRect.top && mouseY <= popupRect.top + popupRect.height) {
      return true;
    }

    // 连接区域（按钮和弹窗之间的矩形区域）
    const connectionRect = {
      left: Math.min(buttonRect.right, popupRect.left),
      right: Math.max(buttonRect.right, popupRect.left),
      top: Math.min(buttonRect.top, popupRect.top),
      bottom: Math.max(buttonRect.bottom, popupRect.top + popupRect.height)
    };

    if (mouseX >= connectionRect.left && mouseX <= connectionRect.right &&
      mouseY >= connectionRect.top && mouseY <= connectionRect.bottom) {
      return true;
    }

    return false;
  }, []);

  // 全局鼠标移动监听
  useEffect(() => {
    const handleGlobalMouseMove = (event: MouseEvent) => {
      if (!sidebarState.hoveredCategory) return;

      const popupRect = {
        top: sidebarState.hoveredCategory.position.top,
        left: sidebarState.hoveredCategory.position.left,
        width: POPUP_WIDTH,
        height: sidebarState.hoveredCategory.category.glist.length * POPUP_ITEM_HEIGHT + POPUP_PADDING
      };

      const inHoverZone = isMouseInHoverZone(
        event.clientX,
        event.clientY,
        sidebarState.hoveredCategory.buttonRect,
        popupRect
      );

      if (inHoverZone) {
        refs.current.isMouseInHoverArea = true;
        // 如果鼠标在悬停区域内，清除关闭定时器
        if (refs.current.hoverTimeoutRef) {
          clearTimeout(refs.current.hoverTimeoutRef);
          refs.current.hoverTimeoutRef = null;
        }
      } else {
        refs.current.isMouseInHoverArea = false;
        // 如果鼠标离开悬停区域，启动关闭定时器
        if (!refs.current.hoverTimeoutRef) {
          refs.current.hoverTimeoutRef = setTimeout(() => {
            if (!refs.current.isMouseInHoverArea) {
              updateSidebarState({ hoveredCategory: null });
            }
          }, 150); // 增加延迟到150ms，减少闪烁
        }
      }
    };

    if (sidebarState.hoveredCategory) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [sidebarState.hoveredCategory, isMouseInHoverZone, updateSidebarState]);

  // 处理鼠标悬停
  const handleMouseEnter = useCallback((category: Category, categoryIndex: number, event: React.MouseEvent<HTMLButtonElement>) => {
    // 清除之前的显示弹窗定时器
    if (refs.current.showPopupTimeoutRef) {
      clearTimeout(refs.current.showPopupTimeoutRef);
      refs.current.showPopupTimeoutRef = null;
    }

    // 清除关闭弹窗的定时器
    if (refs.current.hoverTimeoutRef) {
      clearTimeout(refs.current.hoverTimeoutRef);
      refs.current.hoverTimeoutRef = null;
    }

    refs.current.isMouseInHoverArea = true;

    // 检查是否有分组数据
    if (!category.glist || category.glist.length <= 1) {
      return;
    }

    // 立即获取按钮位置，避免在定时器回调中获取时失效
    const buttonRect = event.currentTarget.getBoundingClientRect();

    // 🚀 优化：减少延迟时间，提高响应速度
    refs.current.showPopupTimeoutRef = setTimeout(() => {
      // 在延迟回调中重新检查是否应该显示弹窗
      let shouldSkipPopup = false;

      if (pathname === '/') {
        // 在首页时，检查滚动位置对应的活动分类
        const categoryId = `category-${categoryIndex}-${category.cname.replace(/\s+/g, '-').toLowerCase()}`;
        shouldSkipPopup = sidebarState.activeCategory === categoryId;

        // 额外检查：如果当前没有激活分类但鼠标悬停在第一个分类上，也可能需要跳过
        if (!shouldSkipPopup && !sidebarState.activeCategory && categoryIndex === 0) {
          const firstCategoryElement = document.getElementById(categoryId);
          if (firstCategoryElement) {
            const rect = firstCategoryElement.getBoundingClientRect();
            const headerElement = document.querySelector('header');
            const headerHeight = headerElement ? headerElement.getBoundingClientRect().height : 120;
            if (rect.top <= headerHeight + 50) {
              shouldSkipPopup = true;
            }
          }
        }
      } else {
        // 在其他页面时，检查当前页面是否对应这个菜单项
        const categoryName = category.cname.toLowerCase();

        // 定义页面路径和分类名称的映射关系
        const pathCategoryMap: Record<string, string[]> = {
          '/features/favorites': ['收藏', '书签', 'favorites', '我的收藏'],
          '/features/moyu': ['摸鱼', '娱乐', 'moyu', '休闲娱乐'],
          '/features/bookmarks': ['书签', '收藏', 'bookmarks', '我的收藏'],
        };

        // 检查当前路径是否对应这个分类
        for (const [path, categoryNames] of Object.entries(pathCategoryMap)) {
          if (pathname.startsWith(path)) {
            shouldSkipPopup = categoryNames.some(name =>
              categoryName.includes(name.toLowerCase()) ||
              name.toLowerCase().includes(categoryName)
            );
            break;
          }
        }
      }

      // 如果应该跳过弹窗显示，直接返回
      if (shouldSkipPopup) {
        return;
      }

      const position = {
        top: buttonRect.top,
        left: buttonRect.right, // 紧贴按钮右侧，无间隙
      };

      // 检查弹窗是否会超出屏幕右边界
      let isOnLeft = false;
      if (position.left + POPUP_WIDTH > window.innerWidth) {
        position.left = buttonRect.left - POPUP_WIDTH; // 显示在按钮左侧，无间隙
        isOnLeft = true;
      }

      // 检查弹窗是否会超出屏幕下边界
      const popupHeight = category.glist.length * POPUP_ITEM_HEIGHT + POPUP_PADDING;
      if (position.top + popupHeight > window.innerHeight) {
        position.top = Math.max(10, window.innerHeight - popupHeight - 10);
      }

      updateSidebarState({
        hoveredCategory: {
          category,
          categoryIndex,
          position,
          buttonRect,
          isOnLeft,
        }
      });
    }, 50); // 🚀 优化：减少延迟到50ms
  }, [pathname, sidebarState.activeCategory, categories, updateSidebarState]);

  // 处理鼠标离开按钮
  const handleMouseLeave = useCallback(() => {
    // 清除显示弹窗的定时器（如果还没有显示）
    if (refs.current.showPopupTimeoutRef) {
      clearTimeout(refs.current.showPopupTimeoutRef);
      refs.current.showPopupTimeoutRef = null;
    }

    // 不立即关闭弹窗，让全局鼠标监听器处理
  }, []);

  // 处理推荐按钮点击
  const handleRecommendClick = useCallback(() => {
    updateSidebarState({ showRecommendModal: true });
  }, [updateSidebarState]);

  // 处理推荐弹窗关闭
  const handleRecommendModalClose = useCallback(() => {
    updateSidebarState({ showRecommendModal: false });
  }, [updateSidebarState]);

  // 🚀 优化：使用 useMemo 缓存按钮渲染，减少重新渲染
  const categoryButtons = useMemo(() => {
    return categories.map((category, index) => {
      const categoryId = `category-${index}-${category.cname.replace(/\s+/g, '-').toLowerCase()}`;
      const isActive = sidebarState.activeCategory === categoryId;
      const isHovered = sidebarState.hoveredCategory && sidebarState.hoveredCategory.categoryIndex === index;

      return (
        <button
          key={categoryId}
          onClick={() => {
            console.log('用户点击菜单项，将恢复自动追踪功能');
            scrollToSection(categoryId);
          }}
          onMouseEnter={(e) => handleMouseEnter(category, index, e)}
          onMouseLeave={handleMouseLeave}
          className={`w-full py-1.5 px-3 text-center menu-transition menu-item relative border border-transparent
            ${isActive
              ? 'font-medium text-base rounded'
              : isHovered
                ? `text-gray-700 bg-gray-100 text-sm border-gray-200/50 ${sidebarState.hoveredCategory?.isOnLeft
                  ? 'rounded-lg'
                  : 'rounded-l-lg rounded-r-none border-r-transparent'
                }`
                : 'text-gray-700 hover:bg-gray-100 text-sm rounded menu-hover'}`}
          style={isActive ? {
            color: '#39aba4',
            backgroundColor: 'rgba(57, 171, 164, 0.1)'
          } : {}}
        >
          {category.cname}
        </button>
      );
    });
  }, [categories, sidebarState.activeCategory, sidebarState.hoveredCategory, handleMouseEnter, handleMouseLeave, scrollToSection]);

  return (
    <>
      <aside
        className={`bg-white rounded-lg shadow-sm p-4 ${className}`}
        style={{
          msOverflowStyle: 'none',
          scrollbarWidth: 'none'
        }}>
        <style jsx>{`
          aside::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <div className="space-y-1 flex flex-col items-start w-full">
          {categoryButtons}
        </div>

        {/* 分组弹窗 */}
        {sidebarState.hoveredCategory && (
          <GroupPopup
            category={sidebarState.hoveredCategory.category}
            categoryIndex={sidebarState.hoveredCategory.categoryIndex}
            position={sidebarState.hoveredCategory.position}
            isOnLeft={sidebarState.hoveredCategory.isOnLeft}
            onGroupClick={handleGroupClick}
            onClose={() => updateSidebarState({ hoveredCategory: null })}
          />
        )}

        {/* 推荐按钮区域 */}
        <div className="mt-2 flex flex-col items-center border-t border-gray-200 pt-1 pb-2">
          <button
            onClick={handleRecommendClick}
            className="text-sm text-[#39aba4] hover:text-[#2a8a84] transition-colors cursor-pointer flex items-center gap-1"
          >
            <span className="text-base">「</span>
            我要推荐
            <span className="text-base">」</span>
          </button>
        </div>

        {/* 二维码区域 */}
        <div className="flex flex-col items-center">
          <Image
            src="/icons/qrcode.jpg"
            alt="微信公众号"
            width={100}
            height={100}
            className="mb-2"
          />
          <span className="text-sm text-gray-600">扫码关注公众号</span>
        </div>
      </aside>

      {/* 推荐弹窗 */}
      {sidebarState.showRecommendModal && (
        <SiteRecommendModal
          isOpen={sidebarState.showRecommendModal}
          onClose={handleRecommendModalClose}
          onShowSuccess={showSuccess}
          onShowError={showError}
        />
      )}

      {/* Toast 消息提示 */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </>
  );
};

export default Sidebar;