'use client';

import React, { useState, useEffect } from 'react';

interface ExtensionDownloadProps {
  className?: string;
  showDescription?: boolean;
}

export default function ExtensionDownload({ className = '', showDescription = true }: ExtensionDownloadProps) {
  const [currentEnv, setCurrentEnv] = useState<'production' | 'development' | 'test'>('production');

  useEffect(() => {
    // 检测当前环境
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('dev')) {
      setCurrentEnv('development');
    } else if (hostname.includes('test') || hostname.includes('staging')) {
      setCurrentEnv('test');
    } else {
      setCurrentEnv('production');
    }
  }, []);

  const downloadExtension = () => {
    const extensionFiles = {
      production: '/extensions/baoboxs-extension-production-v1.0.zip',
      development: '/extensions/baoboxs-extension-development-v1.0.zip',
      test: '/extensions/baoboxs-extension-test-v1.0.zip'
    };

    const fileName = extensionFiles[currentEnv];
    
    // 创建下载链接
    const link = document.createElement('a');
    link.href = fileName;
    link.download = fileName.split('/').pop() || 'baoboxs-extension.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getEnvName = () => {
    const envNames = {
      production: '正式版',
      development: '开发版',
      test: '测试版'
    };
    return envNames[currentEnv];
  };

  const getEnvDescription = () => {
    const descriptions = {
      production: '稳定可靠，推荐日常使用',
      development: '最新功能，可能存在bug',
      test: '内测版本，仅供测试使用'
    };
    return descriptions[currentEnv];
  };

  return (
    <div className={`text-center ${className}`}>
      {showDescription && (
        <div className="mb-4">
          <div className="inline-flex items-center bg-blue-50 px-3 py-1 rounded-full text-sm text-blue-700 mb-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            当前环境：{getEnvName()}
          </div>
          <p className="text-gray-600 text-sm">
            {getEnvDescription()}
          </p>
        </div>
      )}
      
      <button
        onClick={downloadExtension}
        className="inline-flex items-center bg-[#00bba7] hover:bg-[#009688] text-white font-medium px-6 py-3 rounded-lg transition-colors shadow-md hover:shadow-lg"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 mr-2" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
          />
        </svg>
        下载插件 ({getEnvName()})
      </button>
      
      <div className="mt-3 text-xs text-gray-500">
        系统已自动检测环境并选择对应版本
      </div>
    </div>
  );
} 