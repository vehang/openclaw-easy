import { NextResponse } from 'next/server';
import { getApiConfig } from '@/config/api';
import { getServerCacheStore, hasValidCache, setServerCache } from '@/utils/serverCache';

// 定义响应数据的接口
interface ApiResponseData {
  code: number;
  errorMsg: string;
  currentTime: number;
  data: unknown;
}

// 获取缓存存储引用
const cacheStore = getServerCacheStore();

// 缓存配置接口
interface CacheConfig {
  duration: number; // 缓存时长（毫秒）
  enabled: boolean; // 是否启用缓存
}

// 确保route.ts中已添加注册接口的代理配置

// API路由映射配置
const API_ROUTES: Record<string, string> = {
  '/api/utility/proxy/tools': '/api/tools/list',
  '/api/utility/proxy/city': '/api/city',
  '/api/utility/proxy/gzhLoginCode': '/api/user/login/gzhLoginCode',
  '/api/utility/proxy/user/login/code/subscribe': '/api/user/login/code/subscribe',
  '/api/utility/proxy/user/login/byGzhCode': '/api/user/login/byGzhCode', // 公众号验证码登录
  '/api/utility/proxy/user/login': '/api/user/login',
  '/api/utility/proxy/user/register': '/api/user/register',
  '/api/utility/proxy/user/dl-bookmarks': '/api/user/dl-bookmarks',
  '/api/utility/proxy/collect/list': '/api/collect/list',
  '/api/utility/proxy/collect/edit': '/api/collect/edit', // 编辑收藏
  '/api/utility/proxy/collect/delete': '/api/collect/delete', // 删除收藏
  '/api/utility/proxy/collect/sort': '/api/collect/sort', // 排序收藏
  '/api/utility/proxy/collect/group/list': '/api/collect/group/list', // 获取分组列表
  '/api/utility/proxy/collect/group/add': '/api/collect/group/add', // 新增分组
  '/api/utility/proxy/collect/group/edit': '/api/collect/group/edit', // 编辑分组
  '/api/utility/proxy/collect/group/sort': '/api/collect/group/sort', // 分组排序
  '/api/utility/proxy/collect/group/delete': '/api/collect/group/delete', // 删除分组
  '/api/utility/proxy/user/token/refresh': '/api/user/token/refresh', // 添加刷新Token的路由映射
  '/api/utility/proxy/feedback/submit': '/api/feedback/submit', // 添加反馈提交的路由映射
  '/api/utility/proxy/feedback/site/submit': '/api/feedback/site/submit', // 添加站点反馈提交的路由映射
  '/api/utility/proxy/nav/recommend/submit': '/api/nav/recommend/submit', // 添加工具推荐提交的路由映射
  '/api/utility/proxy/tools/count': '/api/tools/count', // 添加工具访问统计的路由映射
  '/api/utility/proxy/tools/redirect': '/api/tools/redirect', // 添加工具重定向的路由映射
  '/api/utility/proxy/tools/sl/redirect': '/api/tools/sl/redirect', // 添加工具短地址重定向的路由映射
  // URL检测相关接口
  '/api/utility/proxy/url-check/check-availability': '/api/url-check/check-availability', // URL可用性检测
  '/api/utility/proxy/url-check/add': '/api/url-check/add', // 添加URL检测
  '/api/utility/proxy/url-check/list': '/api/url-check/list', // 获取URL检测列表
  '/api/utility/proxy/url-check/update': '/api/url-check/update', // 更新URL检测
  '/api/utility/proxy/url-check/delete': '/api/url-check/delete', // 删除URL检测
  // 用户绑定相关接口
  '/api/utility/proxy/user-binding/bind': '/api/user-binding/bind', // 绑定用户信息
  '/api/utility/proxy/user-binding/list': '/api/user-binding/list', // 获取绑定列表
  '/api/utility/proxy/user-binding/update': '/api/user-binding/update', // 更新绑定信息
  '/api/utility/proxy/user-binding/delete': '/api/user-binding/delete', // 删除绑定信息
  // 日程管理相关接口
  '/api/utility/proxy/schedule/item/add': '/api/schedule/item/add', // 添加日程明细
  '/api/utility/proxy/schedule/item/update': '/api/schedule/item/update', // 更新日程明细
  '/api/utility/proxy/schedule/item/delete': '/api/schedule/item/delete', // 删除日程明细
  '/api/utility/proxy/schedule/item/status': '/api/schedule/item/status', // 更新日程状态
  '/api/utility/proxy/schedule/day': '/api/schedule/day', // 获取指定日期的日程信息
  '/api/utility/proxy/schedule/month': '/api/schedule/month', // 获取指定月份的日程概览

  // 天气相关
  '/api/utility/proxy/weather/current': '/api/weather/current',

  '/api/utility/proxy/hotlist': '/api/hotlist', // 热榜
  
  // 站点详情相关接口
  '/api/utility/proxy/site/detail': '/api/site/detail', // 站点详情
  '/api/utility/proxy/tools/related': '/api/tools/related', // 添加相关推荐工具的路由映射

  // 常用工具同步相关接口
  '/api/utility/proxy/user/sync-frequent-tools': '/api/user/sync-frequent-tools', // 同步常用工具
  '/api/utility/proxy/user/recover-frequent-tools': '/api/user/recover-frequent-tools', // 智能恢复常用工具
  '/api/utility/proxy/user/device/frequent-tools': '/api/user/device/frequent-tools', // 恢复设备常用工具
  '/api/utility/proxy/user/frequent-tools': '/api/user/frequent-tools', // 获取聚合常用工具
  '/api/utility/proxy/tools/frequent-count': '/api/tools/frequent-count', // 更新工具使用次数
  // 在这里添加更多的路由映射
};

// 缓存策略配置
const CACHE_STRATEGIES: Record<string, CacheConfig> = {
  // 城市缓存48小时
  '/api/utility/proxy/city': {
    duration: 48 * 60 * 60 * 1000,
    enabled: true
  },
  // 工具列表缓存5分钟
  '/api/utility/proxy/tools': {
    duration: 5 * 60 * 1000,
    enabled: true
  },
  // 热榜接口 - 5分钟缓存
  '/api/utility/proxy/hotlist': {
    duration: 5 * 60 * 1000,
    enabled: true
  },

  // 常用工具同步相关接口 - 不缓存（实时数据）
  '/api/utility/proxy/user/sync-frequent-tools': {
    duration: 0,
    enabled: false
  },
  '/api/utility/proxy/user/recover-frequent-tools': {
    duration: 0, // 恢复数据不缓存
    enabled: false
  },
  '/api/utility/proxy/user/device/frequent-tools': {
    duration: 0,
    enabled: false
  },
  '/api/utility/proxy/user/frequent-tools': {
    duration: 1 * 60 * 1000, // 聚合数据缓存1分钟
    enabled: true
  },
  '/api/utility/proxy/tools/frequent-count': {
    duration: 0,
    enabled: false
  },

  // 默认缓存策略
  'default': {
    duration: 0, // 默认0秒
    enabled: false   // 默认不缓存
  }
};

// 获取缓存策略
function getCacheStrategy(path: string): CacheConfig {
  // 精确匹配
  if (CACHE_STRATEGIES[path]) {
    return CACHE_STRATEGIES[path];
  }

  // 前缀匹配
  for (const [routePath, strategy] of Object.entries(CACHE_STRATEGIES)) {
    if (routePath !== 'default' && path.startsWith(routePath)) {
      return strategy;
    }
  }

  // 返回默认策略
  return CACHE_STRATEGIES['default'];
}

// 通用的API代理函数
async function proxyApiRequest(endpoint: string, params?: URLSearchParams, method: string = 'GET', body?: unknown, originalPath?: string, headers?: Headers) {
  // 构建完整的请求URL，包括查询参数
  let fullEndpoint = endpoint;
  if (params && params.toString()) {
    fullEndpoint += `?${params.toString()}`;
  }

  // 检查是否是SSE请求
  const isSSE = originalPath?.includes('/user/login/code/subscribe');

  // 缓存键 (只缓存GET请求)
  const cacheKey = `${method}:${fullEndpoint}`;

  // 获取缓存策略
  const cacheStrategy = getCacheStrategy(originalPath || '');

  // 检查是否强制刷新 (从请求头检查)
  const forceRefresh = headers?.has('Cache-Control') &&
    headers.get('Cache-Control')?.includes('no-cache');

  // 检查缓存 (根据缓存策略，但如果强制刷新则跳过缓存)
  if (!isSSE && method === 'GET' && cacheStrategy.enabled && !forceRefresh &&
    hasValidCache(cacheKey, cacheStrategy.duration)) {
    const cachedData = cacheStore[cacheKey];
    console.log(`使用缓存数据: ${originalPath}`);
    return NextResponse.json(cachedData.data);
  }

  if (forceRefresh) {
    console.log(`强制刷新，跳过缓存: ${originalPath}`);
  }

  try {
    // 动态获取API配置
    const config = getApiConfig();

    // 设置超时 - 为相关推荐API设置更长的超时时间
    const controller = new AbortController();
    const timeoutDuration = originalPath?.includes('/tools/related') ? 60000 : config.timeout; // 相关推荐API 60秒超时
    const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

    // 构建请求头 - 转发所有原始请求头
    const requestHeaders: Record<string, string> = {};

    // 需要跳过的headers（这些由fetch自动处理或可能导致冲突）
    const skipHeaders = new Set([
      'host',
      'content-length',
      'connection',
      'transfer-encoding',
      'upgrade',
      'sec-websocket-key',
      'sec-websocket-version',
      'sec-websocket-protocol'
    ]);

    // 转发所有headers（除了跳过的）
    if (headers) {
      headers.forEach((value, key) => {
        const lowerKey = key.toLowerCase();
        if (!skipHeaders.has(lowerKey)) {
          requestHeaders[key] = value;
        }
      });
    }

    // 确保Content-Type存在
    if (!requestHeaders['Content-Type'] && !requestHeaders['content-type']) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    console.log('转发的headers数量:', Object.keys(requestHeaders).length);

    // 构建请求选项
    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      signal: controller.signal,
      redirect: originalPath?.includes('/tools/redirect') ? 'manual' : 'follow', // 重定向请求不跟随
    };

    // 如果是POST请求且有请求体，添加body
    if (method === 'POST' && body) {
      requestOptions.body = JSON.stringify(body);
    }

    const response = await fetch(`${config.baseUrl}${fullEndpoint}`, requestOptions);

    clearTimeout(timeoutId);

    // 特殊处理重定向请求
    if (originalPath?.includes('/tools/redirect')) {
      console.log('处理重定向请求:', response.status, response.headers.get('Location'));

      if (response.status === 302 || response.status === 301) {
        const targetUrl = response.headers.get('Location');
        if (targetUrl) {
          return NextResponse.json({
            code: 0,
            errorMsg: '',
            currentTime: Date.now(),
            data: { targetUrl, success: true }
          });
        }
      }

      // 如果不是重定向，尝试解析错误响应
      try {
        const errorData = await response.json();
        return NextResponse.json(errorData);
      } catch {
        return NextResponse.json({
          code: response.status,
          errorMsg: `重定向请求失败: ${response.status}`,
          currentTime: Date.now(),
          data: { success: false }
        });
      }
    }

    if (!response.ok) {
      // 尝试解析错误响应
      try {
        const errorData = await response.json();
        return NextResponse.json(errorData);
      } catch {
        // 如果无法解析JSON，则返回通用错误
        return NextResponse.json({
          code: response.status,
          errorMsg: `API请求失败: ${response.status}`,
          currentTime: Date.now(),
          data: null
        });
      }
    }

    // 如果是SSE请求，直接返回流式响应
    if (isSSE) {
      console.log('处理SSE请求:', originalPath);

      // 获取原始响应流
      const stream = response.body;
      if (!stream) {
        throw new Error('无法获取响应流');
      }

      // 创建新的响应，保留原始响应的headers
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    }

    // 普通API请求处理
    const data = await response.json() as ApiResponseData;

    // 更新缓存 (根据缓存策略)
    if (method === 'GET' && cacheStrategy.enabled && cacheStrategy.duration > 0) {
      setServerCache(cacheKey, data);
      console.log(`缓存数据: ${originalPath}, 时长: ${cacheStrategy.duration}ms`);
    }

    // 设置缓存头 (根据缓存策略)
    const cacheControlValue = cacheStrategy.enabled && cacheStrategy.duration > 0
      ? `public, max-age=${Math.floor(cacheStrategy.duration / 1000)}, s-maxage=${Math.floor(cacheStrategy.duration / 1000)}`
      : 'no-store, no-cache, must-revalidate, proxy-revalidate';

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': cacheControlValue,
      },
    });
  } catch (error: any) {
    console.error(`代理请求失败 (${method} ${fullEndpoint}):`, error);

    // 如果是API返回的错误响应，保留原始错误码
    if (error.response?.data) {
      return NextResponse.json(error.response.data);
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json({
          code: 408, // Request Timeout
          errorMsg: '请求超时',
          currentTime: Date.now(),
          data: null
        });
      }
      return NextResponse.json({
        code: 500,
        errorMsg: error.message,
        currentTime: Date.now(),
        data: null
      });
    }

    return NextResponse.json({
      code: 500,
      errorMsg: '未知错误',
      currentTime: Date.now(),
      data: null
    });
  }
}

// 查找匹配的路由端点
function findTargetEndpoint(apiPath: string): string {
  // 尝试精确匹配
  if (API_ROUTES[apiPath]) {
    return API_ROUTES[apiPath];
  }

  // 先处理特殊的动态路径参数（更具体的路径优先）
  if (apiPath.startsWith('/api/utility/proxy/site/detail/')) {
    // 提取slug参数
    const slug = apiPath.replace('/api/utility/proxy/site/detail/', '');
    return `/api/site/detail/${slug}`;
  }
  if (apiPath.startsWith('/api/utility/proxy/tools/related/')) {
    // 提取toolId参数
    const toolId = apiPath.replace('/api/utility/proxy/tools/related/', '');
    return `/api/tools/related/${toolId}`;
  }

  // 尝试前缀匹配（按路径长度排序，更具体的路径优先）
  const sortedRoutes = Object.entries(API_ROUTES).sort((a, b) => b[0].length - a[0].length);
  for (const [routePath, endpointPath] of sortedRoutes) {
    if (apiPath.startsWith(routePath)) {
      return endpointPath;
    }
  }

  return '';
}

// GET 请求处理
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest
  // context: any // 诊断性修改：将 context 类型改为 any -> 已移除
) {
  // 获取请求的URL和参数
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  // 从路径参数中构建API路径
  const path = url.pathname;

  console.log('GET请求路径:', path);

  // 查找匹配的路由
  const targetEndpoint = findTargetEndpoint(path);

  // 如果没有找到匹配的路由，返回404
  if (!targetEndpoint) {
    console.error(`未找到匹配的路由: ${path}`);
    return NextResponse.json(
      { code: -1, errorMsg: '接口不存在', currentTime: Date.now(), data: null },
      { status: 404 }
    );
  }

  // 获取原始请求的headers
  const headers = request.headers;

  // 代理请求到目标接口，传入原始路径用于缓存策略判断，并传递原始请求的headers
  return proxyApiRequest(targetEndpoint, searchParams, 'GET', undefined, path, headers);
}

// POST 请求处理
export async function POST(
  request: NextRequest
  // context: any // 诊断性修改：将 context 类型改为 any -> 已移除
) {
  const url = new URL(request.url);
  const path = url.pathname;

  console.log('POST请求路径:', path);

  // 查找匹配的路由
  const targetEndpoint = findTargetEndpoint(path);

  // 如果没有找到匹配的路由，返回404
  if (!targetEndpoint) {
    console.error(`未找到匹配的路由: ${path}`);
    return NextResponse.json(
      { code: -1, errorMsg: '接口不存在', currentTime: Date.now(), data: null },
      { status: 404 }
    );
  }

  try {
    // 获取请求体
    const body = await request.json();

    // 获取原始请求的headers
    const headers = request.headers;

    // 代理请求到目标接口，传递原始请求的headers
    return proxyApiRequest(targetEndpoint, undefined, 'POST', body, path, headers);
  } catch (error) {
    console.error(`解析POST请求体失败:`, error);
    return NextResponse.json(
      { code: -1, errorMsg: '请求体格式错误', currentTime: Date.now(), data: null },
      { status: 400 }
    );
  }
}