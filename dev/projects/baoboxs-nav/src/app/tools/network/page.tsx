import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '网络工具 - 程序员宝盒',
  description: '提供各种网络诊断和网络相关实用工具，包括IP查询、DNS查询、网速测试等。',
};

const NetworkToolsPage = () => {
  const tools = [
    {
      name: 'IP地址查询',
      description: '查询IP地址的地理位置和运营商信息',
      icon: '🌍',
      href: '/tools/network/ip-lookup',
      category: 'query'
    },
    {
      name: 'DNS查询',
      description: '查询域名的DNS记录信息',
      icon: '🔍',
      href: '/tools/network/dns-lookup',
      category: 'query'
    },
    {
      name: '网速测试',
      description: '测试网络连接速度和延迟',
      icon: '⚡',
      href: '/tools/network/speed-test',
      category: 'performance'
    },
    {
      name: 'Ping测试',
      description: '测试到目标主机的网络连通性',
      icon: '📡',
      href: '/tools/network/ping-test',
      category: 'connectivity'
    },
    {
      name: '端口扫描',
      description: '扫描目标主机的开放端口',
      icon: '🔓',
      href: '/tools/network/port-scan',
      category: 'scanning'
    },
    {
      name: 'Whois查询',
      description: '查询域名的注册信息',
      icon: '📋',
      href: '/tools/network/whois',
      category: 'query'
    },
    {
      name: '路由追踪',
      description: '追踪数据包到目标主机的路径',
      icon: '🛤️',
      href: '/tools/network/traceroute',
      category: 'connectivity'
    },
    {
      name: '子网计算器',
      description: '计算IP子网划分信息',
      icon: '📊',
      href: '/tools/network/subnet-calculator',
      category: 'calculation'
    },
  ];

  const categories = [
    { id: 'query', name: '信息查询', icon: '🔍' },
    { id: 'performance', name: '性能测试', icon: '⚡' },
    { id: 'connectivity', name: '连通性测试', icon: '📡' },
    { id: 'scanning', name: '网络扫描', icon: '🔓' },
    { id: 'calculation', name: '网络计算', icon: '📊' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">网络工具</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            提供专业的网络诊断和分析工具，帮助您解决网络问题
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
                      className="inline-flex items-center px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors duration-200"
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

export default NetworkToolsPage; 