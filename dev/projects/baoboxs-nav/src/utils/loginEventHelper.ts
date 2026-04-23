/**
 * 登录事件辅助工具
 * 用于统一管理登录成功后的事件触发逻辑
 */

// 首页登录成功刷新事件名称
const LOGIN_SUCCESS_HOME_REFRESH_EVENT = 'LOGIN_SUCCESS_HOME_REFRESH';

export interface LoginSuccessEventDetail {
  type: 'login' | 'register';
  timestamp: number;
  userData: any;
}

/**
 * 触发首页登录成功事件
 * @param type - 登录类型（login或register）
 * @param userData - 用户数据
 */
export const triggerHomeLoginSuccessEvent = (type: 'login' | 'register', userData: any) => {
  const eventDetail: LoginSuccessEventDetail = {
    type,
    timestamp: Date.now(),
    userData
  };

  console.log(`🎉 触发首页登录成功事件: ${type}`, eventDetail);
  
  window.dispatchEvent(new CustomEvent(LOGIN_SUCCESS_HOME_REFRESH_EVENT, {
    detail: eventDetail
  }));
};

/**
 * 根据当前路径决定触发哪种登录成功事件
 * @param type - 登录类型
 * @param userData - 用户数据
 * @param onClose - 关闭回调函数
 */
export const handleLoginSuccessEvent = (
  type: 'login' | 'register',
  userData: any,
  onClose: (reason?: 'manual' | 'success') => void
) => {
  const currentPath = window.location.pathname;
  
  if (currentPath.includes('/bookmarks') || currentPath.includes('/favorites')) {
    // 在书签页或收藏页，触发登录成功事件
    console.log(`在书签页或收藏页${type === 'login' ? '登录' : '注册'}成功，触发页面数据重载事件`);
    window.dispatchEvent(new Event('LOGIN_SUCCESS_RELOAD_DATA'));
    onClose();
  } else if (currentPath === '/' || currentPath === '') {
    // 在首页，触发专门的首页登录成功事件
    console.log(`在首页${type === 'login' ? '登录' : '注册'}成功，触发首页数据刷新事件`);
    triggerHomeLoginSuccessEvent(type, userData);
    onClose('success');
  } else {
    // 在其他页面，关闭登录框让事件系统处理数据刷新
    console.log(`在其他页面${type === 'login' ? '登录' : '注册'}成功，通过事件系统处理数据刷新`);
    onClose('success');
  }
};