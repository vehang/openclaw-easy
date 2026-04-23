'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import SiteCard from '@/components/SiteCard';
import Loading from '@/components/ui/Loading';
import { fetchToolsData } from '@/services/api';
import { ApiResponse, Category, ToolGroup, Tool } from '@/types/IndexToolList';
import Link from 'next/link';

export default function AllToolsPage() {
  const params = useParams();
  const router = useRouter();
  // URL 中的参数现在是分类 ID
  const categoryId = parseInt(params.slug as string, 10);

  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 展开状态管理
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetchToolsData();
        if (response && Array.isArray(response)) {
          // 使用 cid 匹配分类
          const foundCategory = response.find((cat: Category) => cat.cid === categoryId);

          if (foundCategory) {
            setCategory(foundCategory);
            // 默认展开所有分组
            setExpandedGroups(new Set(foundCategory.glist.map(g => g.groupName)));
          } else {
            setError('未找到该分类');
          }
        }
      } catch (err) {
        console.error('加载数据失败:', err);
        setError('加载数据失败');
      } finally {
        setLoading(false);
      }
    };

    if (!isNaN(categoryId)) {
      loadData();
    } else {
      setError('无效的分类ID');
      setLoading(false);
    }
  }, [categoryId]);

  // 切换分组展开状态
  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  // 展开所有分组
  const expandAll = () => {
    if (category) {
      setExpandedGroups(new Set(category.glist.map(g => g.groupName)));
    }
  };

  // 收起所有分组
  const collapseAll = () => {
    setExpandedGroups(new Set());
  };

  // 计算总工具数
  const totalTools = category?.glist.reduce((sum, group) => sum + group.tools.length, 0) || 0;

  if (loading) {
    return (
      <Layout categories={[]} isLoading={true} useSidebarMargin={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loading title="正在加载工具列表" />
        </div>
      </Layout>
    );
  }

  if (error || !category) {
    return (
      <Layout categories={[]} isLoading={false} useSidebarMargin={false}>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">{error || '未找到该分类'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
          >
            返回首页
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout categories={[]} isLoading={false} useSidebarMargin={false}>
      <div className="min-h-screen bg-gray-50">
        {/* 页面头部 - 优化样式，固定在顶部 */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Link
                  href="/"
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="返回首页"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </Link>
                <div className="h-6 w-px bg-gray-200" />
                <h1 className="text-lg font-semibold text-gray-900">{category.cname}</h1>
                <span className="text-sm text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {totalTools} 个工具
                </span>
              </div>

              {/* 展开/收起按钮 */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={expandAll}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  展开全部
                </button>
                <button
                  onClick={collapseAll}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  收起全部
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 工具列表 - 优化布局 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {category.glist.map((group: ToolGroup) => {
            const isExpanded = expandedGroups.has(group.groupName);
            
            return (
              <div key={group.groupName} className="mb-4 bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
                {/* 分组标题 */}
                <button
                  onClick={() => toggleGroup(group.groupName)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{group.groupName}</span>
                    <span className="text-sm text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {group.tools.length}
                    </span>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* 工具网格 */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                      {group.tools.map((tool: Tool, index: number) => (
                        <SiteCard key={tool.id || index} tool={tool} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}