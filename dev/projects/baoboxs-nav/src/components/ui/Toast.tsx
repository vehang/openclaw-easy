'use client';

import React, { useState, useEffect } from 'react';
import { FaCheck, FaExclamationTriangle, FaInfo, FaTimes, FaExclamationCircle } from 'react-icons/fa';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // 立即显示Toast
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    // 自动关闭逻辑
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300); // 等待动画完成
    }, duration + 100);

    // 进度条动画
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) return 0;
        return prev - (100 / (duration / 100));
      });
    }, 100);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(timer);
      clearInterval(progressTimer);
    };
  }, [duration, id, onClose]);

  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return {
          icon: <FaCheck className="w-4 h-4" />,
          bgColor: 'bg-green-500',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600'
        };
      case 'error':
        return {
          icon: <FaExclamationCircle className="w-4 h-4" />,
          bgColor: 'bg-red-500',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600'
        };
      case 'warning':
        return {
          icon: <FaExclamationTriangle className="w-4 h-4" />,
          bgColor: 'bg-yellow-500',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600'
        };
      case 'info':
        return {
          icon: <FaInfo className="w-4 h-4" />,
          bgColor: 'bg-blue-500',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600'
        };
    }
  };

  const { icon, bgColor, borderColor, textColor, iconBg, iconColor } = getIconAndColor();

  return (
    <div
      className={`
        w-full min-w-[320px] max-w-[400px]
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
      `}
    >
      <div className={`
        bg-white rounded-lg shadow-2xl border ${borderColor}
        overflow-hidden backdrop-blur-sm bg-opacity-95
      `}>
        {/* 进度条 */}
        <div className={`h-1 ${bgColor} transition-all duration-100 ease-linear`} 
             style={{ width: `${progress}%` }} />
        
        {/* 内容 */}
        <div className="p-4">
          <div className="flex items-start">
            {/* 图标 */}
            <div className={`w-10 h-10 ${iconBg} rounded-full flex items-center justify-center mr-3 flex-shrink-0`}>
              <div className={iconColor}>
                {icon}
              </div>
            </div>
            
            {/* 文本内容 */}
            <div className="flex-1 min-w-0">
              <h4 className={`font-semibold ${textColor} text-sm leading-tight`}>
                {title}
              </h4>
              {message && (
                <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                  {message}
                </p>
              )}
            </div>
            
            {/* 关闭按钮 */}
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => onClose(id), 300);
              }}
              className="ml-3 p-1 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toast; 