'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/* 原代码中的导入
import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { 
  FaBriefcase, 
  FaCode, 
  FaImage, 
  FaFileAlt, 
  FaCalculator, 
  FaGlobe,
  FaChevronRight,
  FaTools
} from 'react-icons/fa';
*/

/* 原代码中的 metadata
export const metadata: Metadata = {
  title: '在线工具 - 程序员宝盒',
  description: '提供丰富的在线工具，包括开发工具、设计工具、效率工具等，提高您的工作效率。',
};
*/

const ToolsPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.push('/');
  }, [router]);

  /* 原代码中的数据定义
  const toolCategories = [
    {
      id: 'work',
      title: '工作工具',
      description: '提升工作效率的实用工具',
      icon: <FaBriefcase className="w-8 h-8" />,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      tools: [
        { name: '日程安排', path: '/tools/work/schedule', description: '管理您的日程和任务' },
        { name: '待办事项', path: '/tools/work/todo', description: '记录和跟踪待办任务' },
        { name: '笔记管理', path: '/tools/work/notes', description: '创建和管理工作笔记' }
      ]
    },
    {
      id: 'development',
      title: '开发工具',
      description: '程序开发相关的实用工具',
      icon: <FaCode className="w-8 h-8" />,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      tools: [
        { name: 'JSON格式化', path: '/tools/dev/json', description: 'JSON数据格式化和验证' },
        { name: 'Base64编码', path: '/tools/dev/base64', description: 'Base64编码解码工具' },
        { name: '正则表达式', path: '/tools/dev/regex', description: '正则表达式测试工具' }
      ]
    },
    {
      id: 'media',
      title: '媒体工具',
      description: '图片、视频等媒体处理工具',
      icon: <FaImage className="w-8 h-8" />,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      tools: [
        { name: '图片压缩', path: '/tools/media/compress', description: '在线图片压缩优化' },
        { name: '格式转换', path: '/tools/media/convert', description: '图片格式转换工具' },
        { name: '二维码生成', path: '/tools/media/qrcode', description: '生成自定义二维码' }
      ]
    },
    {
      id: 'text',
      title: '文本工具',
      description: '文本处理和格式化工具',
      icon: <FaFileAlt className="w-8 h-8" />,
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600',
      tools: [
        { name: '文本对比', path: '/tools/text/diff', description: '比较两段文本的差异' },
        { name: 'Markdown编辑', path: '/tools/text/markdown', description: 'Markdown编辑和预览' },
        { name: '字数统计', path: '/tools/text/count', description: '统计文本字数和字符' }
      ]
    },
    {
      id: 'utility',
      title: '实用工具',
      description: '日常生活中的实用小工具',
      icon: <FaCalculator className="w-8 h-8" />,
      color: 'bg-teal-500',
      hoverColor: 'hover:bg-teal-600',
      tools: [
        { name: '计算器', path: '/tools/utility/calculator', description: '科学计算器' },
        { name: '单位转换', path: '/tools/utility/converter', description: '各种单位换算工具' },
        { name: '颜色选择器', path: '/tools/utility/color', description: '颜色选择和代码生成' }
      ]
    },
    {
      id: 'network',
      title: '网络工具',
      description: '网络诊断和测试工具',
      icon: <FaGlobe className="w-8 h-8" />,
      color: 'bg-red-500',
      hoverColor: 'hover:bg-red-600',
      tools: [
        { name: 'IP查询', path: '/tools/network/ip', description: '查询IP地址信息' },
        { name: '网站检测', path: '/tools/network/ping', description: '网站可用性检测' },
        { name: 'URL编码', path: '/tools/network/url', description: 'URL编码解码工具' }
      ]
    }
  ];
  */

  /* 原代码中的渲染部分
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 *//*}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <FaTools className="text-3xl text-teal-500" />
              <h1 className="text-3xl font-bold text-gray-800">实用工具集</h1>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              为程序员和工作者精心打造的实用工具集合，涵盖工作效率、开发辅助、媒体处理等多个领域
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 工具分类网格 *//*}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {toolCategories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              {/* 分类头部 *//*}
              <div className={`${category.color} p-6 text-white`}>
                <div className="flex items-center space-x-3">
                  {category.icon}
                  <div>
                    <h3 className="text-xl font-semibold">{category.title}</h3>
                    <p className="text-blue-100 text-sm mt-1">{category.description}</p>
                  </div>
                </div>
              </div>

              {/* 工具列表 *//*}
              <div className="p-4">
                <div className="space-y-2">
                  {category.tools.map((tool, index) => (
                    <Link
                      key={index}
                      href={tool.path}
                      className="block p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800 group-hover:text-teal-600">
                            {tool.name}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {tool.description}
                          </p>
                        </div>
                        <FaChevronRight className="w-4 h-4 text-gray-400 group-hover:text-teal-500" />
                      </div>
                    </Link>
                  ))}
                </div>

                {/* 查看更多按钮 *//*}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <Link
                    href={`/tools/${category.id}`}
                    className={`block w-full text-center py-2 px-4 rounded-lg text-white transition-colors ${category.color} ${category.hoverColor}`}
                  >
                    查看更多 {category.title}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 底部信息 *//*}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">持续更新中</h3>
            <p className="text-gray-600">
              我们会不断添加新的实用工具，如果您有好的建议或需求，欢迎反馈给我们
            </p>
          </div>
        </div>
      </div>
    </div>
  );
  */

  return null;
};

export default ToolsPage;