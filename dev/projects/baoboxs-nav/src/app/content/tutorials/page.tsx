'use client';

import React from 'react';
import Layout from '@/components/Layout';

export default function TutorialsPage() {
  return (
    <Layout categories={[]} isLoading={false} useSidebarMargin={false}>
      <div className="py-4">
        <h1 className="text-2xl font-bold mb-6">开发教程</h1>
        <p className="text-gray-600 mb-4">
          这里是教程页面，您可以在这里找到各种开发相关的教程和学习资源。
        </p>
        
        {/* 教程页面的具体内容 */}
        <div className="mt-8">
          {/* 教程内容 */}
        </div>
      </div>
    </Layout>
  );
}