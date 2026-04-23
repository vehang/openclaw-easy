/**
 * 工具跳转统一处理函数
 * 用于替代直接的href跳转，通过重定向中转页面进行统一管理
 */

import { addToFrequentTools, ToolInput, incrementFrequentToolVisit, getLocalData } from './frequentToolsManager';
import { Tool } from '@/types/IndexToolList';
import { redirectTool } from '../services/api';

export interface ToolRedirectParams {
  // 基本信息
  toolId?: number;
  title: string;
  url: string;
  desc?: string;
  img?: string;
  source: 'homepage' | 'bookmark' | 'favorite';
  
  // 可选参数
  bindId?: number; // 收藏绑定ID
  uniqueKey?: string; // 工具唯一键
  shortUrl?: string; // 工具短地址（保持向后兼容）
  sl?: string; // 工具短地址（新字段名）
  
  // 其他属性
  [key: string]: any;
}

/**
 * 异步记录工具访问（不阻塞用户跳转）
 * @param params 工具参数
 */
async function recordToolAccessAsync(params: ToolRedirectParams): Promise<void> {
  try {
    const body: any = {
      source: params.source
    };

    switch (params.source) {
      case 'homepage':
        if (params.toolId) {
          body.toolId = params.toolId;
        }
        break;

      case 'bookmark':
        body.url = params.url;
        break;

      case 'favorite':
        if (params.toolId && params.bindId) {
          body.toolId = params.toolId;
          body.bindId = params.bindId;
        }
        break;
    }

    // 异步调用后台记录访问
    await redirectTool(body);
    console.log('工具访问记录成功:', params.title);
  } catch (error) {
    console.warn('工具访问记录失败:', error, '但不影响用户跳转');
  }
}

/**
 * 判断是否可以立即跳转（不需要等待后台处理）
 * @param params 工具参数
 * @returns 是否可以立即跳转
 */
function canDirectJump(params: ToolRedirectParams): boolean {
  switch (params.source) {
    case 'bookmark':
      // 书签也通过中转页面跳转，保持统一体验
      return false;
    
    case 'homepage':
      // 首页通过中转页面跳转
      return false;
    
    case 'favorite':
      // 收藏需要后台解析，不能立即跳转
      return false;
    
    default:
      return false;
  }
}

/**
 * 处理工具点击跳转（优化版本）
 * @param params 工具参数
 * @param e 点击事件（用于阻止默认行为）
 */
export function handleToolClick(params: ToolRedirectParams, e?: React.MouseEvent): void {
  // 阻止默认的链接跳转行为
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  try {
    // 记录到常用工具
    const toolInput: ToolInput = {
      ...params,
      id: params.toolId,
      bindId: params.bindId
    };

    addToFrequentTools(toolInput);

    // 增加工具访问次数（如果工具已存在）
    // 注意：addToFrequentTools 内部会生成 uniqueKey，我们需要从生成的工具中获取
    const updatedData = getLocalData();
    if (updatedData.tools && updatedData.tools.length > 0) {
      // 查找刚刚添加或更新的工具
      const source = params.source || 'homepage';
      let searchKey: string;

      switch (source) {
        case 'homepage':
          searchKey = params.toolId ? `homepage_${params.toolId}` : `homepage_url_${params.url}`;
          break;
        case 'bookmark':
          searchKey = `bookmark_${params.url}`;
          break;
        case 'favorite':
          searchKey = params.toolId ? `favorite_${params.toolId}` :
                      params.bindId ? `favorite_bind_${params.bindId}` :
                      `favorite_url_${params.url}`;
          break;
        default:
          searchKey = `${source}_${params.url}`;
          break;
      }

      const foundTool = updatedData.tools.find(t => t.uniqueKey === searchKey);
      if (foundTool && foundTool.uniqueKey) {
        incrementFrequentToolVisit(foundTool.uniqueKey);
        console.log(`工具访问次数+1: ${params.title}, uniqueKey: ${foundTool.uniqueKey}`);
      }
    }

    // 判断是否可以立即跳转
    if (canDirectJump(params)) {
      // 立即跳转模式：先跳转，后记录
      console.log('立即跳转模式:', params.title, '→', params.url);
      window.open(params.url, '_blank', 'noopener,noreferrer');
      
      // 异步记录访问（不阻塞用户体验）
      recordToolAccessAsync(params);
    } else {
      // 重定向模式：需要后台处理的情况
      console.log('重定向模式:', params.title);
      
      // 构建重定向URL参数
      const redirectParams = new URLSearchParams();
      
      // 如果有短地址且来源是homepage，优先使用短地址，不需要其他参数
      // 对于书签和收藏，暂时不使用短地址，避免跳转问题
      const shortUrl = params.sl || params.shortUrl; // 优先使用新字段名，向后兼容
      if (shortUrl && params.source === 'homepage') {
        redirectParams.set('sl', shortUrl);
        // 短地址包含所有必要信息，不需要source和toolId
      } else {
        // 没有短地址时，使用原有逻辑
        redirectParams.set('source', params.source);

        switch (params.source) {
          case 'homepage':
            if (params.toolId) {
              redirectParams.set('toolId', params.toolId.toString());
            }
            break;

          case 'bookmark':
            // 书签工具必须有URL才能跳转
            if (params.url) {
              redirectParams.set('url', params.url);
            } else {
              console.error('书签工具缺少URL参数，无法跳转:', params.title);
              return;
            }
            break;

          case 'favorite':
            // 收藏工具通过重定向页面跳转，即使缺少部分参数
            if (params.toolId) {
              redirectParams.set('toolId', params.toolId.toString());
            }
            if (params.bindId) {
              redirectParams.set('bindId', params.bindId.toString());
            }
            // 如果没有toolId或bindId，至少传递URL作为备用
            if (!params.toolId && !params.bindId && params.url) {
              redirectParams.set('url', params.url);
              console.log('收藏工具缺少toolId/bindId，传递URL作为备用:', params.url);
            }
            break;
        }
      }

      // 跳转到重定向中转页面
      const redirectUrl = `/redirect?${redirectParams.toString()}`;
      window.open(redirectUrl, '_blank', 'noopener,noreferrer');
    }

  } catch (error) {
    console.error('工具跳转处理失败:', error);
    // 发生错误时，仍然尝试直接跳转到目标URL
    window.open(params.url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * 创建工具点击处理器
 * @param params 工具参数
 * @returns 点击处理函数
 */
export function createToolClickHandler(params: ToolRedirectParams) {
  return (e: React.MouseEvent) => {
    handleToolClick(params, e);
  };
}

/**
 * 为链接元素添加统一的工具跳转行为
 * @param params 工具参数
 * @returns 链接属性对象
 */
export function getToolLinkProps(params: ToolRedirectParams) {
  return {
    href: params.url,
    target: '_blank',
    rel: 'noopener noreferrer',
    onClick: createToolClickHandler(params)
  };
}

/**
 * 处理常用工具点击跳转（专用于常用工具列表）
 * 会先增加UV计数，然后通过中间页面进行重定向
 * @param tool 常用工具对象
 * @param e 点击事件（用于阻止默认行为）
 */
export async function handleFrequentToolClick(tool: ToolRedirectParams, e?: React.MouseEvent): Promise<void> {
  // 阻止默认的链接跳转行为
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  try {
    // 先增加UV计数
    if (tool.uniqueKey) {
      // 直接传递当前工具对象，如果本地缓存不存在会使用这个对象并设置un=1
      const currentTool: Tool = {
        id: tool.toolId || 0,
        title: tool.title,
        url: tool.url,
        desc: tool.desc || '',
        img: tool.img || '',
        charge: tool.charge || 0,
        lang: tool.lang || 'zh',
        rel: tool.rel || '',
        un: tool.un || 0,
        sw: tool.sw || 0,
        sl: tool.sl,
        requireLogin: tool.requireLogin || false,
        uniqueKey: tool.uniqueKey,
        bindId: tool.bindId,
        lastSource: tool.lastSource || (tool.source as any) || 'homepage',
        sources: tool.sources || [tool.lastSource || tool.source || 'homepage']
      };

      const updatedTool = incrementFrequentToolVisit(tool.uniqueKey, currentTool);
      if (updatedTool) {
        console.log(`常用工具UV+1: ${tool.title}, 新UV: ${updatedTool.un}`);
      }
    }

    // 构建重定向URL参数
    const redirectParams = new URLSearchParams();

    // 如果有短地址且来源是homepage，优先使用短地址，不需要其他参数
    // 对于书签和收藏，暂时不使用短地址，避免跳转问题
    const shortUrl = tool.sl || tool.shortUrl; // 优先使用新字段名，向后兼容
    if (shortUrl && (tool.source === 'homepage' || !tool.source)) {
      console.log('常用工具使用短地址跳转:', { title: tool.title, source: tool.source, shortUrl });
      redirectParams.set('sl', shortUrl);
      // 短地址包含所有必要信息，不需要source和其他参数
    } else {
      // 没有短地址时，使用原有逻辑
      redirectParams.set('source', tool.source || 'homepage');

      // 根据工具来源设置参数
      switch (tool.source) {
        case 'homepage':
          if (tool.toolId) {
            redirectParams.set('toolId', tool.toolId.toString());
          }
          break;

        case 'bookmark':
          // 书签工具必须有URL才能跳转
          console.log('书签工具参数检查:', {
            title: tool.title,
            toolId: tool.toolId,
            url: tool.url,
            bindId: tool.bindId,
            uniqueKey: tool.uniqueKey
          });

          if (tool.url) {
            redirectParams.set('url', tool.url);
            console.log('书签工具使用URL跳转:', tool.url);
          } else {
            // 缺少URL时，记录错误但不阻止跳转
            console.error('书签工具缺少URL参数，无法跳转:', tool.title);
            return;
          }
          break;

        case 'favorite':
          // 收藏工具通过重定向页面跳转，即使缺少部分参数
          console.log('收藏工具参数检查:', {
            title: tool.title,
            toolId: tool.toolId,
            bindId: tool.bindId,
            url: tool.url
          });

          // 强制使用重定向页面，传递所有可用的参数
          redirectParams.set('source', 'favorite');
          if (tool.toolId) {
            redirectParams.set('toolId', tool.toolId.toString());
          }
          if (tool.bindId) {
            redirectParams.set('bindId', tool.bindId.toString());
          }
          // 如果没有toolId或bindId，至少传递URL作为备用
          if (!tool.toolId && !tool.bindId && tool.url) {
            redirectParams.set('url', tool.url);
            console.log('收藏工具缺少toolId/bindId，传递URL作为备用:', tool.url);
          }

          console.log('收藏工具重定向参数:', {
            title: tool.title,
            params: redirectParams.toString()
          });
          break;

        default:
          // 如果来源不明确，当作首页处理
          redirectParams.set('source', 'homepage');
          if (tool.toolId) {
            redirectParams.set('toolId', tool.toolId.toString());
          }
          break;
      }
    }

    // 跳转到重定向中转页面
    const redirectUrl = `/redirect?${redirectParams.toString()}`;
    window.open(redirectUrl, '_blank', 'noopener,noreferrer');

  } catch (error) {
    console.error('常用工具跳转处理失败:', error);
    // 发生错误时，降级到直接跳转
    window.open(tool.url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * 生成用于二维码的URL地址
 * 对于首页和收藏，使用中间页地址；对于书签，直接使用原始URL
 * @param params 工具参数
 * @returns 用于二维码的URL地址
 */
export function getQRCodeUrl(params: ToolRedirectParams): string {
  // 书签继续使用原始URL
  if (params.source === 'bookmark') {
    return params.url;
  }
  
  // 首页和收藏使用中间页地址
  if (params.source === 'homepage' || params.source === 'favorite') {
    // 获取当前站点的域名
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    
    // 构建重定向URL参数
    const redirectParams = new URLSearchParams();
    
    // 如果有短地址且来源是homepage，优先使用短地址，不需要其他参数
    const shortUrl = params.sl || params.shortUrl; // 优先使用新字段名，向后兼容
    if (shortUrl && params.source === 'homepage') {
      redirectParams.set('sl', shortUrl);
      // 短地址包含所有必要信息，不需要source和toolId
    } else {
      // 没有短地址时，使用原有逻辑
      redirectParams.set('source', params.source);

      switch (params.source) {
        case 'homepage':
          if (params.toolId) {
            redirectParams.set('toolId', params.toolId.toString());
          }
          break;

        case 'favorite':
          if (params.toolId && params.bindId) {
            redirectParams.set('toolId', params.toolId.toString());
            redirectParams.set('bindId', params.bindId.toString());
          }
          break;
      }
    }

    // 返回完整的中间页URL
    return `${currentOrigin}/redirect?${redirectParams.toString()}`;
  }

  // 默认返回原始URL
  return params.url;
} 