import { STORAGE_KEYS, USER_DATA_UPDATED_EVENT } from '@/constants/storage';
import { localStorageUtils } from '@/utils/localStorage';
import { getDeviceId } from '@/utils/device';
import { handleAuthStateChange } from '@/utils/cache';
import { NetworkErrorHandler, FriendlyError } from '@/utils/errorHandler';

// API 响应数据通用接口
export interface ApiWrapper<T> {
  code: number;
  errorMsg: string;
  currentTime: number;
  data: T;
}

// API 基础配置
interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

// 请求选项接口
interface RequestOptions extends RequestInit {
  retries?: number;
  requireAuth?: boolean;
  skipRefreshWait?: boolean; // 跳过等待token刷新完成（用于refreshToken请求本身）
}

// 安全的环境变量获取函数
function getApiBaseUrl(): string {
  if (typeof process === 'undefined' || !process.env) {
    return '';
  }
  return process.env.NEXT_PUBLIC_API_URL || '';
}

class ApiClient {
  private config: ApiConfig;
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private lastRequestTime: Map<string, number> = new Map();
  private debounceDelay: number = 300; // 防抖延迟300ms

  // Token 刷新锁管理
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<boolean> | null = null;
  private refreshSubscribers: Array<(success: boolean) => void> = [];

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = {
      baseUrl: getApiBaseUrl(),
      timeout: 10000,
      retries: 2,
      ...config
    };
  }

  /**
   * 生成请求的唯一键
   */
  private getRequestKey(url: string, method: string, body?: string): string {
    return `${method}:${url}:${body || ''}`;
  }

  /**
   * 检查是否需要防抖
   */
  private shouldDebounce(key: string): boolean {
    const lastTime = this.lastRequestTime.get(key);
    if (!lastTime) return false;
    
    return Date.now() - lastTime < this.debounceDelay;
  }

  /**
   * 清理用户数据并触发登录弹窗
   */
  private clearUserDataAndShowLogin(): void {
    if (typeof window === 'undefined') return;

    console.log('登录已过期，清除用户数据');
    localStorageUtils.removeItem(STORAGE_KEYS.USER_DATA);
    localStorageUtils.removeItem(STORAGE_KEYS.LAST_TOKEN_REFRESH_TIME);

    // 触发多个事件，确保所有组件都能正确更新状态
    window.dispatchEvent(new Event(STORAGE_KEYS.TOKEN_EXPIRED_EVENT));
    window.dispatchEvent(new Event('userData_updated')); // 触发用户数据更新事件
    window.dispatchEvent(new Event(USER_DATA_UPDATED_EVENT)); // 触发标准用户数据更新事件
    window.dispatchEvent(new CustomEvent('LOGIN_STATE_CHANGED', {
      detail: { type: 'token_expired', isAuthenticated: false }
    })); // 触发登录状态变化事件

    console.log('已触发登录过期相关事件，通知组件更新状态');
  }

  /**
   * 设置 token 刷新状态
   * @param refreshPromise 刷新 token 的 Promise
   */
  setRefreshing(refreshPromise: Promise<boolean>): void {
    this.isRefreshing = true;
    this.refreshPromise = refreshPromise;

    refreshPromise.finally(() => {
      this.isRefreshing = false;
      this.refreshPromise = null;
    });
  }

  /**
   * 开始 token 刷新（立即设置锁，避免竞态条件）
   * @returns 一个包含 Promise 和 resolve 函数的对象
   */
  startRefreshing(): { promise: Promise<boolean>; resolve: (success: boolean) => void } {
    // 立即设置刷新状态，防止其他请求在创建 Promise 之前通过检查
    this.isRefreshing = true;

    let resolveRefresh: (success: boolean) => void;

    const refreshPromise = new Promise<boolean>((resolve) => {
      resolveRefresh = resolve;
    }).finally(() => {
      this.isRefreshing = false;
      this.refreshPromise = null;
    });

    this.refreshPromise = refreshPromise;

    return { promise: refreshPromise, resolve: resolveRefresh! };
  }

  /**
   * 通知所有等待刷新完成的订阅者
   * @param success 刷新是否成功
   */
  private notifyRefreshSubscribers(success: boolean): void {
    this.refreshSubscribers.forEach(callback => callback(success));
    this.refreshSubscribers = [];
  }

  /**
   * 等待 token 刷新完成
   * @returns 刷新是否成功
   */
  private async waitForRefresh(): Promise<boolean> {
    if (!this.isRefreshing || !this.refreshPromise) {
      return false;
    }

    console.log('⏳ Token 正在刷新中，等待刷新完成...');
    return await this.refreshPromise;
  }

  /**
   * 获取请求头
   */
  private getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // 合并自定义headers
    const headers = { ...defaultHeaders, ...customHeaders };

    // 如果需要认证，添加Authorization头
    if (typeof window !== 'undefined') {
      // 添加设备ID到请求头
      const deviceId = getDeviceId();
      if (deviceId) {
        headers['X-Device-Id'] = deviceId;
      }

      // 只有在没有自定义Authorization头的情况下，才自动添加accessToken
      if (!headers['Authorization']) {
        const userData = localStorageUtils.getItem<any>(STORAGE_KEYS.USER_DATA, null);
        if (userData?.accessToken) {
          headers['Authorization'] = `Bearer ${userData.accessToken}`;
        }
      }
    }

    return headers;
  }

  /**
   * 执行HTTP请求
   */
  private async executeRequest<T>(
    url: string,
    options: RequestOptions
  ): Promise<ApiWrapper<T>> {
    // 如果token正在刷新，等待刷新完成后再发请求
    // 这样可以避免使用即将失效的旧token
    // 但refreshToken请求本身需要跳过这个等待，否则会循环依赖
    if (!options.skipRefreshWait && this.isRefreshing && this.refreshPromise) {
      console.log('⏳ Token正在刷新中，等待刷新完成后再发送请求...');
      const refreshSuccess = await this.waitForRefresh();

      if (refreshSuccess) {
        console.log('✅ Token刷新成功，继续发送请求');
      } else {
        // 刷新失败，但不阻止请求继续执行
        // 原因：
        // 1. 可能只是网络问题，token还没过期
        // 2. 让请求继续执行，如果token真的过期了，后端会返回9996
        // 3. 避免因为刷新失败导致所有请求都失败
        console.warn('⚠️ Token刷新失败，但仍尝试发送请求（如果token已过期，后端会返回9996）');
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const headers = this.getHeaders(options.headers as Record<string, string>);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
      }

      const result = await response.json() as ApiWrapper<T>;

      // 检查业务错误码
      if (result.code === 9996) {
        // 如果 token 正在刷新，等待刷新完成
        if (this.isRefreshing) {
          console.log('⏳ 检测到 9996，但 token 正在刷新中，等待刷新完成...');
          const refreshSuccess = await this.waitForRefresh();

          if (refreshSuccess) {
            // 刷新成功，重试当前请求
            console.log('✅ Token 刷新成功，重试当前请求');
            clearTimeout(timeoutId);
            return this.executeRequest<T>(url, options);
          } else {
            // 刷新失败，执行登出
            console.log('❌ Token 刷新失败，执行登出');
            handleAuthStateChange('token_expired', true).catch(error => {
              console.error('处理登录过期缓存清理时出错:', error);
            });
            this.clearUserDataAndShowLogin();
            throw new Error('登录已过期');
          }
        } else {
          // 没有 token 正在刷新，直接执行登出
          console.log('❌ 检测到 9996，没有刷新中的 token，执行登出');
          handleAuthStateChange('token_expired', true).catch(error => {
            console.error('处理登录过期缓存清理时出错:', error);
          });
          this.clearUserDataAndShowLogin();
          throw new Error('登录已过期');
        }
      }

      return result;

    } catch (error) {
      clearTimeout(timeoutId);

      // 使用统一的错误处理机制
      const friendlyError = NetworkErrorHandler.analyzeError(error);
      NetworkErrorHandler.logError(friendlyError, `API请求: ${options.method || 'GET'} ${url}`);

      // 只保留通用错误处理，移除可能导致误判的认证错误特殊处理
      // 登录过期只依赖9996错误码判断，避免文本匹配误判
      throw new Error(friendlyError.userMessage);
    }
  }

  /**
   * 带重试机制、去重和防抖的请求
   */
  private async requestWithRetry<T>(
    url: string,
    options: RequestOptions
  ): Promise<ApiWrapper<T>> {
    const method = options.method || 'GET';
    const body = options.body as string;
    const requestKey = this.getRequestKey(url, method, body);

    // 防抖检查：对于相同请求，如果距离上次请求时间太近，等待一下
    if (this.shouldDebounce(requestKey)) {
      console.log(`🔄 请求防抖：${method} ${url}`);
      await new Promise(resolve => setTimeout(resolve, this.debounceDelay));
    }

    // 请求去重：如果有相同的请求正在进行，直接返回该请求的Promise
    const existingRequest = this.pendingRequests.get(requestKey);
    if (existingRequest) {
      console.log(`⏳ 请求去重：${method} ${url}`);
      return existingRequest;
    }

    // 更新最后请求时间
    this.lastRequestTime.set(requestKey, Date.now());

    const maxRetries = options.retries ?? this.config.retries;
    let lastError: Error;

    // 创建新的请求Promise并缓存
    const requestPromise = (async () => {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await this.executeRequest<T>(url, options);
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('未知错误');
          
          // 如果是最后一次尝试或者是认证错误，直接抛出
          if (attempt === maxRetries || lastError.message.includes('登录已过期')) {
            break;
          }

          // 等待一段时间后重试
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          console.warn(`请求失败，正在重试 (${attempt + 1}/${maxRetries}):`, lastError.message);
        }
      }

      throw lastError!;
    })();

    // 缓存请求Promise
    this.pendingRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      // 请求完成后清除缓存
      this.pendingRequests.delete(requestKey);
    }
  }

  /**
   * GET请求
   */
  async get<T>(url: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<ApiWrapper<T>> {
    return this.requestWithRetry<T>(url, {
      ...options,
      method: 'GET'
    });
  }

  /**
   * POST请求
   */
  async post<T>(
    url: string, 
    data?: any, 
    options: Omit<RequestOptions, 'method' | 'body'> = {}
  ): Promise<ApiWrapper<T>> {
    return this.requestWithRetry<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * PUT请求
   */
  async put<T>(
    url: string, 
    data?: any, 
    options: Omit<RequestOptions, 'method' | 'body'> = {}
  ): Promise<ApiWrapper<T>> {
    return this.requestWithRetry<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * DELETE请求
   */
  async delete<T>(url: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<ApiWrapper<T>> {
    return this.requestWithRetry<T>(url, {
      ...options,
      method: 'DELETE'
    });
  }

  /**
   * 文件上传
   */
  async upload<T>(
    url: string,
    file: File | FormData,
    options: Omit<RequestOptions, 'method' | 'body' | 'headers'> = {}
  ): Promise<ApiWrapper<T>> {
    const formData = file instanceof FormData ? file : new FormData();
    if (file instanceof File) {
      formData.append('file', file);
    }

    // 文件上传不设置Content-Type，让浏览器自动设置
    const headers = this.getHeaders();
    delete headers['Content-Type'];

    return this.requestWithRetry<T>(url, {
      ...options,
      method: 'POST',
      body: formData,
      headers
    });
  }
}

// 导出默认实例
export const apiClient = new ApiClient();

// 导出类，允许创建自定义实例
export { ApiClient }; 