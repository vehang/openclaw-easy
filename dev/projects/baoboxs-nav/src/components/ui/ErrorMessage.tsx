import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center space-x-3">
        <FaExclamationTriangle className="w-5 h-5 text-red-500" />
        <div className="flex-1">
          <p className="text-red-700 font-medium">操作失败</p>
          <p className="text-red-600 text-sm mt-1">{message}</p>
        </div>
      {onRetry && (
        <button
          onClick={onRetry}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
        >
          重试
        </button>
      )}
      </div>
    </div>
  );
};

export default ErrorMessage; 