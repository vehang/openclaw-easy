/**
 * GzhLogin - 公众号验证码登录组件
 * 从 LoginModal.tsx 拆分
 */

import React from 'react';
import Image from 'next/image';
import { FaKey, FaTimes } from 'react-icons/fa';

interface GzhLoginProps {
  gzhCode: string;
  isSubmitting: boolean;
  error: string;
  onCodeChange: (value: string) => void;
  onSubmit: () => void;
}

export const GzhLogin: React.FC<GzhLoginProps> = ({
  gzhCode,
  isSubmitting,
  error,
  onCodeChange,
  onSubmit,
}) => {
  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <div className="flex items-center mb-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
          style={{ background: 'linear-gradient(135deg, #12b8a6 0%, #0d9488 100%)' }}
        >
          <FaKey className="text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[#2a8a84]">公众号验证码登录</h3>
          <p className="text-xs text-gray-500">输入公众号验证码快速登录</p>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="flex flex-col sm:flex-row gap-8 items-start">
          {/* 二维码部分 */}
          <div className="flex flex-col items-center">
            <p className="text-xs font-medium text-gray-600 mb-2">第一步：扫码关注</p>
            <div
              className="p-3 bg-white rounded-lg shadow-md"
              style={{ width: '150px', height: '150px' }}
            >
              <Image
                src="/icons/qrcode.jpg"
                alt="公众号二维码"
                width={124}
                height={124}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* 验证码输入部分 */}
          <div className="flex flex-col items-start">
            <p className="text-xs font-medium text-gray-600 mb-2">第二步：输入验证码</p>
            <p className="text-sm text-gray-600 mb-3">
              发送"<span className="font-semibold text-[#2a8a84]">登录</span>"获取验证码
            </p>

            <div className="flex flex-col">
              <div className="flex gap-3 items-center">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="验证码"
                    value={gzhCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      onCodeChange(value);
                    }}
                    className="w-32 px-3 py-1.5 pr-8 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2a8a84]/20 focus:border-[#2a8a84] transition-all text-center text-base font-mono tracking-widest border-gray-200 bg-white hover:border-gray-300"
                    maxLength={6}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    disabled={isSubmitting}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && gzhCode.length >= 4 && !isSubmitting) {
                        onSubmit();
                      }
                    }}
                  />
                  {gzhCode && (
                    <button
                      type="button"
                      onClick={() => onCodeChange('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <button
                  onClick={onSubmit}
                  disabled={isSubmitting || !gzhCode || gzhCode.length < 4}
                  className="w-20 px-5 py-1.5 bg-gradient-to-r from-[#12b8a6] to-[#0d9488] text-white rounded-lg hover:from-[#0d9488] hover:to-[#0f766e] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    '验证'
                  )}
                </button>
              </div>
              {error && (
                <p className="mt-1.5 text-xs text-red-500 max-w-[210px] line-clamp-2 break-words">
                  {error}
                </p>
              )}
            </div>

            <div className="mt-4 text-xs text-gray-500 space-y-1">
              <p>• 验证码为4-6位纯数字</p>
              <p>• 有效期5分钟，使用一次后自动失效</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GzhLogin;