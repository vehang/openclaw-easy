import React from 'react';

interface LoadingProps {
  title?: string;
  subtitle?: string;
  showProgress?: boolean;
  variant?: 'simple' | 'complex';
  size?: 'sm' | 'md' | 'lg';
}

const Loading: React.FC<LoadingProps> = ({ 
  title = "正在加载数据",
  subtitle = "请稍候...",
  showProgress = true,
  variant = 'complex',
  size = 'lg'
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20', 
    lg: 'w-24 h-24'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  if (variant === 'simple') {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <div className={`animate-spin rounded-full border-b-2 border-teal-500 ${sizeClasses[size]} mb-2`}></div>
        {title && <p className={`text-gray-600 ${textSizeClasses[size]}`}>{title}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center">
      {/* 更美观的加载动画 */}
      <div className={`relative ${sizeClasses[size]}`}>
        <div className="absolute top-0 right-0 bottom-0 left-0 border-4 border-gray-200 border-t-[#00bba7] rounded-full animate-spin transform-gpu"></div>
        <div className="absolute top-3 right-3 bottom-3 left-3 border-4 border-gray-200 border-b-[#00bba7] rounded-full animate-spin animation-delay-150 transform-gpu"></div>
        <div className="absolute top-6 right-6 bottom-6 left-6 border-4 border-gray-200 border-l-[#00bba7] rounded-full animate-spin animation-delay-300 transform-gpu"></div>
      </div>
      
      {/* 加载文字 */}
      <div className="mt-8 text-center">
        <h3 className={`font-medium text-gray-900 mb-2 ${textSizeClasses[size]}`}>{title}</h3>
        {subtitle && <p className="text-gray-500">{subtitle}</p>}
      </div>
      
      {/* 加载进度条 */}
      {showProgress && (
        <div className="w-64 h-1.5 bg-gray-200 rounded-full mt-6 overflow-hidden">
          <div className="h-full bg-[#00bba7] rounded-full animate-progress"></div>
        </div>
      )}
    </div>
  );
};

export default Loading; 