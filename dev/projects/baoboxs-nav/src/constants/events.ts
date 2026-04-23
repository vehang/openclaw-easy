/**
 * 事件名称常量
 * 集中管理所有自定义事件名称，避免硬编码和拼写错误
 */
export const EVENTS = {
  // 常用工具相关事件
  FREQUENT_TOOLS_DATA_UPDATED: 'FREQUENT_TOOLS_DATA_UPDATED',
  LOCAL_STORAGE_CHANGED: 'localStorageChanged',

  // 用户认证相关事件
  USER_DATA_UPDATED: 'userData_updated',
  LOGIN_STATE_CHANGED: 'LOGIN_STATE_CHANGED',

  // 其他事件
  USER_DATA_UPDATED_ALT: 'USER_DATA_UPDATED', // 备用用户数据更新事件
} as const;

export default EVENTS;