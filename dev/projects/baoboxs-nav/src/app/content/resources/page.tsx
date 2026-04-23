'use client';

import React from 'react';
import Layout from '@/components/Layout';

export default function ResourcesPage() {
  return (
    <Layout categories={[]} isLoading={false} useSidebarMargin={false}>
      <div className="py-4">
        <h1 className="text-2xl font-bold mb-6">开发资源</h1>
        <p className="text-gray-600 mb-4">
          这里是资源页面，您可以在这里找到各种开发相关的资源和素材。
        </p>
        
        {/* 资源页面的具体内容 */}
        <div className="mt-8">
          {/* 资源内容 */}
        </div>
      </div>
    </Layout>
  );
}