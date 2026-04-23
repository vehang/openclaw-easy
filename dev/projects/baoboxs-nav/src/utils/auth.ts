/**
 * 认证相关的工具函数
 */

interface UserData {
  id?: string;
  username?: string;
  userName?: string;
  email?: string;
  avatarUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  loginTime?: number;
  [key: string]: any;
}

/**
 * 检查用户是否已完成注册
 * 用户必须同时具备：
 * 1. 有效的token（accessToken 或 refreshToken）
 * 2. 用户名（username 或 userName）
 */
export function isUserFullyRegistered(userData: UserData | null): boolean {
  if (!userData) {
    return false;
  }
  
  // 检查是否有token
  const hasToken = Boolean(userData.accessToken || userData.refreshToken);
  
  // 检查是否有用户名
  const hasUsername = Boolean(userData.userName || userData.username);
  
  return hasToken && hasUsername;
}

/**
 * 检查用户是否有有效的登录token（但可能未完成注册）
 */
export function hasValidToken(userData: UserData | null): boolean {
  if (!userData) {
    return false;
  }
  
  return Boolean(userData.accessToken || userData.refreshToken);
} 

// 用户认证相关工具函数

// 获取当前用户ID
export function getCurrentUserId(): number {
  // 这里应该从实际的用户认证系统获取用户ID
  // 暂时返回1作为示例，实际项目中应该从JWT token或session中获取
  return 1;
}

// 检查用户是否已登录
export function isUserLoggedIn(): boolean {
  if (typeof window === 'undefined') {
    return false; // 服务端渲染时返回未登录状态
  }
  
  try {
    // 从 localStorage 获取用户数据
    const userData = localStorage.getItem('userData');
    if (!userData) {
      return false;
    }
    
    const parsedUserData = JSON.parse(userData);
    
    // 使用现有的认证检查函数
    return isUserFullyRegistered(parsedUserData);
  } catch (error) {
    console.error('检查登录状态时出错:', error);
    return false;
  }
}

// 获取用户信息
export function getUserInfo() {
  // 这里应该从localStorage或session中获取用户信息
  // 暂时返回示例数据
  return {
    id: 1,
    username: 'demo_user',
    email: 'demo@example.com'
  };
} 