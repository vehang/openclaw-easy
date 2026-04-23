"use client";

import React, { useEffect } from 'react';
import { FaCheck, FaPaperPlane, FaHeart, FaThumbsUp } from 'react-icons/fa';
import { useScrollLock } from '@/hooks/useScrollLock';

interface SuccessModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  icon?: 'check' | 'paper-plane' | 'heart' | 'thumbs-up';
  autoClose?: boolean;
  autoCloseDelay?: number;
  onClose?: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  title,
  message,
  icon = 'check',
  autoClose = true,
  autoCloseDelay = 2000,
  onClose
}) => {
  // 弹窗滚动锁定
  useScrollLock(isOpen);

  useEffect(() => {
    if (isOpen && autoClose && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  const getIcon = () => {
    const iconClass = "text-green-600 text-xl";
    switch (icon) {
      case 'paper-plane':
        return <FaPaperPlane className={iconClass} />;
      case 'heart':
        return <FaHeart className={iconClass} />;
      case 'thumbs-up':
        return <FaThumbsUp className={iconClass} />;
      default:
        return <FaCheck className={iconClass} />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 overflow-hidden relative border border-gray-200"
           style={{ boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' }}>
        
        {/* 间隔线 */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mt-4 mb-4"></div>
        
        <div className="px-6 pb-6">
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {getIcon()}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600">{message}</p>
            {autoClose && (
              <div className="mt-4">
                <div className="w-8 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full transition-all ease-linear"
                    style={{ 
                      width: '100%',
                      animation: `shrink ${autoCloseDelay}ms linear forwards`
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">窗口将自动关闭</p>
              </div>
            )}
          </div>
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

export default SuccessModal; 