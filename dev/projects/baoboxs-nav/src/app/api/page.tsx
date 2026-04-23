import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API服务 - 程序员宝盒',
  description: '提供丰富的API接口服务，包括公共API、开发API、内容处理API等。',
};

const ApiPage = () => {
  const apiCategories = [
    {
      name: '公共API',
      description: '提供各种公共数据接口服务',
      icon: '🌍',
      href: '/api/public',
      color: 'from-blue-500 to-blue-700',
      apis: ['天气查询', '地理位置', '汇率查询', '新闻资讯', '股票信息']
    },
    {
      name: '开发API',
      description: '为开发者提供的技术接口服务',
      icon: '⚙️',
      href: '/api/development',
      color: 'from-green-500 to-green-700',
      apis: ['数据验证', '代码生成', '性能监控', '错误追踪', '日志分析']
    },
    {
      name: '内容处理',
      description: '文本、图片、音视频处理相关API',
      icon: '📄',
      href: '/api/content',
      color: 'from-purple-500 to-purple-700',
      apis: ['文本处理', '图片处理', 'OCR识别', '语音转换', '格式转换']
    },
    {
      name: '实用工具',
      description: '各种实用功能的API接口',
      icon: '🔧',
      href: '/api/utility',
      color: 'from-orange-500 to-orange-700',
      apis: ['网站检测', '代理服务', '短链生成', '二维码生成', '邮件发送']
    }
  ];

  const popularApis = [
    { name: '天气API', endpoint: '/api/public/weather', method: 'GET', description: '获取实时天气信息' },
    { name: '网站检测', endpoint: '/api/utility/check-site', method: 'POST', description: '检测网站可访问性' },
    { name: 'IP查询', endpoint: '/api/public/ip-info', method: 'GET', description: '查询IP地址信息' },
    { name: '短链生成', endpoint: '/api/utility/short-url', method: 'POST', description: '生成短链接' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">API 服务中心</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            为开发者提供稳定可靠的API接口服务，涵盖公共数据、开发工具、内容处理等多个领域
          </p>
        </div>

        {/* API统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">30+</div>
            <div className="text-gray-600">API接口</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">4</div>
            <div className="text-gray-600">服务分类</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">99.9%</div>
            <div className="text-gray-600">服务可用性</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">&lt;100ms</div>
            <div className="text-gray-600">平均响应时间</div>
          </div>
        </div>

        {/* API分类卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {apiCategories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="group block"
            >
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 group-hover:border-gray-300">
                {/* 渐变标题栏 */}
                <div className={`bg-gradient-to-r ${category.color} p-6 text-white`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-3xl mb-2 block">{category.icon}</span>
                      <h3 className="text-xl font-semibold">{category.name}</h3>
                    </div>
                    <svg 
                      className="w-6 h-6 transform group-hover:translate-x-1 transition-transform duration-300" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* 内容区域 */}
                <div className="p-6">
                  <p className="text-gray-600 mb-4">{category.description}</p>
                  
                  {/* API列表预览 */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-900 mb-2">包含接口：</div>
                    <div className="flex flex-wrap gap-2">
                      {category.apis.slice(0, 4).map((api) => (
                        <span
                          key={api}
                          className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                        >
                          {api}
                        </span>
                      ))}
                      {category.apis.length > 4 && (
                        <span className="inline-block bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">
                          +{category.apis.length - 4} 更多
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 热门API展示 */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">热门API接口</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {popularApis.map((api) => (
              <div
                key={api.name}
                className="bg-white rounded-lg shadow-md border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{api.name}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    api.method === 'GET' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {api.method}
                  </span>
                </div>
                <p className="text-gray-600 mb-3">{api.description}</p>
                <div className="bg-gray-50 rounded p-3">
                  <code className="text-sm text-gray-800">{api.endpoint}</code>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API使用说明 */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">API使用说明</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">选择API</h3>
              <p className="text-gray-600 text-sm">浏览API分类，选择合适的接口服务</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">查看文档</h3>
              <p className="text-gray-600 text-sm">阅读详细的API文档和示例代码</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">开始调用</h3>
              <p className="text-gray-600 text-sm">在您的应用中集成和调用API</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiPage;