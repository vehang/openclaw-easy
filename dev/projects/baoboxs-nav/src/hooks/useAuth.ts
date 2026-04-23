import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS } from '@/constants/storage';
import { refreshToken as apiRefreshToken } from '@/services/api';
import { apiClient } from '@/services/apiClient';
import { isUserFullyRegistered } from '@/utils/auth';
import { handleAuthStateChange } from '@/utils/cache';

interface UserData {
  id?: string;
  username?: string;
  userName?: string;
  email?: string;
  avatarUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  loginTime?: number;
  refreshInterval?: number;
  [key: string]: any;
}

interface AuthState {
  user: UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  login: (userData: UserData) => void;
  logout: () => void;
  refreshUserToken: () => Promise<boolean>;
  updateUserData: (userData: UserData) => void;
}

const DEFAULT_TOKEN_REFRESH_INTERVAL = 24 * 60 * 60 * 1000; // 24小时

export function useAuth(): AuthState & AuthActions {
  const [userData, setUserData, removeUserData] = useLocalStorage<UserData | null>(
    STORAGE_KEYS.USER_DATA,
    null
  );
  
  const [isLoading, setIsLoading] = useState(true);

  // 判断用户是否已认证（需要有token且已完成注册）
  const isAuthenticated = isUserFullyRegistered(userData);

  // 获取用户显示信息
  const user = userData ? {
    id: userData.id,
    username: userData.username || userData.userName,
    email: userData.email,
    avatarUrl: userData.avatarUrl,
    ...userData
  } : null;

  // 登录方法
  const login = useCallback((newUserData: UserData) => {
    const userDataWithTimestamp = {
      ...newUserData,
      loginTime: Date.now()
    };
    setUserData(userDataWithTimestamp);

    // 更新最后一次刷新token的时间，避免登录后立即触发token刷新
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.LAST_TOKEN_REFRESH_TIME, Date.now().toString());
    }

    // 登录成功后清理缓存并触发数据重新加载（异步执行，不阻塞当前流程）
    handleAuthStateChange('login', true).catch(error => {
      console.error('处理登录缓存清理时出错:', error);
    });

    // 登录成功后触发 LOGIN_STATE_CHANGED 事件
    // useFrequentToolsSync 会监听此事件并自动调用 smartSync() 执行完整的恢复和同步流程
    if (typeof window !== 'undefined') {
      // 使用 requestAnimationFrame 确保 React 状态已更新（下一帧渲染）
      requestAnimationFrame(() => {
        // 先触发事件，确保其他组件能感知到登录状态变化
        window.dispatchEvent(new Event('userData_updated'));
        window.dispatchEvent(new Event('USER_DATA_UPDATED'));
        window.dispatchEvent(new CustomEvent('LOGIN_STATE_CHANGED', {
          detail: { type: 'login', isAuthenticated: true }
        }));
        console.log('触发登录状态变化事件：LOGIN_STATE_CHANGED (login)');
        console.log('🔥 useFrequentToolsSync 将自动调用 smartSync 执行完整的恢复和同步流程');
      });
    }
  }, [setUserData]);

  // 退出登录方法
  const logout = useCallback(() => {
    console.log('用户退出登录，清除数据');

    // 退出登录时清理云端缓存
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('frequent-tools-cloud-cache');
        console.log('清除云端缓存数据');
      } catch (error) {
        console.error('清除云端缓存失败:', error);
      }
    }

    // 退出登录时清理缓存（异步执行，不阻塞当前流程）
    handleAuthStateChange('logout', true).catch(error => {
      console.error('处理退出登录缓存清理时出错:', error);
    });

    // 先触发登出事件，然后再清除数据
    if (typeof window !== 'undefined') {
      // 添加专门的登出事件，用于首页强制刷新
      window.dispatchEvent(new CustomEvent('LOGIN_STATE_CHANGED', {
        detail: { type: 'logout', isAuthenticated: false }
      }));
      console.log('触发登录状态变化事件：LOGIN_STATE_CHANGED (logout)');
    }

    removeUserData();

    // 清除相关的缓存数据
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.LAST_TOKEN_REFRESH_TIME);
      // 可以在这里清除其他用户相关的缓存

      // 根据当前页面决定是跳转首页还是刷新页面
      const currentPath = window.location.pathname;
      if (currentPath.includes('/bookmarks') || currentPath.includes('/favorites')) {
        // 在书签页或收藏页，跳转到首页
        console.log('在书签页或收藏页退出登录，跳转到首页');
        window.location.href = '/';
      } else {
        // 在其他页面，直接刷新页面
        console.log('在其他页面退出登录，刷新页面');
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    }
  }, [removeUserData]);

  // 更新用户数据方法
  const updateUserData = useCallback((newUserData: UserData) => {
    if (userData) {
      const updatedData = {
        ...userData,
        ...newUserData
      };
      setUserData(updatedData);
      
      // 触发用户数据更新事件
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('userData_updated'));
      }
    }
  }, [userData]);

  // 刷新Token方法
  const refreshUserToken = useCallback(async (): Promise<boolean> => {
    if (!userData?.refreshToken) {
      console.warn('没有refreshToken，无法刷新');
      return false;
    }

    // 先检查是否需要刷新（避免频繁刷新）
    const lastRefreshTime = localStorage.getItem(STORAGE_KEYS.LAST_TOKEN_REFRESH_TIME);
    const refreshInterval = userData.refreshInterval
      ? parseInt(userData.refreshInterval.toString()) * 1000
      : DEFAULT_TOKEN_REFRESH_INTERVAL;

    if (lastRefreshTime && Date.now() - parseInt(lastRefreshTime) < refreshInterval) {
      console.log('Token在刷新间隔内，跳过刷新');
      return true;
    }

    // 【关键】立即设置刷新锁，防止竞态条件
    // 在执行任何异步操作之前就设置锁，确保其他请求能够检测到
    const { promise: refreshPromise, resolve: resolveRefresh } = apiClient.startRefreshing();

    try {
      console.log('🔄 开始刷新用户Token...');
      const response = await apiRefreshToken(userData.refreshToken!, userData);

      if (response.code === 0) {
        // 刷新成功
        const updatedUserData = {
          ...response.data,
          loginTime: userData.loginTime // 保留原始登录时间
        };

        setUserData(updatedUserData);

        // 更新最后刷新时间
        localStorage.setItem(STORAGE_KEYS.LAST_TOKEN_REFRESH_TIME, Date.now().toString());

        console.log('✅ Token刷新成功');

        // 触发用户数据更新事件
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('userData_updated'));
        }

        // 解析刷新 Promise，通知等待的请求
        resolveRefresh(true);
        return true;
      } else if (response.code === 9996) {
        // 登录已过期
        console.log('❌ 登录已过期，清除用户数据');
        // 登录过期时清理缓存（异步执行，不阻塞当前流程）
        handleAuthStateChange('token_expired', true).catch(error => {
          console.error('处理登录过期缓存清理时出错:', error);
        });
        logout();
        // 解析刷新 Promise
        resolveRefresh(false);
        return false;
      } else {
        console.error('❌ Token刷新失败:', response.errorMsg);
        resolveRefresh(false);
        return false;
      }
    } catch (error) {
      console.error('❌ 刷新Token失败:', error);

      // 如果是请求过于频繁的错误，不需要特别处理，静默返回成功
      if (error instanceof Error && error.message.includes('请求过于频繁')) {
        console.log('Token刷新请求过于频繁，跳过本次刷新');
        resolveRefresh(true);
        return true;
      }

      // 如果是超时错误，也不立即退出登录，给用户一次重试的机会
      if (error instanceof Error && error.message.includes('超时')) {
        console.warn('Token刷新超时，稍后会自动重试');
        resolveRefresh(false);
        return false;
      }

      resolveRefresh(false);
      return false;
    }
  }, [userData, setUserData, logout]);

  // 初始化时设置加载状态
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // 监听用户数据更新事件
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleUserDataUpdate = () => {
      console.log('接收到用户数据更新事件');
      // 这里可以执行一些额外的操作，比如刷新页面状态等
    };

    window.addEventListener('userData_updated', handleUserDataUpdate);

    return () => {
      window.removeEventListener('userData_updated', handleUserDataUpdate);
    };
  }, []);

  // 自动刷新Token（在组件挂载时和定期执行）
  useEffect(() => {
    if (!isAuthenticated || !userData?.refreshToken) return;

    // 检查是否需要立即刷新
    const shouldRefreshImmediately = () => {
      const lastRefreshTime = localStorage.getItem(STORAGE_KEYS.LAST_TOKEN_REFRESH_TIME);
      const refreshInterval = userData.refreshInterval 
        ? parseInt(userData.refreshInterval.toString()) * 1000
        : DEFAULT_TOKEN_REFRESH_INTERVAL;

      // 只有超过24小时才需要立即刷新token，减少不必要的刷新频率
      if (!lastRefreshTime || Date.now() - parseInt(lastRefreshTime) > refreshInterval) {
        return true;
      }
      return false;
    };

    // 只有需要时才立即刷新
    if (shouldRefreshImmediately()) {
      console.log('检测到需要立即刷新token');
      refreshUserToken();
    }

    // 设置定期刷新（每小时检查一次，但不会重复刷新）
    const interval = setInterval(() => {
      refreshUserToken();
    }, 60 * 60 * 1000); // 1小时

    return () => clearInterval(interval);
  }, [isAuthenticated, userData?.refreshToken, refreshUserToken]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUserToken,
    updateUserData
  };
} 