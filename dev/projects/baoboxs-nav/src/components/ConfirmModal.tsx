"use client";

import React, { useEffect } from 'react';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import { useScrollLock } from '@/hooks/useScrollLock';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'warning' | 'danger' | 'info';
  isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = '确定',
  cancelText = '取消',
  onConfirm,
  onCancel,
  type = 'warning',
  isLoading = false
}) => {
  // 弹窗滚动锁定
  useScrollLock(isOpen);

  if (!isOpen) return null;

  const getIconAndColor = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <FaExclamationTriangle className="text-red-600 text-xl" />,
          iconBg: 'bg-red-100',
          confirmBg: 'bg-red-500 hover:bg-red-600'
        };
      case 'info':
        return {
          icon: <FaExclamationTriangle className="text-blue-600 text-xl" />,
          iconBg: 'bg-blue-100',
          confirmBg: 'bg-teal-500 hover:bg-teal-600'
        };
      default: // warning
        return {
          icon: <FaExclamationTriangle className="text-orange-600 text-xl" />,
          iconBg: 'bg-orange-100',
          confirmBg: 'bg-orange-500 hover:bg-orange-600'
        };
    }
  };

  const { icon, iconBg, confirmBg } = getIconAndColor();

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 overflow-hidden relative border border-gray-200"
           style={{ boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' }}>
        
        {/* 关闭按钮 */}
        <button 
          onClick={onCancel}
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
            <div className={`w-12 h-12 ${iconBg} rounded-full flex items-center justify-center mr-4 flex-shrink-0`}>
              {icon}
            </div>
            <div className="flex-1">
              <p className="text-gray-700 leading-relaxed">{message}</p>
            </div>
          </div>
          
          {/* 按钮 */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex items-center justify-center rounded-md transition-colors px-4 py-1.5 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex items-center justify-center rounded-md transition-colors px-4 py-1.5 text-sm text-white ${confirmBg} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  {confirmText}
                </div>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal; 