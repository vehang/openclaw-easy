"use client";

import React, { useEffect } from 'react';
import { FaExclamationCircle, FaTimes } from 'react-icons/fa';
import { useScrollLock } from '@/hooks/useScrollLock';

interface ErrorModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  title = '操作失败',
  message,
  confirmText = '确定',
  onClose,
  autoClose = false,
  autoCloseDelay = 3000
}) => {
  // 弹窗滚动锁定
  useScrollLock(isOpen);

  // 自动关闭逻辑
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 overflow-hidden relative border border-gray-200"
           style={{ boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' }}>
        
        {/* 关闭按钮 */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 z-10"
        >
          <FaTimes className="text-lg" />
        </button>
        
        {/* 标题 */}
        <div className="px-6 pt-5 pb-3">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mt-4"></div>
        </div>

        {/* 内容 */}
        <div className="px-6 pb-6">
          <div className="flex items-start">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
              <FaExclamationCircle className="text-red-600 text-xl" />
            </div>
            <div className="flex-1">
              <p className="text-gray-700 leading-relaxed">{message}</p>
            </div>
          </div>
          
          {/* 按钮 */}
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="flex items-center justify-center rounded-md transition-colors px-4 py-1.5 text-sm text-white bg-red-500 hover:bg-red-600"
            >
              {confirmText}
            </button>
          </div>
          
          {/* 自动关闭进度条 */}
          {autoClose && (
            <div className="mt-4">
              <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 rounded-full transition-all ease-linear"
                  style={{ 
                    width: '100%',
                    animation: `shrink ${autoCloseDelay}ms linear forwards`
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">窗口将自动关闭</p>
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default ErrorModal; 