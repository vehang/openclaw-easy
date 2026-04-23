import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '公共API - 程序员宝盒',
  description: '提供各种公共数据接口服务，包括天气查询、地理位置、汇率查询等。',
};

const PublicApiPage = () => {
  const apis = [
    {
      name: '天气查询API',
      description: '获取实时天气信息和天气预报',
      endpoint: '/api/public/weather',
      method: 'GET',
      href: '/api/public/weather',
      category: 'weather',
      params: ['city', 'lat', 'lon']
    },
    {
      name: '地理位置API',
      description: '根据IP地址或经纬度获取地理位置信息',
      endpoint: '/api/public/location',
      method: 'GET',
      href: '/api/public/location',
      category: 'location',
      params: ['ip', 'lat', 'lon']
    },
    {
      name: '汇率查询API',
      description: '获取实时汇率和货币转换',
      endpoint: '/api/public/exchange-rate',
      method: 'GET',
      href: '/api/public/exchange-rate',
      category: 'finance',
      params: ['from', 'to', 'amount']
    },
    {
      name: '新闻资讯API',
      description: '获取最新新闻资讯和文章',
      endpoint: '/api/public/news',
      method: 'GET',
      href: '/api/public/news',
      category: 'news',
      params: ['category', 'keyword', 'page']
    },
    {
      name: '股票信息API',
      description: '查询股票价格和市场信息',
      endpoint: '/api/public/stock',
      method: 'GET',
      href: '/api/public/stock',
      category: 'finance',
      params: ['symbol', 'market']
    },
    {
      name: '节假日查询API',
      description: '查询各国节假日信息',
      endpoint: '/api/public/holidays',
      method: 'GET',
      href: '/api/public/holidays',
      category: 'calendar',
      params: ['country', 'year']
    }
  ];

  const categories = [
    { id: 'weather', name: '天气服务', icon: '🌤️', color: 'bg-blue-100 text-blue-800' },
    { id: 'location', name: '地理服务', icon: '📍', color: 'bg-green-100 text-green-800' },
    { id: 'finance', name: '金融数据', icon: '💰', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'news', name: '新闻资讯', icon: '📰', color: 'bg-purple-100 text-purple-800' },
    { id: 'calendar', name: '日历服务', icon: '📅', color: 'bg-red-100 text-red-800' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">公共API</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            提供各种公共数据接口服务，免费开放使用
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
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
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

        {/* 使用限制说明 */}
        <div className="bg-white rounded-lg shadow-md p-8 mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">使用说明</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 使用限制 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">使用限制</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  免费使用，无需注册
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">⚠</span>
                  每日限制1000次请求
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">⚠</span>
                  单次请求超时30秒
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  不支持商业用途
                </li>
              </ul>
            </div>
            
            {/* 响应格式 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">响应格式</h3>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-100">
{`{
  "code": 200,
  "message": "success",
  "data": {
    // API返回的具体数据
  },
  "timestamp": "2024-01-01T00:00:00Z"
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicApiPage; 