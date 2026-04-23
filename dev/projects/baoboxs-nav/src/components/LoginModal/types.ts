/**
 * LoginModal 类型定义
 */

export type LoginTab = 'password' | 'qrcode' | 'gzh';

export interface LoginModalProps {
  onClose: (reason?: 'manual' | 'success') => void;
}

export interface CaptchaResponse {
  code: number;
  data: {
    code: string;
    expireTime: string;
    token?: string;
  };
  errorMsg?: string;
}

export interface LoginResponse {
  code: number;
  data?: {
    token?: string;
    userName?: string;
    username?: string;
    [key: string]: any;
  };
  errorMsg?: string;
}