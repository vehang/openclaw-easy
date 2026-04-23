'use client';

import { useEffect } from 'react';

// 扩展 HTMLElement 类型以支持自定义属性
interface HTMLElementWithScrollTimeout extends HTMLElement {
  scrollTimeout?: NodeJS.Timeout;
  scrollAnimationFrame?: number;
}

// Edge浏览器滚动条优化Hook
export const useEdgeScrollbarOptimization = () => {
  useEffect(() => {
    // 检测是否为Edge浏览器
    const isEdge = /Edg/.test(navigator.userAgent) || 
                  /Edge/.test(navigator.userAgent) ||
                  window.navigator.userAgent.includes('Edg');
    
    if (isEdge) {
      // 为Edge浏览器添加特殊样式
      const style = document.createElement('style');
      style.textContent = `
        /* Edge浏览器强制细滚动条 */
        .group-scrollbar::-webkit-scrollbar {
          width: 0px !important;
        }
        
        .ultra-thin-scrollbar::-webkit-scrollbar {
          width: 0px !important;
        }
        
        /* 隐藏Edge的默认滚动条 */
        .group-scrollbar,
        .ultra-thin-scrollbar {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        
        /* 创建自定义滚动条指示器 */
        .group-scrollbar::after {
          content: '';
          position: absolute;
          right: 0;
          top: 0;
          width: 1px;
          height: 100%;
          background: rgba(0, 187, 167, 0.3);
          pointer-events: none;
          z-index: 1000;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .ultra-thin-scrollbar::after {
          content: '';
          position: absolute;
          right: 0;
          top: 0;
          width: 2px;
          height: 100%;
          background: rgba(0, 187, 167, 0.4);
          pointer-events: none;
          z-index: 1000;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        /* 悬停时显示滚动条指示器 */
        .group-scrollbar:hover::after,
        .ultra-thin-scrollbar:hover::after {
          opacity: 1;
        }
        
        /* 滚动时显示滚动条指示器 */
        .group-scrollbar.scrolling::after,
        .ultra-thin-scrollbar.scrolling::after {
          opacity: 1;
        }
      `;
      
      document.head.appendChild(style);
      
      // 添加滚动事件监听器
      const handleScroll = (e: Event) => {
        const target = e.target as HTMLElementWithScrollTimeout;
        if (target.classList.contains('group-scrollbar') ||
            target.classList.contains('ultra-thin-scrollbar')) {
          target.classList.add('scrolling');
          clearTimeout(target.scrollTimeout);
          target.scrollTimeout = setTimeout(() => {
            target.classList.remove('scrolling');
          }, 1000);
        }
      };
      
      document.addEventListener('scroll', handleScroll, true);
      
      return () => {
        document.head.removeChild(style);
        document.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, []);
};

// Edge浏览器检测工具
export const detectEdgeBrowser = () => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent;
  return /Edg/.test(userAgent) || 
         /Edge/.test(userAgent) ||
         userAgent.includes('Edg');
};

// Edge滚动条样式组件
export const EdgeScrollbarStyle = () => {
  useEffect(() => {
    if (detectEdgeBrowser()) {
      const style = document.createElement('style');
      style.id = 'edge-scrollbar-style';
      style.textContent = `
        /* Edge浏览器滚动条完全隐藏 */
        .group-scrollbar::-webkit-scrollbar,
        .ultra-thin-scrollbar::-webkit-scrollbar {
          width: 0px !important;
          height: 0px !important;
        }
        
        .group-scrollbar,
        .ultra-thin-scrollbar {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        
        /* 创建动态滚动条指示器 */
        .group-scrollbar,
        .ultra-thin-scrollbar {
          position: relative;
        }
        
        /* 滚动条轨道 */
        .group-scrollbar::before {
          content: '';
          position: absolute;
          right: 0;
          top: 0;
          width: 1px;
          height: 100%;
          background: rgba(0, 187, 167, 0.1);
          pointer-events: none;
          z-index: 1000;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .ultra-thin-scrollbar::before {
          content: '';
          position: absolute;
          right: 0;
          top: 0;
          width: 2px;
          height: 100%;
          background: rgba(0, 187, 167, 0.1);
          pointer-events: none;
          z-index: 1000;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        /* 滚动条滑块 - 使用CSS变量动态调整 */
        .group-scrollbar::after {
          content: '';
          position: absolute;
          right: 0;
          top: var(--scrollbar-top, 0px);
          width: 1px;
          height: var(--scrollbar-height, 20px);
          background: rgba(0, 187, 167, 0.6);
          pointer-events: none;
          z-index: 1001;
          opacity: var(--scrollbar-opacity, 0);
          transition: all 0.3s ease;
          border-radius: 0.5px;
        }
        
        .ultra-thin-scrollbar::after {
          content: '';
          position: absolute;
          right: 0;
          top: var(--scrollbar-top, 0px);
          width: 2px;
          height: var(--scrollbar-height, 30px);
          background: rgba(0, 187, 167, 0.6);
          pointer-events: none;
          z-index: 1001;
          opacity: var(--scrollbar-opacity, 0);
          transition: all 0.3s ease;
          border-radius: 1px;
        }
        
        /* 悬停和滚动时显示 */
        .group-scrollbar:hover::before,
        .ultra-thin-scrollbar:hover::before,
        .group-scrollbar.scrolling::before,
        .ultra-thin-scrollbar.scrolling::before {
          opacity: 1;
        }
        
        .group-scrollbar:hover::after,
        .ultra-thin-scrollbar:hover::after,
        .group-scrollbar.scrolling::after,
        .ultra-thin-scrollbar.scrolling::after {
          opacity: 1;
        }
      `;
      
      // 移除旧的样式
      const oldStyle = document.getElementById('edge-scrollbar-style');
      if (oldStyle) {
        oldStyle.remove();
      }
      
      document.head.appendChild(style);
      
      // 创建动态滚动条更新函数
      const updateScrollbarPosition = (element: HTMLElement) => {
        const scrollTop = element.scrollTop;
        const scrollHeight = element.scrollHeight;
        const clientHeight = element.clientHeight;
        
        if (scrollHeight <= clientHeight) {
          // 内容不需要滚动，隐藏滚动条
          element.style.setProperty('--scrollbar-opacity', '0');
          element.style.setProperty('--scrollbar-top', '0px');
          element.style.setProperty('--scrollbar-height', '0px');
          return;
        }
        
        // 计算滚动条大小（滑块高度）
        // 滑块高度 = 容器高度 * (容器高度 / 总内容高度)
        const scrollbarHeight = Math.max(15, Math.min(80, (clientHeight / scrollHeight) * clientHeight));
        
        // 计算可滚动的最大距离
        const maxScrollTop = scrollHeight - clientHeight;
        
        // 计算滚动条滑块的位置
        // 滑块位置 = (当前滚动位置 / 最大滚动距离) * (容器高度 - 滑块高度)
        let scrollbarTop = 0;
        if (maxScrollTop > 0) {
          const scrollRatio = scrollTop / maxScrollTop;
          const availableSpace = clientHeight - scrollbarHeight;
          scrollbarTop = scrollRatio * availableSpace;
        }
        
        // 确保位置在有效范围内，并添加微调
        const clampedTop = Math.max(0, Math.min(scrollbarTop, clientHeight - scrollbarHeight));
        
        // 添加平滑处理，避免抖动
        const currentTop = parseFloat(element.style.getPropertyValue('--scrollbar-top') || '0');
        const smoothTop = currentTop + (clampedTop - currentTop) * 0.3;
        
        // 设置CSS变量
        element.style.setProperty('--scrollbar-opacity', '1');
        element.style.setProperty('--scrollbar-top', `${smoothTop}px`);
        element.style.setProperty('--scrollbar-height', `${scrollbarHeight}px`);
        
        // 调试信息（仅在开发环境）
        if (process.env.NODE_ENV === 'development') {
          console.log('滚动条调试信息:', {
            scrollTop,
            scrollHeight,
            clientHeight,
            scrollbarHeight,
            maxScrollTop,
            scrollbarTop: clampedTop,
            smoothTop,
            scrollRatio: maxScrollTop > 0 ? scrollTop / maxScrollTop : 0
          });
        }
      };
      
      // 添加滚动监听
      const scrollElements = document.querySelectorAll('.group-scrollbar, .ultra-thin-scrollbar');
      const handleScroll = (e: Event) => {
        const target = e.target as HTMLElementWithScrollTimeout;
        if (target.classList.contains('group-scrollbar') ||
            target.classList.contains('ultra-thin-scrollbar')) {
          target.classList.add('scrolling');

          // 使用requestAnimationFrame确保平滑更新
          if (!target.scrollAnimationFrame) {
            target.scrollAnimationFrame = requestAnimationFrame(() => {
              updateScrollbarPosition(target);
              target.scrollAnimationFrame = undefined;
            });
          }

          clearTimeout(target.scrollTimeout);
          target.scrollTimeout = setTimeout(() => {
            target.classList.remove('scrolling');
          }, 1000);
        }
      };
      
      // 添加resize监听
      const handleResize = () => {
        scrollElements.forEach(el => {
          updateScrollbarPosition(el as HTMLElement);
        });
      };
      
      // 监听DOM变化，确保新内容也能更新滚动条
      const observer = new MutationObserver(() => {
        const newScrollElements = document.querySelectorAll('.group-scrollbar, .ultra-thin-scrollbar');
        newScrollElements.forEach(el => {
          if (!el.hasAttribute('data-scrollbar-initialized')) {
            el.addEventListener('scroll', handleScroll);
            el.setAttribute('data-scrollbar-initialized', 'true');
            updateScrollbarPosition(el as HTMLElement);
          }
        });
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      scrollElements.forEach(el => {
        el.addEventListener('scroll', handleScroll);
        el.setAttribute('data-scrollbar-initialized', 'true');
        updateScrollbarPosition(el as HTMLElement);
      });
      
      window.addEventListener('resize', handleResize);
      
      return () => {
        const styleElement = document.getElementById('edge-scrollbar-style');
        if (styleElement) {
          styleElement.remove();
        }
        observer.disconnect();
        scrollElements.forEach(el => {
          el.removeEventListener('scroll', handleScroll);
        });
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);
  
  return null;
};
