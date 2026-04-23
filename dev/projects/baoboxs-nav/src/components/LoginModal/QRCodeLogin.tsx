/**
 * QRCodeLogin - 公众号扫码登录组件
 * 从 LoginModal.tsx 拆分
 */

import React from 'react';
import Image from 'next/image';
import { FaQrcode } from 'react-icons/fa';

interface QRCodeLoginProps {
  captchaCode: string;
  captchaLoading: boolean;
  captchaError: boolean;
  countdown: number;
  initialDuration: number;
  error: string;
  onRefresh: () => void;
  formatCountdown: () => string;
}

export const QRCodeLogin: React.FC<QRCodeLoginProps> = ({
  captchaCode,
  captchaLoading,
  captchaError,
  countdown,
  initialDuration,
  error,
  onRefresh,
  formatCountdown,
}) => {
  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <div className="flex items-center mb-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
          style={{ background: 'linear-gradient(135deg, #12b8a6 0%, #0d9488 100%)' }}
        >
          <FaQrcode className="text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[#2a8a84]">公众号扫码登录</h3>
          <p className="text-xs text-gray-500">扫码关注公众号，快速登录/注册</p>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-3 bg-red-50 text-red-500 text-sm rounded-lg border border-red-100">
          {error}
        </div>
      )}

      <div className="flex justify-center">
        <div className="flex flex-col sm:flex-row gap-8 items-start">
          {/* 二维码部分 */}
          <div className="flex flex-col items-center">
            <p className="text-xs font-medium text-gray-600 mb-2">第一步：扫码关注</p>
            <div
              className="p-3 bg-white rounded-lg shadow-md relative overflow-hidden"
              style={{ width: '150px', height: '150px' }}
            >
              {captchaLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10">
                  <div className="w-10 h-10 border-4 border-[#12b8a6] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <Image
                src="/icons/qrcode.jpg"
                alt="公众号二维码"
                width={124}
                height={124}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* 验证码信息部分 */}
          <div className="flex flex-col items-start">
            <p className="text-xs font-medium text-gray-600 mb-2">第二步：公众号发送下方验证码</p>

            {captchaError ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-red-600">获取验证码失败</p>
                <button
                  onClick={onRefresh}
                  className="px-5 py-1.5 bg-gradient-to-r from-[#12b8a6] to-[#0d9488] text-white rounded-lg hover:from-[#0d9488] hover:to-[#0f766e] transition-all duration-300 shadow-lg hover:shadow-xl text-sm font-medium"
                >
                  重新获取
                </button>
              </div>
            ) : countdown > 0 && !isNaN(countdown) && captchaCode ? (
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                <p className="text-2xl font-bold text-[#2a8a84] mb-1 tracking-wider">{captchaCode}</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500">剩余时间</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      countdown > initialDuration / 3
                        ? 'bg-green-100 text-green-700'
                        : countdown > initialDuration / 6
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {formatCountdown()}
                  </span>
                </div>
              </div>
            ) : !captchaCode ? (
              <div className="flex items-center gap-2 text-[#2a8a84]">
                <div className="w-4 h-4 border-2 border-[#2a8a6] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">正在获取验证码...</span>
              </div>
            ) : (
              <button
                onClick={onRefresh}
                className="flex items-center gap-1 px-3 py-2 bg-white rounded-lg shadow-sm border border-gray-100 text-xs text-teal-600 hover:text-teal-700 hover:border-teal-200 transition-all"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                刷新验证码
              </button>
            )}

            <div className="mt-4 text-xs text-gray-500 space-y-1">
              <p>• 验证码仅使用一次</p>
              <p>• 窗口关闭即失效</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeLogin;