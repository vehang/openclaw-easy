import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '设计工具 - 程序员宝盒',
  description: '提供各种设计相关的实用工具，包括颜色选择器、图片处理、UI设计等。',
};

const DesignToolsPage = () => {
  const tools = [
    {
      name: '颜色选择器',
      description: '强大的颜色选择和调色工具',
      icon: '🎨',
      href: '/tools/design/color-picker',
      category: 'color'
    },
    {
      name: '图片压缩',
      description: '在线图片压缩和优化工具',
      icon: '🖼️',
      href: '/tools/design/image-compress',
      category: 'image'
    },
    {
      name: 'CSS生成器',
      description: '快速生成CSS样式代码',
      icon: '🎯',
      href: '/tools/design/css-generator',
      category: 'generator'
    },
    {
      name: '字体预览',
      description: '在线字体效果预览工具',
      icon: '📝',
      href: '/tools/design/font-preview',
      category: 'typography'
    },
    {
      name: '渐变生成器',
      description: 'CSS渐变背景生成工具',
      icon: '🌈',
      href: '/tools/design/gradient-generator',
      category: 'generator'
    },
    {
      name: '图标库',
      description: '丰富的免费图标资源',
      icon: '🎈',
      href: '/tools/design/icon-library',
      category: 'resource'
    },
  ];

  const categories = [
    { id: 'color', name: '颜色工具', icon: '🎨' },
    { id: 'image', name: '图片处理', icon: '🖼️' },
    { id: 'generator', name: 'CSS生成器', icon: '⚙️' },
    { id: 'typography', name: '字体工具', icon: '📝' },
    { id: 'resource', name: '设计资源', icon: '📚' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">设计工具</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            为设计师和前端开发者提供实用的设计辅助工具
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
                      className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200"
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

export default DesignToolsPage; 