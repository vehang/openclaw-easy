import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '效率工具 - 程序员宝盒',
  description: '提供各种提高工作效率的实用工具，包括文档转换、批量处理、自动化工具等。',
};

const ProductivityToolsPage = () => {
  const tools = [
    {
      name: '文档转换',
      description: '支持多种文档格式相互转换',
      icon: '📄',
      href: '/tools/productivity/document-converter',
      category: 'converter'
    },
    {
      name: '二维码生成',
      description: '快速生成各种类型的二维码',
      icon: '📱',
      href: '/tools/productivity/qr-generator',
      category: 'generator'
    },
    {
      name: '文本处理',
      description: '批量文本处理和格式化工具',
      icon: '📝',
      href: '/tools/productivity/text-processor',
      category: 'processor'
    },
    {
      name: '时间计算器',
      description: '时间差计算和时区转换',
      icon: '⏰',
      href: '/tools/productivity/time-calculator',
      category: 'calculator'
    },
    {
      name: '密码生成器',
      description: '生成安全可靠的随机密码',
      icon: '🔐',
      href: '/tools/productivity/password-generator',
      category: 'generator'
    },
    {
      name: '单位转换',
      description: '长度、重量、温度等单位转换',
      icon: '🔄',
      href: '/tools/productivity/unit-converter',
      category: 'converter'
    },
  ];

  const categories = [
    { id: 'converter', name: '转换工具', icon: '🔄' },
    { id: 'generator', name: '生成工具', icon: '⚙️' },
    { id: 'processor', name: '处理工具', icon: '⚡' },
    { id: 'calculator', name: '计算工具', icon: '🧮' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">效率工具</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            提供各种提高工作效率的实用工具，让工作更轻松
          </p>
        </div>

        {/* 工具分类展示 */}
        {categories.map((category) => {
          const categoryTools = tools.filter(tool => tool.category === category.id);
          
          if (categoryTools.length === 0) return null;

          return (
            <div key={category.id} className="mb-12">
              <div className="flex items-center mb-6">
                <span className="text-2xl mr-3">{category.icon}</span>
                <h2 className="text-2xl font-semibold text-gray-800">{category.name}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryTools.map((tool) => (
                  <div
                    key={tool.name}
                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border border-gray-200"
                  >
                    <div className="flex items-center mb-4">
                      <span className="text-2xl mr-3">{tool.icon}</span>
                      <h3 className="text-xl font-semibold text-gray-900">{tool.name}</h3>
                    </div>
                    <p className="text-gray-600 mb-4">{tool.description}</p>
                    <a
                      href={tool.href}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
                    >
                      使用工具
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductivityToolsPage; 