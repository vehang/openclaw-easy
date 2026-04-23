import { STORAGE_KEYS } from '@/constants/storage';

/**
 * 生成稳定的浏览器指纹，专注于硬件级特征
 * 在普通模式和无痕模式下都保持一致
 */
function generateStableBrowserFingerprint(): string {
  if (typeof window === 'undefined') {
    return 'ssr_device_' + Math.random().toString(36).substring(2, 15);
  }

  const features: string[] = [];

  try {
    // 1. 屏幕硬件特征（最稳定）
    features.push(screen.width + 'x' + screen.height);
    features.push(screen.colorDepth.toString());
    features.push(screen.pixelDepth.toString());
    features.push((window.devicePixelRatio || 1).toFixed(2));
    
    // 2. 显示器相关（硬件级别）
    if (screen.availWidth && screen.availHeight) {
      features.push(screen.availWidth + 'x' + screen.availHeight);
    }
    
    // 3. 时区信息（系统级别，非常稳定）
    features.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
    features.push(new Date().getTimezoneOffset().toString());
    
    // 4. 系统语言（操作系统级别）
    features.push(navigator.language);
    
    // 5. 平台信息（操作系统）
    features.push(navigator.platform);
    
    // 6. CPU 核心数（硬件级别）
    features.push((navigator.hardwareConcurrency || 0).toString());
    
    // 7. 用户代理的核心部分（去除变化的版本号）
    const ua = navigator.userAgent;
    // 提取操作系统和主要浏览器信息，忽略版本号
    const osMatch = ua.match(/(Windows|Mac|Linux|Android|iOS)/i);
    const browserMatch = ua.match(/(Chrome|Firefox|Safari|Edge)/i);
    if (osMatch) features.push(osMatch[1]);
    if (browserMatch) features.push(browserMatch[1]);
    
    // 8. 触摸支持（硬件特征）
    features.push(('ontouchstart' in window).toString());
    features.push((navigator.maxTouchPoints || 0).toString());
    
    // 9. 简化的Canvas指纹（使用固定内容，减少变化）
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = 100;
        canvas.height = 50;
        ctx.font = '12px Arial';
        ctx.fillStyle = '#000';
        ctx.fillText('StableID', 10, 20);
        // 只取前50个字符，减少噪音
        const canvasData = canvas.toDataURL().substring(22, 72);
        features.push(canvasData);
      }
    } catch (e) {
      features.push('canvas_stable');
    }
    
    // 10. WebGL渲染器信息（GPU硬件信息）
    try {
      const gl = document.createElement('canvas').getContext('webgl') as WebGLRenderingContext;
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          if (vendor) features.push(vendor.toString());
          if (renderer) {
            // 清理渲染器信息，去除驱动版本等变化信息
            const cleanRenderer = renderer.toString().replace(/\d+\.\d+\.\d+/g, '').replace(/\s+/g, ' ').trim();
            features.push(cleanRenderer);
          }
        }
      }
    } catch (e) {
      features.push('webgl_stable');
    }
    
    // 11. 内存信息（如果可用，硬件级别）
    try {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        if (memory && memory.jsHeapSizeLimit) {
          // 将内存大小归类到范围，而不是精确值
          const memGB = Math.round(memory.jsHeapSizeLimit / (1024 * 1024 * 1024));
          features.push(memGB + 'GB');
        }
      }
    } catch (e) {
      features.push('memory_unknown');
    }
    
    // 12. 字体检测（简化版，只检测系统级字体）
    try {
      const systemFonts = ['Arial', 'Times', 'Courier', 'Helvetica'];
      const availableFonts: string[] = [];
      
      for (const font of systemFonts) {
        if (isFontAvailable(font)) {
          availableFonts.push(font);
        }
      }
      features.push(availableFonts.join(','));
    } catch (e) {
      features.push('fonts_unknown');
    }

  } catch (error) {
    console.warn('生成稳定指纹时出现错误:', error);
    features.push('error_fallback');
  }

  // 将所有特征组合并生成哈希
  const combinedFeatures = features.filter(f => f && f.trim()).join('|');
  const fingerprintHash = stableHash(combinedFeatures);
  
  // 输出调试信息（仅在开发模式下）
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log('🔍 稳定指纹生成完成，特征数量:', features.length);
  }
  
  return 'fp_' + fingerprintHash;
}

/**
 * 检测字体是否可用的简化方法
 */
function isFontAvailable(font: string): boolean {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return false;
    
    const testText = 'abcdefghijklmnopqrstuvwxyz0123456789';
    context.font = '72px monospace';
    const baselineWidth = context.measureText(testText).width;
    
    context.font = `72px ${font}, monospace`;
    const testWidth = context.measureText(testText).width;
    
    return Math.abs(baselineWidth - testWidth) > 1;
  } catch (e) {
    return false;
  }
}

/**
 * 改进的稳定哈希函数
 * 使用多重哈希减少冲突
 */
function stableHash(str: string): string {
  // 第一轮哈希
  let hash1 = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash1 = ((hash1 << 5) - hash1) + char;
    hash1 = hash1 & hash1;
  }
  
  // 第二轮哈希（使用不同的算法）
  let hash2 = 5381;
  for (let i = 0; i < str.length; i++) {
    hash2 = (hash2 * 33) ^ str.charCodeAt(i);
  }
  
  // 组合两个哈希值
  const combinedHash = Math.abs(hash1) + Math.abs(hash2);
  return combinedHash.toString(36);
}

/**
 * 初始化设备ID - 使用稳定的指纹算法
 */
export function initDeviceId(): string {
  if (typeof window === 'undefined') {
    return 'ssr_device_' + Math.random().toString(36).substring(2, 15);
  }

  try {
    // 生成稳定的指纹ID
    const stableFingerprintId = generateStableBrowserFingerprint();
    
    // 尝试从localStorage获取已保存的设备ID
    let savedDeviceId: string | null = null;
    try {
      savedDeviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    } catch (e) {
      // 无痕模式下localStorage可能不可用，这是正常的
      console.log('无法访问localStorage，使用纯指纹模式');
    }
    
    let deviceId = stableFingerprintId;
    
    // 如果有保存的ID且是指纹格式，比较是否一致
    if (savedDeviceId && savedDeviceId.startsWith('fp_')) {
      if (savedDeviceId === stableFingerprintId) {
        console.log('设备ID与保存的指纹ID一致');
        deviceId = savedDeviceId;
      } else {
        console.log('设备ID与保存的指纹ID不一致，使用新生成的ID');
        deviceId = stableFingerprintId;
      }
    } else if (savedDeviceId && !savedDeviceId.startsWith('fp_')) {
      // 升级旧的随机ID
      console.log('升级旧的随机ID到稳定指纹ID');
      deviceId = stableFingerprintId;
    }
    
    // 尝试保存到localStorage（如果可用）
    try {
      localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
    } catch (e) {
      // 无痕模式下无法保存，但指纹ID仍然有效
      console.log('无法保存到localStorage，但指纹ID依然有效');
    }
    
    return deviceId;
  } catch (error) {
    console.error('初始化设备ID时出现错误:', error);
    // 发生错误时使用时间戳作为备用
    const fallbackId = 'fallback_' + Date.now().toString(36);
    try {
      localStorage.setItem(STORAGE_KEYS.DEVICE_ID, fallbackId);
    } catch (e) {
      // 忽略localStorage错误
    }
    return fallbackId;
  }
}

/**
 * 获取当前设备ID
 */
export function getDeviceId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  } catch (e) {
    // 无痕模式下重新生成
    return generateStableBrowserFingerprint();
  }
}

/**
 * 强制重新生成设备ID
 */
export function regenerateDeviceId(): string {
  if (typeof window === 'undefined') return 'ssr_device_' + Math.random().toString(36).substring(2, 15);
  
  const newDeviceId = generateStableBrowserFingerprint();
  try {
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, newDeviceId);
  } catch (e) {
    console.warn('无法保存新设备ID，但指纹ID依然有效');
  }
  return newDeviceId;
}

/**
 * 获取设备ID的详细信息（用于调试和测试）
 */
export function getDeviceIdInfo(): {
  deviceId: string | null;
  fingerprintId: string;
  isFingerprint: boolean;
  features: number;
  isIncognito: boolean;
} {
  if (typeof window === 'undefined') {
    return {
      deviceId: null,
      fingerprintId: 'ssr_device',
      isFingerprint: false,
      features: 0,
      isIncognito: false
    };
  }
  
  const deviceId = getDeviceId();
  const fingerprintId = generateStableBrowserFingerprint();
  
  // 检测是否在无痕模式
  let isIncognito = false;
  try {
    localStorage.setItem('test_incognito', 'test');
    localStorage.removeItem('test_incognito');
  } catch (e) {
    isIncognito = true;
  }
  
  return {
    deviceId,
    fingerprintId,
    isFingerprint: deviceId?.startsWith('fp_') || false,
    features: 12, // 使用了12种稳定特征
    isIncognito
  };
}