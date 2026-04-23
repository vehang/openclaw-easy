'use client';

import React from 'react';
import Link from 'next/link';
import { 
  FaBriefcase, 
  FaCalendarAlt, 
  FaTasks, 
  FaStickyNote,
  FaClock,
  FaChartBar,
  FaChevronRight,
  FaArrowLeft
} from 'react-icons/fa';

const WorkToolsPage: React.FC = () => {
  const workTools = [
    {
      id: 'schedule',
      title: '日程安排',
      description: '智能日程管理系统，支持日历视图、状态管理、自动提醒等功能',
      icon: <FaCalendarAlt className="w-8 h-8" />,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      path: '/tools/work/schedule',
      features: [
        '日历视图展示',
        '状态智能管理',
        '优先级设置',
        '自动过期检测',
        '一键完成功能'
      ],
      status: 'available'
    },
    {
      id: 'todo',
      title: '待办事项',
      description: '简洁高效的任务管理工具，帮助您追踪和完成各种待办任务',
      icon: <FaTasks className="w-8 h-8" />,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      path: '/tools/work/todo',
      features: [
        '任务分类管理',
        '优先级排序',
        '进度跟踪',
        '完成统计',
        '提醒功能'
      ],
      status: 'coming_soon'
    },
    {
      id: 'notes',
      title: '笔记管理',
      description: '功能丰富的笔记系统，支持Markdown格式，标签分类等功能',
      icon: <FaStickyNote className="w-8 h-8" />,
      color: 'bg-yellow-500',
      hoverColor: 'hover:bg-yellow-600',
      path: '/tools/work/notes',
      features: [
        'Markdown支持',
        '标签分类',
        '全文搜索',
        '历史版本',
        '导出功能'
      ],
      status: 'coming_soon'
    },
    {
      id: 'timetrack',
      title: '时间跟踪',
      description: '精确的时间记录工具，帮助您分析工作效率和时间分配',
      icon: <FaClock className="w-8 h-8" />,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      path: '/tools/work/timetrack',
      features: [
        '项目时间记录',
        '工作效率分析',
        '时间统计报表',
        '目标设定',
        '数据导出'
      ],
      status: 'coming_soon'
    },
    {
      id: 'analytics',
      title: '工作分析',
      description: '深度分析您的工作模式，提供个性化的效率提升建议',
      icon: <FaChartBar className="w-8 h-8" />,
      color: 'bg-red-500',
      hoverColor: 'hover:bg-red-600',
      path: '/tools/work/analytics',
      features: [
        '工作模式分析',
        '效率趋势图',
        '时间分布统计',
        '目标达成率',
        '改进建议'
      ],
      status: 'coming_soon'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            可用
          </span>
        );
      case 'coming_soon':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
            即将推出
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          {/* 面包屑导航 */}
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <Link href="/tools" className="hover:text-teal-600">
              工具
            </Link>
            <FaChevronRight className="w-3 h-3" />
            <span className="text-gray-800">工作工具</span>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <FaBriefcase className="text-3xl text-blue-500" />
                <h1 className="text-3xl font-bold text-gray-800">工作工具</h1>
              </div>
              <p className="text-gray-600 max-w-2xl">
                提升工作效率的专业工具集合，涵盖日程管理、任务跟踪、笔记记录等多个方面，助您高效完成工作任务
              </p>
            </div>

            <Link
              href="/tools"
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaArrowLeft className="w-4 h-4" />
              <span>返回工具首页</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaBriefcase className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">工具总数</p>
                <p className="text-2xl font-bold text-gray-800">{workTools.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FaCalendarAlt className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">可用工具</p>
                <p className="text-2xl font-bold text-gray-800">
                  {workTools.filter(tool => tool.status === 'available').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FaClock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">即将推出</p>
                <p className="text-2xl font-bold text-gray-800">
                  {workTools.filter(tool => tool.status === 'coming_soon').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 工具列表 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {workTools.map((tool) => (
            <div
              key={tool.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 overflow-hidden"
            >
              {/* 工具头部 */}
              <div className={`${tool.color} p-6 text-white relative`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {tool.icon}
                    <div>
                      <h3 className="text-xl font-semibold">{tool.title}</h3>
                      <p className="text-blue-100 text-sm mt-1">{tool.description}</p>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4">
                    {getStatusBadge(tool.status)}
                  </div>
                </div>
              </div>

              {/* 工具详情 */}
              <div className="p-6">
                {/* 功能特性 */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">主要功能</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {tool.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex justify-end">
                  {tool.status === 'available' ? (
                    <Link
                      href={tool.path}
                      className={`px-6 py-2 rounded-lg text-white transition-colors flex items-center space-x-2 ${tool.color} ${tool.hoverColor}`}
                    >
                      <span>立即使用</span>
                      <FaChevronRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="px-6 py-2 rounded-lg text-gray-500 bg-gray-100 cursor-not-allowed flex items-center space-x-2"
                    >
                      <span>敬请期待</span>
                      <FaClock className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 底部说明 */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">工具特色</h3>
            <p className="text-gray-600 mb-4">
              所有工作工具都经过精心设计，注重用户体验和实用性，数据本地存储，保护您的隐私
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>免费使用</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>数据安全</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>持续更新</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkToolsPage; 