import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 判断 URL 是否为站内链接
 * @param url - URL 字符串
 * @returns 如果是站内链接返回 true，否则返回 false
 */
export function isInternalLink(url: string): boolean {
  if (!url) return false;

  // 如果是相对路径（以 / 开头），则为站内链接
  if (url.startsWith('/')) {
    return true;
  }

  // 如果包含协议，需要检查域名是否为当前站点
  try {
    // 获取当前站点的域名
    if (typeof window !== 'undefined') {
      const currentDomain = window.location.hostname;
      const urlObj = new URL(url);
      return urlObj.hostname === currentDomain;
    }
  } catch (e) {
    // URL 解析失败，可能是相对路径
    return false;
  }

  return false;
}

/**
 * 根据 URL 和后台返回的 rel 字段生成正确的 rel 属性值
 * @param url - URL 字符串
 * @param backendRel - 后台返回的 rel 字段（可选）
 * @returns 如果是站外链接返回对应的 rel 值，站内链接返回 undefined
 */
export function getLinkRel(url: string, backendRel?: string): string | undefined {
  // 站内链接不需要 rel 属性，以便 SEO 传递权重
  if (isInternalLink(url)) {
    return undefined;
  }

  // 站外链接：始终包含 noopener noreferrer（安全原因）
  const relParts = ['noopener', 'noreferrer'];

  // 如果后台指定了 nofollow，则添加
  if (backendRel === 'nofollow') {
    relParts.unshift('nofollow');
  }

  return relParts.join(' ');
}