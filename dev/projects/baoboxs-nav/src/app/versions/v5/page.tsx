'use client';

import React from 'react';
import Layout from '@/components/Layout';

export default function V5Page() {
  return (
    <Layout categories={[]} isLoading={false}>
      <div className="py-4">
        <h1 className="text-2xl font-bold mb-6">5.0 版本</h1>
        <p className="text-gray-600 mb-4">
          这里是5.0版本页面，展示程序员宝盒5.0版本的新特性和功能。
        </p>
        
        {/* 5.0版本页面的具体内容 */}
        <div className="mt-8">
          {/* 5.0版本内容 */}
        </div>
      </div>
    </Layout>
  );
}