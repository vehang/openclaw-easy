/**
 * LoginForm - 密码登录表单组件
 * 从 LoginModal.tsx 拆分
 */

import React from 'react';
import { FaUser, FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';

interface LoginFormProps {
  username: string;
  password: string;
  showPassword: boolean;
  error: string;
  isLoading: boolean;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onSwitchToRegister: () => void;
  validateUsername: (value: string) => boolean;
  validatePassword: (value: string) => boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  username,
  password,
  showPassword,
  error,
  isLoading,
  onUsernameChange,
  onPasswordChange,
  onTogglePassword,
  onSubmit,
  onSwitchToRegister,
  validateUsername,
  validatePassword,
}) => {
  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <div className="flex items-center mb-6">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
          style={{ background: 'linear-gradient(135deg, #12b8a6 0%, #0d9488 100%)' }}
        >
          <FaUser className="text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[#2a8a84]">账号密码登录</h3>
          <p className="text-xs text-gray-500">使用您注册的账号登录</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-500 text-sm rounded-lg border border-red-100 animate-shake">
            {error}
          </div>
        )}

        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
            <div className="relative">
              <input
                type="text"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => {
                  const value = e.target.value;
                  onUsernameChange(value);
                }}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2a8a84]/20 focus:border-[#2a8a84] transition-all ${
                  username && !validateUsername(username)
                    ? 'border-red-300 bg-red-50/50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              />
              {username && (
                <button
                  type="button"
                  onClick={() => onUsernameChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaTimes className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="请输入密码（至少6位）"
                value={password}
                autoComplete="new-password"
                onChange={(e) => onPasswordChange(e.target.value)}
                className={`w-full px-4 py-2.5 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2a8a84]/20 focus:border-[#2a8a84] transition-all ${
                  password && !validatePassword(password)
                    ? 'border-red-300 bg-red-50/50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                style={{ fontSize: '16px' }}
              />
              {password && (
                <button
                  type="button"
                  onClick={() => onPasswordChange('')}
                  className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaTimes className="w-3 h-3" />
                </button>
              )}
              <button
                type="button"
                onClick={onTogglePassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-gradient-to-r from-[#12b8a6] to-[#0d9488] text-white rounded-lg hover:from-[#0d9488] hover:to-[#0f766e] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#2a8a84]/50 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isLoading ? '登录中...' : '登录'}
        </button>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-sm text-[#2a8a84] hover:text-[#0d9488] transition-colors"
          >
            还没有账号？点击注册 →
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;