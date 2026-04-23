/**
 * 开发者工具检测和禁用
 * 仅在生产环境启用，测试/开发环境允许使用
 */

// 生产环境的跳转地址
const REDIRECT_URL = 'https://baoboxs.com';

/**
 * 检测当前环境是否为测试/开发环境
 */
export const isDevelopmentEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false;

  const hostname = window.location.hostname;

  // 本地开发环境
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return true;
  }

  // 内网IP段 192.168.*.*
  // if (/^192\.168\.\d+\.\d+$/.test(hostname)) {
  //   return true;
  // }

  return false;
};

/**
 * 禁用右键菜单
 */
export const disableContextMenu = (): void => {
  if (typeof window === 'undefined' || isDevelopmentEnvironment()) return;

  const handler = (e: MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
  };

  document.addEventListener('contextmenu', handler);
};

/**
 * 禁用常见的开发者工具快捷键
 */
export const disableDevToolsShortcuts = (): void => {
  if (typeof window === 'undefined' || isDevelopmentEnvironment()) return;

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    // F12
    if (e.key === 'F12') {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = REDIRECT_URL;
      return;
    }

    // Ctrl+Shift+I (打开开发者工具)
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = REDIRECT_URL;
      return;
    }

    // Ctrl+Shift+J (打开控制台)
    if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = REDIRECT_URL;
      return;
    }

    // Ctrl+U (查看源码)
    if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = REDIRECT_URL;
      return;
    }

    // Ctrl+Shift+C (选择元素)
    if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = REDIRECT_URL;
      return;
    }
  }, true); // 使用捕获阶段，优先拦截
};

/**
 * 窗口尺寸检测 DevTools
 * 当 DevTools 打开时，窗口的 outerWidth 和 innerWidth 差值会变大
 */
let lastOuterWidth = 0;
let lastOuterHeight = 0;

export const detectDevToolsByWindowSize = (): void => {
  if (typeof window === 'undefined' || isDevelopmentEnvironment()) return;

  const check = () => {
    const outerWidth = window.outerWidth;
    const outerHeight = window.outerHeight;
    const innerWidth = window.innerWidth;
    const innerHeight = window.innerHeight;

    // 如果窗口尺寸发生了变化，且差值超过阈值（通常是打开 DevTools 的迹象）
    // 桌面端 DevTools 打开时，outerWidth - innerWidth 通常 > 100
    const widthThreshold = window.outerWidth - innerWidth;
    const heightThreshold = window.outerHeight - innerHeight;

    // 检测 DevTools 打开的典型特征
    if (
      (outerWidth !== lastOuterWidth && widthThreshold > 150) ||
      (outerHeight !== lastOuterHeight && heightThreshold > 200)
    ) {
      console.log('检测到开发者工具打开');
      window.location.href = REDIRECT_URL;
      return;
    }

    lastOuterWidth = outerWidth;
    lastOuterHeight = outerHeight;
  };

  // 初始化
  lastOuterWidth = window.outerWidth;
  lastOuterHeight = window.outerHeight;

  // 每 100ms 检查一次
  setInterval(check, 100);
};

/**
 * Debugger 陷阱
 * 通过定时调用 debugger 来干扰开发者调试
 */
export const setDebuggerTrap = (): void => {
  if (typeof window === 'undefined' || isDevelopmentEnvironment()) return;

  const check = () => {
    // 获取当前时间
    const start = new Date().getTime();

    // 设置 debugger
    // eslint-disable-next-line no-debugger
    debugger;

    // 如果执行时间超过 100ms，说明 DevTools 处于暂停状态
    const end = new Date().getTime();
    if (end - start > 100) {
      console.log('检测到开发者调试');
      window.location.href = REDIRECT_URL;
    }
  };

  // 每 2 秒检查一次
  setInterval(check, 2000);
};

/**
 * 禁用拖拽（防止拖拽图片到新标签页查看）
 */
export const disableDrag = (): void => {
  if (typeof window === 'undefined' || isDevelopmentEnvironment()) return;

  document.addEventListener('dragstart', (e: DragEvent) => {
    e.preventDefault();
  });
};

/**
 * 禁用选择文本
 */
export const disableSelect = (): void => {
  if (typeof window === 'undefined' || isDevelopmentEnvironment()) return;

  document.addEventListener('selectstart', (e: Event) => {
    e.preventDefault();
  });
};

/**
 * 初始化所有开发者工具检测和禁用功能
 */
export const initDevToolsProtection = (): void => {
  if (typeof window === 'undefined' || isDevelopmentEnvironment()) {
    console.log('开发/测试环境，不启用开发者工具保护');
    return;
  }

  console.log('生产环境，启用开发者工具保护');

  // 禁用右键菜单
  disableContextMenu();

  // 禁用快捷键
  disableDevToolsShortcuts();

  // 检测窗口尺寸变化
  detectDevToolsByWindowSize();

  // Debugger 陷阱
  setDebuggerTrap();

  // 禁用拖拽
  disableDrag();

  // 禁用文本选择（可选，如果影响用户体验可以注释掉）
  // disableSelect();
};
