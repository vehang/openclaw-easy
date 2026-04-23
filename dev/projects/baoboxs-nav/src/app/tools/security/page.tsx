import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '安全工具 - 程序员宝盒',
  description: '提供各种网络安全和数据保护相关工具，包括密码检测、加密解密、安全扫描等。',
};

const SecurityToolsPage = () => {
  const tools = [
    {
      name: '密码强度检测',
      description: '检测密码强度，提供安全建议',
      icon: '🔐',
      href: '/tools/security/password-strength',
      category: 'password'
    },
    {
      name: 'MD5加密',
      description: 'MD5哈希值生成和验证',
      icon: '#️⃣',
      href: '/tools/security/md5-encrypt',
      category: 'encryption'
    },
    {
      name: 'AES加密解密',
      description: 'AES对称加密解密工具',
      icon: '🔒',
      href: '/tools/security/aes-crypto',
      category: 'encryption'
    },
    {
      name: 'SQL注入检测',
      description: '检测SQL注入漏洞',
      icon: '🛡️',
      href: '/tools/security/sql-injection',
      category: 'vulnerability'
    },
    {
      name: 'XSS检测',
      description: '跨站脚本攻击检测工具',
      icon: '🔍',
      href: '/tools/security/xss-scanner',
      category: 'vulnerability'
    },
    {
      name: '端口扫描',
      description: '网络端口开放状态检测',
      icon: '🌐',
      href: '/tools/security/port-scanner',
      category: 'scanning'
    },
  ];

  const categories = [
    { id: 'password', name: '密码安全', icon: '🔐' },
    { id: 'encryption', name: '加密解密', icon: '🔒' },
    { id: 'vulnerability', name: '漏洞检测', icon: '🛡️' },
    { id: 'scanning', name: '安全扫描', icon: '🔍' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">安全工具</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            为网络安全和数据保护提供专业的检测和防护工具
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
                      className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
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

export default SecurityToolsPage; 