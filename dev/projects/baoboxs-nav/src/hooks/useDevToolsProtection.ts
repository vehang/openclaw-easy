import { useEffect } from 'react';
import { initDevToolsProtection } from '@/utils/devToolsDetector';

/**
 * 开发者工具保护 Hook
 * 仅在生产环境启用，自动检测并阻止开发者工具的使用
 */
export const useDevToolsProtection = () => {
  useEffect(() => {
    // 只在客户端执行
    if (typeof window === 'undefined') return;

    // 初始化保护措施
    initDevToolsProtection();
  }, []);
};
