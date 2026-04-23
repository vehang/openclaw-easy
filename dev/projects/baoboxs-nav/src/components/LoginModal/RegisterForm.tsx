/**
 * RegisterForm - 注册表单组件
 * 从 LoginModal.tsx 拆分
 */

import React from 'react';
import { FaUser, FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';

interface RegisterFormProps {
  username: string;
  password: string;
  confirmPassword: string;
  nickname: string;
  email: string;
  showRegisterPassword: boolean;
  showConfirmPassword: boolean;
  error: string;
  isLoading: boolean;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onNicknameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onToggleRegisterPassword: () => void;
  onToggleConfirmPassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
  validateUsername: (value: string) => boolean;
  validateNickname: (value: string) => boolean;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  username,
  password,
  confirmPassword,
  nickname,
  email,
  showRegisterPassword,
  showConfirmPassword,
  error,
  isLoading,
  onUsernameChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onNicknameChange,
  onEmailChange,
  onToggleRegisterPassword,
  onToggleConfirmPassword,
  onSubmit,
  validateUsername,
  validateNickname,
}) => {
  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <div className="flex items-center mb-6">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
          style={{ background: 'linear-gradient(135deg, #12b8a6 0%, #0d9488 100%)' }}
        >
          <FaUser className="text-white text-sm" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[#2a8a84]">完善账号信息</h3>
          <p className="text-xs text-gray-500">只有初次登录时需要完善基础信息</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-500 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        {/* 使用两列布局优化字段展示 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 左列 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">用户名 *</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="6-18位字母数字下划线"
                  value={username}
                  tabIndex={1}
                  onChange={(e) => onUsernameChange(e.target.value)}
                  className={`w-full px-4 py-2.5 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2a8a84]/20 focus:border-[#2a8a84] transition-all ${
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">密码 *</label>
              <div className="relative">
                <input
                  type={showRegisterPassword ? 'text' : 'password'}
                  placeholder="请输入密码（至少6位）"
                  value={password}
                  tabIndex={3}
                  autoComplete="new-password"
                  onChange={(e) => onPasswordChange(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2a8a84]/20 focus:border-[#2a8a84] transition-all bg-white hover:border-gray-300"
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
                  onClick={onToggleRegisterPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showRegisterPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">确认密码 *</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="请再次输入密码"
                  value={confirmPassword}
                  tabIndex={4}
                  autoComplete="new-password"
                  onChange={(e) => onConfirmPasswordChange(e.target.value)}
                  className={`w-full px-4 py-2.5 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2a8a84]/20 focus:border-[#2a8a84] transition-all ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-red-300 bg-red-50/50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  style={{ fontSize: '16px' }}
                />
                {confirmPassword && (
                  <button
                    type="button"
                    onClick={() => onConfirmPasswordChange('')}
                    className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FaTimes className="w-3 h-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onToggleConfirmPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1.5 text-xs text-red-500">两次输入的密码不一致</p>
              )}
            </div>
          </div>

          {/* 右列 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">昵称 *</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="2-20字符，支持中英文"
                  value={nickname}
                  tabIndex={2}
                  onChange={(e) => onNicknameChange(e.target.value)}
                  className={`w-full px-4 py-2.5 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2a8a84]/20 focus:border-[#2a8a84] transition-all ${
                    nickname && !validateNickname(nickname)
                      ? 'border-red-300 bg-red-50/50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                />
                {nickname && (
                  <button
                    type="button"
                    onClick={() => onNicknameChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FaTimes className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">电子邮箱 *</label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="请输入您的邮箱"
                  value={email}
                  tabIndex={5}
                  onChange={(e) => {
                    const value = e.target.value;
                    const filteredValue = value.replace(/[^a-zA-Z0-9@._\-\u4e00-\u9fa5]/g, '');
                    onEmailChange(filteredValue);
                  }}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2a8a84]/20 focus:border-[#2a8a84] transition-all bg-white hover:border-gray-300"
                />
                {email && (
                  <button
                    type="button"
                    onClick={() => onEmailChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FaTimes className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* 占位div，保持布局平衡 */}
            <div className="flex items-end">
              <div className="text-xs text-gray-500">
                <p>* 为必填项</p>
                <p className="mt-1">昵称将作为您的显示名称</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            disabled={isLoading}
            tabIndex={6}
            className="w-full py-3 bg-gradient-to-r from-[#12b8a6] to-[#0d9488] text-white rounded-lg hover:from-[#0d9488] hover:to-[#0f766e] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#2a8a84]/50 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? '提交中...' : '完成注册'}
          </button>
          <p className="mt-2 text-xs text-gray-500 text-center">
            注册成功后将自动登录
          </p>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;