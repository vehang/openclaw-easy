import { apiClient, ApiWrapper } from './apiClient';

// ===== URL检测相关接口 =====

/**
 * URL快速检测接口
 * @param url 要检测的URL
 * @returns 检测结果
 */
export async function checkUrlAvailability(url: string): Promise<ApiWrapper<{
  success: boolean;
  results: Record<string, boolean>;
  errorMessages: Record<string, string>;
  originalUrl: string;
  normalizedUrl: string;
}>> {
  return apiClient.post('/api/utility/proxy/url-check/check-availability', { url });
}

/**
 * 添加URL到检测列表
 * @param originalUrl 原始URL
 * @param checkIntervalMinutes 检测间隔（分钟）
 * @param isActive 是否激活
 * @param tencentCheckEnabled 是否启用腾讯安全检测
 * @param wechatCheckEnabled 是否启用微信检测
 * @returns 添加结果
 */
export async function addUrlCheck(
  originalUrl: string,
  checkIntervalMinutes: number = 1440,
  isActive: boolean = true,
  tencentCheckEnabled: boolean = true,
  wechatCheckEnabled: boolean = true
): Promise<ApiWrapper<{
  checkId: number;
  originalUrl: string;
  normalizedUrl: string;
  checkIntervalMinutes: number;
  isActive: boolean;
  nextCheckTime: string;
  createTime: string;
  tencentCheckEnabled: boolean;
  wechatCheckEnabled: boolean;
  success: boolean;
  message: string;
}>> {
  return apiClient.post('/api/utility/proxy/url-check/add', {
    originalUrl,
    checkIntervalMinutes,
    isActive,
    tencentCheckEnabled,
    wechatCheckEnabled
  });
}

/**
 * 修改URL检测设置
 * @param checkId 检测记录ID
 * @param checkIntervalMinutes 检测间隔（分钟）
 * @param isActive 是否激活
 * @param tencentCheckEnabled 是否启用腾讯安全检测
 * @param wechatCheckEnabled 是否启用微信检测
 * @returns 修改结果
 */
export async function updateUrlCheck(
  checkId: number,
  checkIntervalMinutes?: number,
  isActive?: boolean,
  tencentCheckEnabled?: boolean,
  wechatCheckEnabled?: boolean
): Promise<ApiWrapper<any>> {
  return apiClient.post('/api/utility/proxy/url-check/update', {
    checkId,
    checkIntervalMinutes,
    isActive,
    tencentCheckEnabled,
    wechatCheckEnabled
  });
}

/**
 * 删除URL检测记录
 * @param checkId 检测记录ID
 * @returns 删除结果
 */
export async function deleteUrlCheck(checkId: number): Promise<ApiWrapper<any>> {
  return apiClient.post('/api/utility/proxy/url-check/delete', { checkId });
}

/**
 * 查询URL检测列表
 * @param activeOnly 是否只查询激活的记录
 * @param urlKeyword URL关键字
 * @param pageNum 页码
 * @param pageSize 每页大小
 * @returns 检测列表
 */
export async function getUrlCheckList(
  activeOnly?: boolean,
  urlKeyword?: string,
  pageNum: number = 1,
  pageSize: number = 20
): Promise<ApiWrapper<{
  items: Array<{
    checkId: number;
    originalUrl: string;
    normalizedUrl: string;
    checkIntervalMinutes: number;
    isActive: boolean;
    nextCheckTime: string;
    tencentStatus: number;
    tencentLastCheckTime?: string;
    wechatStatus: number;
    wechatLastCheckTime?: string;
    notificationStatus: number;
    lastNotifyTime?: string;
    tencentCheckEnabled: boolean;
    wechatCheckEnabled: boolean;
    createTime: string;
    updateTime: string;
  }>;
  total: number;
  pageNum: number;
  pageSize: number;
  totalPages: number;
}>> {
  return apiClient.post('/api/utility/proxy/url-check/list', {
    activeOnly,
    urlKeyword,
    pageNum,
    pageSize
  });
}

// ===== 用户绑定相关接口 =====

/**
 * 绑定用户关联信息（如爱语飞飞Token）
 * @param bindType 绑定类型（4=爱语飞飞Token）
 * @param bindValue 绑定值
 * @param bindName 绑定名称（可选）
 * @param remark 备注（可选）
 * @returns 绑定结果
 */
export async function bindUserInfo(
  bindType: number,
  bindValue: string,
  bindName?: string,
  remark?: string
): Promise<ApiWrapper<{
  bindId: number;
  bindType: number;
  bindTypeDescription: string;
  bindStatus: number;
  statusDescription: string;
  bindName?: string;
  maskedValue: string;
  createTime: string;
  updateTime: string;
  verifiedTime?: string;
  success: boolean;
  message: string;
}>> {
  return apiClient.post('/api/utility/proxy/user-binding/bind', {
    bindType,
    bindValue,
    bindName,
    remark
  });
}

/**
 * 查询用户绑定列表
 * @param bindType 绑定类型（可选）
 * @param bindStatus 绑定状态（可选）
 * @returns 绑定列表
 */
export async function getUserBindingList(
  bindType?: number,
  bindStatus?: number
): Promise<ApiWrapper<Array<{
  bindId: number;
  bindType: number;
  bindTypeDescription: string;
  bindStatus: number;
  statusDescription: string;
  bindName?: string;
  maskedValue: string;
  createTime: string;
  updateTime: string;
  verifiedTime?: string;
  success: boolean;
  message: string;
  extInfo?: string;
}>>> {
  return apiClient.post('/api/utility/proxy/user-binding/list', {
    bindType,
    bindStatus
  });
}

/**
 * 修改用户绑定信息
 * @param bindId 绑定记录ID
 * @param newBindValue 新的绑定值
 * @param bindName 绑定名称
 * @param remark 备注
 * @returns 修改结果
 */
export async function updateUserBinding(
  bindId: number,
  newBindValue?: string,
  bindName?: string,
  remark?: string
): Promise<ApiWrapper<any>> {
  return apiClient.post('/api/utility/proxy/user-binding/update', {
    bindId,
    newBindValue,
    bindName,
    remark
  });
}

/**
 * 删除用户绑定信息
 * @param bindId 绑定记录ID
 * @returns 删除结果
 */
export async function deleteUserBinding(bindId: number): Promise<ApiWrapper<any>> {
  return apiClient.post('/api/utility/proxy/user-binding/delete', { bindId });
} 