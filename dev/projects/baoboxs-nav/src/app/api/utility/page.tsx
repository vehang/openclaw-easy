import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '实用工具API - 程序员宝盒',
  description: '提供各种实用功能的API接口，包括网站检测、代理服务、短链生成等。',
};

const UtilityApiPage = () => {
  const apis = [
    {
      name: '网站检测API',
      description: '检测网站是否可访问，支持HTTP状态码、响应时间等信息',
      endpoint: '/api/utility/check-site',
      method: 'POST',
      href: '/api/utility/check-site',
      category: 'monitoring',
      params: ['url', 'timeout', 'follow_redirects']
    },
    {
      name: '代理服务API',
      description: '提供HTTP代理服务，支持跨域请求和数据获取',
      endpoint: '/api/utility/proxy',
      method: 'GET',
      href: '/api/utility/proxy',
      category: 'network',
      params: ['target_url', 'method', 'headers']
    },
    {
      name: '短链生成API',
      description: '将长链接转换为短链接，便于分享和统计',
      endpoint: '/api/utility/short-url',
      method: 'POST',
      href: '/api/utility/short-url',
      category: 'tools',
      params: ['long_url', 'custom_code', 'expire_time']
    },
    {
      name: '二维码生成API',
      description: '生成各种类型的二维码，支持自定义大小和格式',
      endpoint: '/api/utility/qr-code',
      method: 'POST',
      href: '/api/utility/qr-code',
      category: 'tools',
      params: ['content', 'size', 'format']
    },
    {
      name: '邮件发送API',
      description: '发送邮件通知，支持HTML格式和附件',
      endpoint: '/api/utility/send-email',
      method: 'POST',
      href: '/api/utility/send-email',
      category: 'communication',
      params: ['to', 'subject', 'content', 'attachments']
    },
    {
      name: '文件上传API',
      description: '安全的文件上传服务，支持多种文件格式',
      endpoint: '/api/utility/upload',
      method: 'POST',
      href: '/api/utility/upload',
      category: 'storage',
      params: ['file', 'path', 'overwrite']
    }
  ];

  const categories = [
    { id: 'monitoring', name: '监控检测', icon: '📊', color: 'bg-blue-100 text-blue-800' },
    { id: 'network', name: '网络服务', icon: '🌐', color: 'bg-green-100 text-green-800' },
    { id: 'tools', name: '工具生成', icon: '🔧', color: 'bg-orange-100 text-orange-800' },
    { id: 'communication', name: '通信服务', icon: '📧', color: 'bg-purple-100 text-purple-800' },
    { id: 'storage', name: '存储服务', icon: '💾', color: 'bg-gray-100 text-gray-800' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">实用工具API</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            提供各种实用功能的API接口，包括网站检测、代理服务、工具生成等
          </p>
        </div>

        {/* 返回链接 */}
        <div className="mb-8">
          <Link 
            href="/api" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回API首页
          </Link>
        </div>

        {/* API分类展示 */}
        {categories.map((category) => {
          const categoryApis = apis.filter(api => api.category === category.id);
          
          if (categoryApis.length === 0) return null;

          return (
            <div key={category.id} className="mb-12">
              <div className="flex items-center mb-6">
                <span className="text-2xl mr-3">{category.icon}</span>
                <h2 className="text-2xl font-semibold text-gray-800">{category.name}</h2>
                <span className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${category.color}`}>
                  {categoryApis.length} 个接口
                </span>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {categoryApis.map((api) => (
                  <div
                    key={api.name}
                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200"
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-gray-900">{api.name}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          api.method === 'GET' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {api.method}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{api.description}</p>
                      
                      <div className="bg-gray-50 rounded p-3 mb-4">
                        <code className="text-sm text-gray-800 break-all">{api.endpoint}</code>
                      </div>
                      
                      {/* 参数列表 */}
                      <div className="mb-4">
                        <div className="text-sm font-medium text-gray-900 mb-2">主要参数：</div>
                        <div className="flex flex-wrap gap-2">
                          {api.params.map((param) => (
                            <span
                              key={param}
                              className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded border border-blue-200"
                            >
                              {param}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex space-x-3">
                        <Link
                          href={api.href}
                          className="flex-1 text-center py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                        >
                          查看文档
                        </Link>
                        <button className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200">
                          在线测试
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* 使用示例 */}
        <div className="bg-white rounded-lg shadow-md p-8 mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">快速开始</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* JavaScript示例 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">JavaScript 调用示例</h3>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-100">
{`// 网站检测API调用示例
fetch('/api/utility/check-site', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://example.com',
    timeout: 5000
  })
})
.then(response => response.json())
.then(data => console.log(data));`}
                </pre>
              </div>
            </div>
            
            {/* cURL示例 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">cURL 调用示例</h3>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-100">
{`# 网站检测API调用示例
curl -X POST \\
  /api/utility/check-site \\
  -H 'Content-Type: application/json' \\
  -d '{
    "url": "https://example.com",
    "timeout": 5000
  }'`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UtilityApiPage; 