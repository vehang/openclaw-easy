import { CaptchaResponse } from '@/types/CaptchaResponse';
import { ApiResponse, Tool } from '@/types/IndexToolList';
import { apiClient, ApiWrapper } from './apiClient';
import { STORAGE_KEYS } from '@/constants/storage';
import { getDeviceId } from '@/utils/device';
import { globalCache, localCache } from '@/utils/cache';

// ===== 以下是原 auth.ts 中的函数 =====

/**
 * 获取登录验证码
 * @param deviceId 设备ID
 * @returns 验证码信息
 */
export async function fetchLoginCaptcha(deviceId: string): Promise<CaptchaResponse> {
  try {
    // 使用apiClient来确保自动添加token和deviceId header
    const wrapper: ApiWrapper<CaptchaResponse> = await apiClient.get(`/api/utility/proxy/gzhLoginCode?deviceId=${deviceId}`);
    
    // 检查响应状态码
    if (wrapper.code !== 0) {
      throw new Error(`获取验证码失败: ${wrapper.errorMsg}`);
    }
    
    return wrapper.data;
  } catch (error) {
    console.error('获取验证码出错:', error);
    throw error;
  }
}

/**
 * 用户登录
 * @param username 用户名
 * @param password 密码
 * @returns 登录结果
 */
export async function login(username: string, password: string): Promise<ApiWrapper<any>> {
  return apiClient.post('/api/utility/proxy/user/login', {
    username,
    password
  });
}

/**
 * 公众号验证码登录
 * @param code 验证码
 * @param deviceId 设备ID
 * @returns 登录结果
 */
export async function loginByGzhCode(code: string, deviceId: string): Promise<ApiWrapper<any>> {
  return apiClient.post('/api/utility/proxy/user/login/byGzhCode', {
    code,
    deviceId
  });
}

/**
 * 刷新用户Token，带请求去重和防抖
 * @param refreshToken 刷新Token
 * @param userData 完整的登录返回数据
 * @returns 刷新结果
 */
let refreshTokenPromise: Promise<ApiWrapper<any>> | null = null;
let lastRefreshAttempt: number = 0;
const REFRESH_DEBOUNCE_TIME = 5000; // 5秒内防抖

export async function refreshToken(refreshToken: string, userData: any): Promise<ApiWrapper<any>> {
  const now = Date.now();
  
  // 防抖检查：如果距离上次尝试刷新不到5秒，直接返回错误
  if (now - lastRefreshAttempt < REFRESH_DEBOUNCE_TIME) {
    console.log('refresh token请求过于频繁，跳过此次请求');
    throw new Error('请求过于频繁');
  }
  
  // 如果有正在进行的刷新请求，等待它完成而不是发起新请求
  if (refreshTokenPromise) {
    console.log('等待正在进行的token刷新请求完成');
    return refreshTokenPromise;
  }

  lastRefreshAttempt = now;

  try {
    console.log('发起新的token刷新请求');
    // 创建新的请求并缓存Promise
    refreshTokenPromise = apiClient.post('/api/utility/proxy/user/token/refresh', userData, {
      headers: {
        'Authorization': `Bearer ${refreshToken}`
      },
      retries: 1, // 减少重试次数，避免过多请求
      skipRefreshWait: true // 跳过等待刷新完成，避免循环依赖
    });

    const result = await refreshTokenPromise;
    console.log('token刷新请求完成');
    return result;
  } catch (error) {
    console.error('token刷新失败:', error);
    
    // 如果是超时错误，提供更具体的错误信息
    if (error instanceof Error && error.message.includes('超时')) {
      throw new Error('刷新Token超时，请检查网络连接');
    }
    
    throw error;
  } finally {
    // 清除请求引用
    refreshTokenPromise = null;
  }
}

/**
 * 用户注册
 * @param username 用户名
 * @param password 密码
 * @param nickname 昵称
 * @param email 邮箱
 * @param sseToken SSE推送的临时验证token（注册时使用）
 * @returns 注册结果
 */
export async function register(
  username: string, 
  password: string, 
  nickname: string,
  email: string, 
  sseToken?: string
): Promise<ApiWrapper<any>> {
  const requestData = { 
    username, 
    password, 
    nickname,
    email 
  };
  
  // 如果有SSE推送的临时token，将其放在Authorization header中
  // 注意：这里使用的是SSE推送的临时token，而不是用户的登录token
  // apiClient会优先使用这个自定义的Authorization header
  const options: any = {};
  if (sseToken) {
    options.headers = {
      'Authorization': `Bearer ${sseToken}`
    };
  }
  
  return apiClient.post('/api/utility/proxy/user/register', requestData, options);
}

/**
 * 获取工具数据，支持多级缓存（内存缓存 + localStorage缓存）
 * 修改为使用统一的header处理，包含token和deviceId
 */
let pendingRequest: Promise<ApiResponse> | null = null;
const CACHE_KEY = 'tools_data';
const MEMORY_CACHE_DURATION = 2 * 60 * 1000; // 内存缓存2分钟
const LOCAL_CACHE_DURATION = 5 * 60 * 1000; // localStorage缓存5分钟

// 监听API缓存清理事件
if (typeof window !== 'undefined') {
  window.addEventListener('CLEAR_API_CACHE', () => {
    console.log('🧹 收到API缓存清理事件，清理fetchToolsData的pendingRequest');
    pendingRequest = null;
  });
}

export async function fetchToolsData(forceRefresh: boolean = false): Promise<ApiResponse> {
  // 如果不强制刷新，先检查内存缓存
  if (!forceRefresh) {
    const memoryData = globalCache.get<ApiResponse>(CACHE_KEY);
    if (memoryData) {
      console.log('✅ 使用内存缓存的工具数据');
      return memoryData;
    }

    // 检查 localStorage 缓存
    const localData = localCache.get<ApiResponse>(CACHE_KEY);
    if (localData) {
      console.log('✅ 使用localStorage缓存的工具数据');
      // 同时更新内存缓存
      globalCache.set(CACHE_KEY, localData, MEMORY_CACHE_DURATION);
      return localData;
    }
  }

  // 如果强制刷新，清除正在进行的请求
  if (forceRefresh && pendingRequest) {
    console.log('🔄 强制刷新，取消正在进行的请求');
    pendingRequest = null;
  }

  // 如果有正在进行的请求，等待它完成而不是发起新请求
  if (pendingRequest) {
    console.log('⏳ 等待正在进行的工具数据请求完成');
    return pendingRequest;
  }

  try {
    console.log('🌐 发起新的工具数据请求');
    // 创建新的请求并缓存Promise
    pendingRequest = (async () => {
      const wrapper: ApiWrapper<ApiResponse> = await apiClient.get('/api/utility/proxy/tools', {
        // 添加缓存控制头
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      // 检查响应状态码
      if (wrapper.code !== 0) {
        throw new Error(`业务处理失败: ${wrapper.errorMsg}`);
      }

      return wrapper.data;
    })();

    const result = await pendingRequest;
    
    // 更新多级缓存
    globalCache.set(CACHE_KEY, result, MEMORY_CACHE_DURATION);
    localCache.set(CACHE_KEY, result, LOCAL_CACHE_DURATION);
    
    // 保存降级缓存（更长时间，用于网络错误时降级）
    localCache.set(CACHE_KEY + '_fallback', result, 24 * 60 * 60 * 1000); // 24小时
    
    console.log('✅ 工具数据请求完成，已更新多级缓存');
    
    return result;
  } catch (error) {
    console.error('❌ 获取工具数据失败:', error);
    
    // 如果请求失败，尝试使用降级缓存数据
    const fallbackData = localCache.get<ApiResponse>(CACHE_KEY + '_fallback');
    if (fallbackData) {
      console.log('🔄 使用降级缓存数据');
      return fallbackData;
    }
    
    throw error;
  } finally {
    // 清除请求引用
    pendingRequest = null;
  }
}

/**
 * 创建SSE连接监听验证码登录状态
 * @param deviceId 设备ID
 * @param code 验证码
 * @returns EventSource实例
 */
export function createLoginStatusListener(deviceId: string, code: string): EventSource {
  // 确保使用代理路径
  const url = `/api/utility/proxy/user/login/code/subscribe?deviceId=${deviceId}&code=${code}`;
  
  console.log('创建SSE连接:', url);
  
  // 创建EventSource实例，添加withCredentials选项
  const eventSource = new EventSource(url, {
    withCredentials: true // 添加凭证支持，解决某些跨域问题
  });
  
  return eventSource;
}

/**
 * 获取城市信息，支持多级缓存（内存缓存 + localStorage缓存）
 * 修改为使用统一的header处理，包含token和deviceId
 */
const CITY_CACHE_KEY = 'city_data';
const CITY_MEMORY_CACHE_DURATION = 60 * 60 * 1000; // 内存缓存1小时
const CITY_LOCAL_CACHE_DURATION = 48 * 60 * 60 * 1000; // localStorage缓存48小时

export async function fetchCityData(forceRefresh: boolean = false): Promise<any> {
  // 如果不强制刷新，先检查内存缓存
  if (!forceRefresh) {
    const memoryData = globalCache.get<any>(CITY_CACHE_KEY);
    if (memoryData) {
      console.log('✅ 使用内存缓存的城市数据');
      return memoryData;
    }

    // 检查 localStorage 缓存
    const localData = localCache.get<any>(CITY_CACHE_KEY);
    if (localData) {
      console.log('✅ 使用localStorage缓存的城市数据');
      // 同时更新内存缓存
      globalCache.set(CITY_CACHE_KEY, localData, CITY_MEMORY_CACHE_DURATION);
      return localData;
    }
  }

  try {
    console.log('🌐 发起新的城市数据请求');
    // 使用apiClient来确保自动添加token和deviceId header
    const wrapper: ApiWrapper<any> = await apiClient.get('/api/utility/proxy/city');
    
    // 检查响应状态码
    if (wrapper.code !== 0) {
      throw new Error(`获取城市信息失败: ${wrapper.errorMsg}`);
    }

    const cityData = wrapper.data;
    
    // 更新多级缓存
    globalCache.set(CITY_CACHE_KEY, cityData, CITY_MEMORY_CACHE_DURATION);
    localCache.set(CITY_CACHE_KEY, cityData, CITY_LOCAL_CACHE_DURATION);
    
    console.log('✅ 城市数据请求完成，已更新多级缓存');
    
    return cityData;
  } catch (error) {
    console.error('❌ 获取城市信息失败:', error);
    
    // 如果请求失败，尝试使用降级缓存数据
    const fallbackData = localCache.get<any>(CITY_CACHE_KEY + '_fallback');
    if (fallbackData) {
      console.log('🔄 使用降级城市缓存数据');
      return fallbackData;
    }
    
    throw error;
  }
}

/**
 * 智能恢复用户常用工具数据
 * 基于时间戳智能判断数据同步策略
 * @param deviceId 设备ID
 * @param isFirstTime 是否首次使用
 * @param localData 本地数据（可选）
 * @returns 恢复后的工具数据
 */
export async function recoverFrequentTools(
  deviceId: string,
  isFirstTime: boolean = false,
  localData?: any
): Promise<ApiWrapper<string>> {
  try {
    console.log('智能恢复常用工具数据:', deviceId, isFirstTime);

    // 构建请求体数据，优先传递工具列表而非JSON字符串
    const requestBody = {
      deviceId,
      isFirstTime,
      tools: localData?.tools || [], // 修改字段名：从 localTools 改为 tools
      localToolsCount: localData?.tools?.length || 0,
      localLastUpdateTime: localData?.lastUpdateTime || null,
      localLastSyncTime: localData?.lastSyncTime || null  // 关键参数：本地同步时间
    };

    return await apiClient.post('/api/utility/proxy/user/recover-frequent-tools', requestBody);
  } catch (error) {
    console.error('智能恢复常用工具失败:', error);
    throw error;
  }
}

/**
 * 获取用户书签数据
 * @returns 书签数据
 */
export async function fetchUserBookmarks(): Promise<ApiWrapper<any>> {
  return apiClient.get('/api/utility/proxy/user/dl-bookmarks');
}

/**
 * 获取用户收藏列表
 * @param pageNum 页码
 * @param pageSize 每页数量
 * @param groupId 分组ID，0表示默认分组（未分组），不传表示所有分组
 * @returns 收藏列表数据
 */
export async function fetchUserCollections(pageNum: number = 1, pageSize: number = 100, groupId?: number): Promise<ApiWrapper<any>> {
  return apiClient.post('/api/utility/proxy/collect/list', { pageNum, pageSize, groupId });
}

/**
 * 获取用户分组列表
 * @returns 分组列表数据
 */
export async function fetchUserGroups(): Promise<ApiWrapper<any>> {
  return apiClient.post('/api/utility/proxy/collect/group/list', {});
}

/**
 * 新增分组
 * @param groupName 分组名称
 * @param description 分组描述
 * @param groupIcon 分组图标
 * @returns 新增结果
 */
export async function addGroup(groupName: string, description?: string, groupIcon?: string): Promise<ApiWrapper<any>> {
  return apiClient.post('/api/utility/proxy/collect/group/add', { groupName, description, groupIcon });
}

/**
 * 编辑分组
 * @param id 分组ID
 * @param groupName 分组名称
 * @param description 分组描述
 * @param groupIcon 分组图标
 * @returns 编辑结果
 */
export async function editGroup(id: number, groupName: string, description?: string, groupIcon?: string): Promise<ApiWrapper<any>> {
  return apiClient.post('/api/utility/proxy/collect/group/edit', { groupId: id, groupName, description, groupIcon });
}

/**
 * 删除分组
 * @param id 分组ID
 * @returns 删除结果
 */
export async function deleteGroup(id: number): Promise<ApiWrapper<any>> {
  return apiClient.post('/api/utility/proxy/collect/group/delete', { groupId: id });
}

/**
 * 排序分组
 * @param groupId 要移动的分组ID
 * @param direction 移动方向，"up" 或 "down"
 */
export async function sortGroups(groupId: number, direction: 'up' | 'down'): Promise<ApiWrapper<any>> {
  return apiClient.post('/api/utility/proxy/collect/group/sort', { groupId, direction });
}

/**
 * 编辑收藏的标题、描述和分组
 * @param bindId 收藏绑定ID
 * @param customTitle 自定义标题
 * @param customDesc 自定义描述
 * @param groupId 分组ID，null表示清除分组（设为未分组），0表示默认分组，其他值表示指定分组
 * @returns 编辑结果
 */
export async function editCollection(bindId: number, customTitle?: string, customDesc?: string, groupId?: number | null): Promise<ApiWrapper<any>> {
  return apiClient.post('/api/utility/proxy/collect/edit', { 
    bindId, 
    customTitle, 
    customDesc,
    groupId
  });
}

/**
 * 删除收藏
 * @param bindId 收藏绑定ID
 * @returns 删除结果
 */
export async function deleteCollection(bindId: number): Promise<ApiWrapper<any>> {
  return apiClient.post('/api/utility/proxy/collect/delete', { bindId });
}

/**
 * 批量排序收藏
 * @param sortedBindIds 排序后的bindId列表
 * @returns 排序结果
 */
export async function sortCollections(sortedBindIds: number[]): Promise<ApiWrapper<any>> {
  return apiClient.post('/api/utility/proxy/collect/sort', { sortedBindIds });
}

/**
 * 获取用户的访问令牌和设备ID
 * @returns 包含Authorization头和Device-Id头的对象和用户数据
 * @throws 如果用户未登录或token不存在
 */
export function getUserAuthToken(): { headers: Record<string, string>, userData: any } {
  let headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  let userData = null;
  
  // 添加设备ID到请求头
  if (typeof window !== 'undefined') {
    const deviceId = getDeviceId();
    if (deviceId) {
      headers['X-Device-Id'] = deviceId;
    }

    const cachedUserData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (cachedUserData) {
      try {
        userData = JSON.parse(cachedUserData);
        if (userData.accessToken) {
          headers['Authorization'] = `Bearer ${userData.accessToken}`;
        } else {
          throw new Error('用户未登录或Token不存在');
        }
      } catch (error) {
        console.error('解析用户数据出错:', error);
        throw new Error('获取用户认证信息失败');
      }
    } else {
      throw new Error('用户未登录');
    }
  }
  
  return { headers, userData };
}

/**
 * 检查用户是否已登录
 * @returns 是否登录
 */
export async function isLoggedIn(): Promise<Boolean> {
  if (typeof window === 'undefined') return false;
  
  const cachedUserData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
  if (!cachedUserData) return false;
  
  try {
    const userData = JSON.parse(cachedUserData);
    // 检查是否有有效的访问令牌
    return !!(userData && (userData.accessToken || userData.token));
  } catch (error) {
    console.error('解析用户数据失败:', error);
    // 如果数据损坏，清除无效数据
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    return false;
  }
}

// 使用相同的函数处理服务器端和客户端请求
export const fetchToolsDataServer = fetchToolsData;

// https://ipinfo.io/
// https://api.ip.sb/geoip?language=zh
//
//
// https://wttr.in/?format=2
// https://wttr.in/Berlin?lang=CN
// https://wttr.in/@37.7749,-122.4194?format=j1
// https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current_weather=true
//
// http://www.tianqiapi.com/index/doc

/**
 * 提交用户反馈
 * @param feedbackData 反馈数据
 * @returns 提交结果
 */
export async function submitFeedback(feedbackData: {
  feedbackType: string;
  title: string;
  content: string;
  contactInfo?: string;
}): Promise<ApiWrapper<{ feedbackId: number; message: string }>> {
  console.log('提交用户反馈...');
  return apiClient.post('/api/utility/proxy/feedback/submit', feedbackData);
}

/**
 * 记录工具访问统计
 * @param toolId 工具ID
 * @returns 统计结果
 */
export async function recordToolVisit(toolId: number): Promise<ApiWrapper<any>> {
  try {
    const requestData = {
      toolId,
      timestamp: Date.now()
    };
    
    console.log('记录工具访问统计:', requestData);
    return await apiClient.post('/api/utility/proxy/tools/count', requestData);
  } catch (error) {
    console.error('记录工具访问统计失败:', error);
    // 不抛出错误，避免影响主要功能
    return {
      code: -1,
      errorMsg: '统计失败',
      currentTime: Date.now(),
      data: null
    };
  }
}

/**
 * 工具重定向接口
 * @param request 重定向请求参数
 * @returns 重定向结果
 */
export async function redirectTool(request: {
  toolId?: number;
  source: 'homepage' | 'bookmark' | 'favorite';
  url?: string;
  bindId?: number;
}): Promise<{ success: boolean; targetUrl?: string; message?: string; code?: number }> {
  try {
    console.log('工具重定向请求:', request);
    
    // 使用标准的API客户端调用
    const wrapper: ApiWrapper<{ targetUrl?: string; success?: boolean }> = await apiClient.post('/api/utility/proxy/tools/redirect', request);
    
    if (wrapper.code === 0) {
      return {
        success: wrapper.data.success || true,
        targetUrl: wrapper.data.targetUrl,
        code: wrapper.code
      };
    } else {
      return {
        success: false,
        message: wrapper.errorMsg || '重定向失败',
        code: wrapper.code
      };
    }

  } catch (error: any) {
    console.error('工具重定向失败:', error);
    
    // 检查是否是API返回的错误，提取错误码
    let errorCode = undefined;
    if (error.response?.data?.code) {
      errorCode = error.response.data.code;
    }
    
    return {
      success: false,
      message: error.message || '网络错误',
      code: errorCode
    };
  }
}

/**
 * 工具短地址重定向接口
 * @param request 短地址重定向请求参数
 * @returns 重定向结果
 */
export async function redirectToolByShortUrl(request: {
  sl: string;
  deviceId?: string;
  source?: string;
}): Promise<{ success: boolean; targetUrl?: string; message?: string; code?: number }> {
  try {
    console.log('工具短地址重定向请求:', request);
    
    // 使用标准的API客户端调用
    const wrapper: ApiWrapper<{ targetUrl?: string; success?: boolean }> = await apiClient.post('/api/utility/proxy/tools/sl/redirect', request);
    
    if (wrapper.code === 0) {
      return {
        success: wrapper.data.success || true,
        targetUrl: wrapper.data.targetUrl,
        code: wrapper.code
      };
    } else {
      return {
        success: false,
        message: wrapper.errorMsg || '重定向失败',
        code: wrapper.code
      };
    }

  } catch (error: any) {
    console.error('工具短地址重定向失败:', error);
    
    // 检查是否是API返回的错误，提取错误码
    let errorCode = undefined;
    if (error.response?.data?.code) {
      errorCode = error.response.data.code;
    }
    
    return {
      success: false,
      message: error.message || '网络错误',
      code: errorCode
    };
  }
}

// ==================== URL检测相关API ====================

/**
 * 检测URL可用性（免登录）
 * @param url 要检测的URL
 * @returns 检测结果
 */
export async function checkUrlAvailability(url: string): Promise<ApiWrapper<{
  qqSecurityResult?: {
    status: number;
    message: string;
    safe: boolean;
  };
  weixinResult?: {
    status: number;
    message: string;
    safe: boolean;
  };
}>> {
  console.log('检测URL可用性:', url);
  return apiClient.post('/api/utility/proxy/url-check/check-availability', { url });
}

/**
 * 添加URL检测任务
 * @param request 添加请求参数
 * @returns 添加结果
 */
export async function addUrlCheck(request: {
  url: string;
  checkInterval?: number;
  isActive?: boolean;
  remark?: string;
}): Promise<ApiWrapper<{ urlCheckId: number }>> {
  console.log('添加URL检测任务:', request);
  return apiClient.post('/api/utility/proxy/url-check/add', request);
}

/**
 * 获取URL检测列表
 * @param request 查询参数
 * @returns 检测列表
 */
export async function getUrlCheckList(request: {
  pageNum?: number;
  pageSize?: number;
  activeOnly?: boolean;
  urlKeyword?: string;
}): Promise<ApiWrapper<{
  total: number;
  list: Array<{
    id: number;
    url: string;
    checkInterval: number;
    isActive: boolean;
    remark: string;
    lastCheckTime: number;
    nextCheckTime: number;
    qqSecurityStatus: number;
    qqSecurityMessage: string;
    weixinStatus: number;
    weixinMessage: string;
    overallStatus: string;
    createTime: number;
    updateTime: number;
  }>;
}>> {
  console.log('获取URL检测列表:', request);
  return apiClient.post('/api/utility/proxy/url-check/list', request);
}

/**
 * 更新URL检测任务
 * @param request 更新请求参数
 * @returns 更新结果
 */
export async function updateUrlCheck(request: {
  id: number;
  url?: string;
  checkInterval?: number;
  isActive?: boolean;
  remark?: string;
}): Promise<ApiWrapper<any>> {
  console.log('更新URL检测任务:', request);
  return apiClient.post('/api/utility/proxy/url-check/update', request);
}

/**
 * 删除URL检测任务
 * @param id 检测任务ID
 * @returns 删除结果
 */
export async function deleteUrlCheck(id: number): Promise<ApiWrapper<any>> {
  console.log('删除URL检测任务:', id);
  return apiClient.post('/api/utility/proxy/url-check/delete', { id });
}

// ==================== 用户绑定相关API ====================

/**
 * 绑定用户信息（如爱语飞飞Token）
 * @param request 绑定请求参数
 * @returns 绑定结果
 */
export async function bindUserInfo(request: {
  bindType: number;
  bindValue: string;
  bindName?: string;
  remark?: string;
}): Promise<ApiWrapper<{ bindId: number }>> {
  console.log('绑定用户信息:', request);
  return apiClient.post('/api/utility/proxy/user-binding/bind', request);
}

/**
 * 获取用户绑定列表
 * @param request 查询参数
 * @returns 绑定列表
 */
export async function getUserBindingList(request?: {
  bindType?: number;
  pageNum?: number;
  pageSize?: number;
}): Promise<ApiWrapper<{
  total: number;
  list: Array<{
    id: number;
    bindType: number;
    bindValue: string;
    bindName: string;
    remark: string;
    isVerified: boolean;
    status: number;
    createTime: number;
    updateTime: number;
  }>;
}>> {
  console.log('获取用户绑定列表:', request);
  return apiClient.post('/api/utility/proxy/user-binding/list', request || {});
}

/**
 * 更新用户绑定信息
 * @param request 更新请求参数
 * @returns 更新结果
 */
export async function updateUserBinding(request: {
  id: number;
  bindValue?: string;
  bindName?: string;
  remark?: string;
  status?: number;
}): Promise<ApiWrapper<any>> {
  console.log('更新用户绑定信息:', request);
  return apiClient.post('/api/utility/proxy/user-binding/update', request);
}

/**
 * 删除用户绑定信息
 * @param id 绑定ID
 * @returns 删除结果
 */
export async function deleteUserBinding(id: number): Promise<ApiWrapper<any>> {
  console.log('删除用户绑定信息:', id);
  return apiClient.post('/api/utility/proxy/user-binding/delete', { id });
}

// ==================== 站点详情相关API ====================

/**
 * 获取站点详情信息（包含markdown内容）
 * @param slug 站点的短地址标识
 * @returns 站点详情数据
 */
export async function fetchSiteDetail(slug: string): Promise<{
  id: number;
  title: string;
  desc: string;
  img: string;
  url: string;
  lang: string;
  charge: number;
  un: number;
  sw: number;
  mf?: number;
  sl?: string;
  markdownContent?: string;
  viewCount?: number;
  tags?: string[];
}> {
  try {
    console.log('获取站点详情:', slug);
    
    // 在服务端渲染时，需要构建完整的URL
    let fullUrl: string;
    
    if (typeof window === 'undefined') {
      // 服务端渲染
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';
      fullUrl = `${baseUrl}/utility/proxy/site/detail/${slug}`;
    } else {
      // 客户端渲染
      fullUrl = `/api/utility/proxy/site/detail/${slug}`;
    }
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // 添加缓存控制
      cache: 'no-store', // 确保获取最新数据
    });
    
    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
    }
    
    const wrapper: ApiWrapper<{
      id: number;
      title: string;
      desc: string;
      img: string;
      url: string;
      lang: string;
      charge: number;
      un: number;
      sw: number;
      mf?: number;
      sl?: string;
      markdownContent?: string;
      viewCount?: number;
      tags?: string[];
    }> = await response.json();
    
    if (wrapper.code !== 0) {
      throw new Error(`获取站点详情失败: ${wrapper.errorMsg}`);
    }
    
    return wrapper.data;
  } catch (error) {
    console.error('获取站点详情失败:', error);
    throw error;
  }
}

/**
 * 获取相关推荐工具
 * @param shortUrl 工具短地址
 * @returns 相关推荐工具列表
 */
export async function fetchRelatedTools(shortUrl: string): Promise<Tool[]> {
  try {
    console.log('获取相关推荐工具:', shortUrl);

    const wrapper: ApiWrapper<Tool[]> = await apiClient.get(`/api/utility/proxy/tools/related/${shortUrl}`);

    if (wrapper.code !== 0) {
      throw new Error(`获取相关推荐工具失败: ${wrapper.errorMsg}`);
    }

    return wrapper.data || [];
  } catch (error) {
    console.error('获取相关推荐工具失败:', error);
    throw error;
  }
}

// ===== 常用工具同步相关API =====

/**
 * 同步常用工具到服务端（优化版本）
 * @param deviceId 设备ID
 * @param localTools 本地工具列表
 * @param lastSyncTime 上次同步时间
 * @returns 同步结果和聚合数据
 */
export async function syncFrequentTools(deviceId: string, localTools: any[], lastSyncTime?: number): Promise<ApiWrapper<any>> {
  try {
    console.log('同步常用工具到服务端:', deviceId, lastSyncTime);

    const requestBody = {
      deviceId,
      lastSyncTime,
      lastUpdateTime: Date.now(),
      tools: localTools || [] // 修改字段名：从 localTools 改为 tools
    };

    return await apiClient.post('/api/utility/proxy/user/sync-frequent-tools', requestBody);
  } catch (error) {
    console.error('同步常用工具失败:', error);
    throw error;
  }
}

/**
 * 同步常用工具到服务端（兼容版本）
 * @param deviceId 设备ID
 * @param localToolsData 本地工具数据（旧格式）
 * @param lastSyncTime 上次同步时间
 * @returns 同步结果和聚合数据
 * @deprecated 使用 syncFrequentTools(deviceId, localTools, lastSyncTime) 替代
 */
export async function syncFrequentToolsLegacy(deviceId: string, localToolsData: any, lastSyncTime?: number): Promise<ApiWrapper<any>> {
  return syncFrequentTools(deviceId, localToolsData?.tools || [], lastSyncTime);
}

/**
 * 恢复指定设备的常用工具数据
 * @param deviceId 设备ID
 * @returns 设备的常用工具数据
 */
export async function getDeviceFrequentTools(deviceId: string): Promise<ApiWrapper<string>> {
  try {
    console.log('恢复设备常用工具数据:', deviceId);

    return await apiClient.get(`/api/utility/proxy/user/device/frequent-tools?deviceId=${encodeURIComponent(deviceId)}`);
  } catch (error) {
    console.error('恢复设备常用工具失败:', error);
    throw error;
  }
}

/**
 * 获取用户聚合的常用工具（用于展示）
 * @returns 所有设备的聚合常用工具数据
 */
export async function getUserAggregatedFrequentTools(): Promise<ApiWrapper<any[]>> {
  try {
    console.log('获取用户聚合常用工具数据');

    return await apiClient.get('/api/utility/proxy/user/frequent-tools');
  } catch (error) {
    console.error('获取用户聚合常用工具失败:', error);
    throw error;
  }
}

/**
 * 更新工具使用次数
 * @param deviceId 设备ID
 * @param uniqueKey 工具唯一标识
 * @param toolId 工具ID（可选）
 * @returns 更新结果
 */
export async function updateServerToolCount(deviceId: string, uniqueKey: string, toolId?: number): Promise<ApiWrapper<any>> {
  try {
    console.log('更新服务端工具使用次数:', deviceId, uniqueKey);

    const requestBody = {
      deviceId,
      uniqueKey,
      toolId,
      timestamp: Date.now()
    };

    return await apiClient.post('/api/utility/proxy/tools/frequent-count', requestBody);
  } catch (error) {
    console.error('更新服务端工具使用次数失败:', error);
    throw error;
  }
}


