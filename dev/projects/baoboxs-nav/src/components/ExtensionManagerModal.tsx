"use client";

import React, { useState, useEffect } from 'react';
import { FaTimes, FaCopy, FaExternalLinkAlt, FaChrome, FaFirefox, FaEdge } from 'react-icons/fa';
import { useScrollLock } from '@/hooks/useScrollLock';

interface ExtensionManagerModalProps {
  isOpen: boolean;
  browserName: string;
  extensionUrl: string;
  onClose: () => void;
}

const ExtensionManagerModal: React.FC<ExtensionManagerModalProps> = ({
  isOpen,
  browserName,
  extensionUrl,
  onClose
}) => {
  const [copySuccess, setCopySuccess] = useState(false);

  // 弹窗滚动锁定
  useScrollLock(isOpen);

  if (!isOpen) return null;

  // 获取浏览器图标
  const getBrowserIcon = () => {
    const iconClass = "text-2xl";
    if (browserName.includes('Chrome')) {
      return <FaChrome className={`${iconClass} text-blue-500`} />;
    } else if (browserName.includes('Edge')) {
      return <FaEdge className={`${iconClass} text-blue-600`} />;
    } else if (browserName.includes('Firefox')) {
      return <FaFirefox className={`${iconClass} text-orange-500`} />;
    } else {
      return <FaChrome className={`${iconClass} text-gray-500`} />;
    }
  };

  // 复制地址到剪贴板
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(extensionUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      // 降级方案：选择文本
      const textArea = document.createElement('textarea');
      textArea.value = extensionUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // 获取菜单操作说明
  const getMenuInstructions = () => {
    if (browserName.includes('Chrome') || browserName.includes('Edge')) {
      return '点击浏览器右上角三个点（⋮） → 更多工具 → 扩展程序';
    } else if (browserName.includes('Firefox')) {
      return '点击浏览器右上角菜单（≡） → 附加组件和主题';
    } else {
      return '通过浏览器菜单找到扩展程序管理';
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg mx-4 overflow-hidden relative border border-gray-200"
           style={{ boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' }}>
        
        {/* 关闭按钮 */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 z-10 transition-colors"
        >
          <FaTimes className="text-lg" />
        </button>
        
        {/* 标题 */}
        <div className="px-6 pt-5 pb-3">
          <div className="flex items-center">
            {getBrowserIcon()}
            <h2 className="text-lg font-semibold text-gray-900 ml-3">打开插件管理页面</h2>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mt-4"></div>
        </div>

        {/* 内容 */}
        <div className="px-6 pb-6">
          <div className="mb-4">
            <p className="text-gray-600 mb-3">您使用的是 <span className="font-medium text-gray-800">{browserName}</span></p>
            
            {/* 地址显示框 */}
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <code className="text-sm text-gray-800 flex-1 break-all">{extensionUrl}</code>
                <button
                  onClick={copyToClipboard}
                  className={`ml-2 px-3 py-1 rounded text-sm font-medium transition-all ${
                    copySuccess 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-[#00bba7] text-white hover:bg-[#009688]'
                  }`}
                >
                  <FaCopy className="inline mr-1" />
                  {copySuccess ? '已复制！' : '复制'}
                </button>
              </div>
            </div>

            {/* 操作说明 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-blue-800 mb-2">📋 操作说明：</h4>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. 点击上方"复制"按钮复制地址</li>
                <li>2. 在浏览器地址栏粘贴（Ctrl+V）</li>
                <li>3. 按回车键打开插件管理页面</li>
              </ol>
            </div>

            {/* 其他方式 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-800 mb-2">🔧 其他打开方式：</h4>
              <p className="text-sm text-gray-600">{getMenuInstructions()}</p>
            </div>
          </div>
          
          {/* 按钮 */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="flex items-center justify-center rounded-md transition-colors px-4 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtensionManagerModal; 