/**
 * API错误码常量
 * 集中管理所有API错误码，避免硬编码
 */
export const API_ERROR_CODES = {
  SUCCESS: 0,
  TOKEN_EXPIRED: 9996,
} as const;

export default API_ERROR_CODES;