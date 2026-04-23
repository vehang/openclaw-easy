import React from 'react';

interface OverlayLoadingProps {
  isVisible: boolean;
  message?: string;
}

const OverlayLoading: React.FC<OverlayLoadingProps> = ({ 
  isVisible, 
  message = "正在更新数据..." 
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center min-w-[200px]">
        {/* 多层旋转圆环 */}
        <div className="relative mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-teal-500"></div>
          <div className="absolute inset-0 animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-teal-400" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          <div className="absolute inset-2 animate-spin rounded-full h-8 w-8 border-2 border-transparent border-t-teal-300" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
        </div>
        
        {/* 消息文字 */}
        <p className="text-gray-700 text-sm font-medium">{message}</p>
        
        {/* 进度条 */}
        <div className="w-full bg-gray-200 rounded-full h-1 mt-4 overflow-hidden">
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 h-1 rounded-full animate-pulse" style={{ width: '60%' }}></div>
        </div>
      </div>
    </div>
  );
};

export default OverlayLoading; 