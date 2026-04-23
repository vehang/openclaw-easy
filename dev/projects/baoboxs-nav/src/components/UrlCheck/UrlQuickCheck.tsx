'use client';

import React, { useState } from 'react';
import { FiSearch, FiCheck, FiX, FiAlertTriangle, FiClock, FiShield } from 'react-icons/fi';
import { checkUrlAvailability } from '@/services/urlCheckApi';

interface CheckResult {
  platform: string;
  status: 'success' | 'blocked' | 'error' | 'loading';
  message: string;
  icon: 'check' | 'x' | 'alert' | 'clock';
}

export const UrlQuickCheck: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<CheckResult[]>([]);
  const [error, setError] = useState('');

  const handleCheck = async () => {
    if (!url.trim()) {
      setError('请输入要检测的URL');
      return;
    }

    // 简单的URL格式验证
    try {
      new URL(url);
    } catch {
      setError('请输入有效的URL格式（如：https://example.com）');
      return;
    }

    setError('');
    setIsChecking(true);
    setResults([
      { platform: '腾讯安全', status: 'loading', message: '检测中...', icon: 'clock' },
      { platform: '微信检测', status: 'loading', message: '检测中...', icon: 'clock' }
    ]);

    try {
      const response = await checkUrlAvailability(url);
      
      if (response.code === 0 && response.data) {
        const data = response.data;
        const newResults: CheckResult[] = [];

        // 处理腾讯安全检测结果
        if (data.results['qq.security'] !== undefined) {
          const isBlocked = !data.results['qq.security'];
          newResults.push({
            platform: '腾讯安全',
            status: isBlocked ? 'blocked' : 'success',
            message: isBlocked ? '检测到风险' : '检测正常',
            icon: isBlocked ? 'x' : 'check'
          });
        } else {
          const errorMsg = data.errorMessages['qq.security'] || '检测失败';
          newResults.push({
            platform: '腾讯安全',
            status: 'error',
            message: errorMsg,
            icon: 'alert'
          });
        }

        // 处理微信检测结果
        if (data.results['wxapi.work'] !== undefined) {
          const isBlocked = !data.results['wxapi.work'];
          newResults.push({
            platform: '微信检测',
            status: isBlocked ? 'blocked' : 'success',
            message: isBlocked ? '检测到风险' : '检测正常',
            icon: isBlocked ? 'x' : 'check'
          });
        } else {
          const errorMsg = data.errorMessages['wxapi.work'] || '检测失败';
          newResults.push({
            platform: '微信检测',
            status: 'error',
            message: errorMsg,
            icon: 'alert'
          });
        }

        setResults(newResults);
      } else {
        setError(response.errorMsg || '检测失败，请稍后重试');
        setResults([]);
      }
    } catch (error) {
      console.error('URL检测失败:', error);
      setError('网络错误，请检查网络连接后重试');
      setResults([]);
    } finally {
      setIsChecking(false);
    }
  };

  const getIcon = (iconType: string, status: string) => {
    const iconClass = `w-5 h-5 ${
      status === 'success' ? 'text-green-500' :
      status === 'blocked' ? 'text-red-500' :
      status === 'error' ? 'text-yellow-500' :
      'text-gray-500'
    }`;

    switch (iconType) {
      case 'check': return <FiCheck className={iconClass} />;
      case 'x': return <FiX className={iconClass} />;
      case 'alert': return <FiAlertTriangle className={iconClass} />;
      case 'clock': return <FiClock className={`${iconClass} animate-spin`} />;
      default: return <FiShield className={iconClass} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'blocked': return 'bg-red-50 border-red-200';
      case 'error': return 'bg-yellow-50 border-yellow-200';
      case 'loading': return 'bg-gray-50 border-gray-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <FiShield className="w-6 h-6 text-teal-600" />
          <h2 className="text-xl font-semibold text-gray-900">URL安全检测</h2>
        </div>

        <div className="space-y-4">
          {/* URL输入框 */}
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              要检测的URL地址
            </label>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="url"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="请输入完整的URL，如：https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  disabled={isChecking}
                />
              </div>
              <button
                onClick={handleCheck}
                disabled={isChecking || !url.trim()}
                className="px-3 sm:px-6 py-2 bg-teal-500 text-white font-medium rounded-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                title={isChecking ? '检测中...' : '开始检测'}
              >
                <FiSearch className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {isChecking ? '检测中...' : '开始检测'}
                </span>
              </button>
            </div>
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2">
                <FiAlertTriangle className="w-5 h-5 text-red-500" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* 检测结果 */}
          {results.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900">检测结果</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getIcon(result.icon, result.status)}
                        <div>
                          <h4 className="font-medium text-gray-900">{result.platform}</h4>
                          <p className="text-sm text-gray-600">{result.message}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 说明信息 */}
          <div className="mt-6 p-4 bg-teal-50 rounded-lg">
            <h4 className="font-medium text-teal-900 mb-2">检测说明</h4>
            <ul className="text-sm text-teal-800 space-y-1">
              <li>• 此检测服务基于腾讯安全和微信平台的API</li>
              <li>• 检测结果仅供参考，实际访问情况可能因网络环境而异</li>
              <li>• 无需登录即可使用，支持实时检测</li>
              <li>• 建议在发布链接前使用此工具进行预检测</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}; 