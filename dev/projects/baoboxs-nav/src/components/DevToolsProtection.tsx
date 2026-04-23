'use client';

import { useDevToolsProtection } from '@/hooks/useDevToolsProtection';

/**
 * 开发者工具保护组件
 * 仅在生产环境启用保护措施
 */
export const DevToolsProtection = () => {
  useDevToolsProtection();

  return null; // 不渲染任何内容
};
