import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '开发工具 - 程序员宝盒',
  description: '提供各种开发相关的实用工具，包括代码格式化、API测试、代码生成等。',
};

const DevelopmentToolsPage = () => {
  const tools = [
    {
      name: 'JSON格式化',
      description: '格式化和验证JSON数据',
      icon: '{}',
      href: '/tools/development/json-formatter',
      category: 'formatter'
    },
    {
      name: 'API测试',
      description: '在线API接口测试工具',
      icon: '🔗',
      href: '/tools/development/api-tester',
      category: 'testing'
    },
    {
      name: '正则表达式',
      description: '正则表达式测试和生成',
      icon: '.*',
      href: '/tools/development/regex-tester',
      category: 'testing'
    },
    {
      name: 'Base64编解码',
      description: 'Base64编码和解码工具',
      icon: '⚡',
      href: '/tools/development/base64',
      category: 'encoder'
    },
    {
      name: 'URL编解码',
      description: 'URL编码和解码工具',
      icon: '🔗',
      href: '/tools/development/url-encoder',
      category: 'encoder'
    },
    {
      name: 'Hash生成器',
      description: '生成MD5、SHA1、SHA256等哈希值',
      icon: '#',
      href: '/tools/development/hash-generator',
      category: 'generator'
    },
  ];

  const categories = [
    { id: 'formatter', name: '格式化工具', icon: '📝' },
    { id: 'testing', name: '测试工具', icon: '🧪' },
    { id: 'encoder', name: '编码工具', icon: '🔐' },
    { id: 'generator', name: '生成器', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">开发工具</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            为开发者提供各种实用的在线工具，提高开发效率
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
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
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

export default DevelopmentToolsPage; 