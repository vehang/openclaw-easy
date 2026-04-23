import { useEffect } from 'react';

/**
 * 弹窗滚动锁定 Hook
 * 当弹窗打开时锁定页面滚动，关闭时恢复滚动
 * @param isOpen - 弹窗是否打开
 */
export const useScrollLock = (isOpen: boolean) => {
  useEffect(() => {
    if (isOpen) {
      // 锁定 html 和 body 的滚动
      const html = document.documentElement;
      const body = document.body;

      const originalHtmlOverflow = html.style.overflow;
      const originalBodyOverflow = body.style.overflow;

      html.style.overflow = 'hidden';
      body.style.overflow = 'hidden';

      return () => {
        // 恢复原始 overflow 值
        html.style.overflow = originalHtmlOverflow;
        body.style.overflow = originalBodyOverflow;
      };
    }
  }, [isOpen]);
};
