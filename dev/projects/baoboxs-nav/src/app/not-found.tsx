"use client";

import React from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* 404主内容区域 */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-gray-100 px-4 min-h-0">
        {/* 科技动效背景 */}
        <div className="absolute inset-0 overflow-hidden">
          {/* 呼吸星星 */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-[#00bba7] rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animation: `breathe ${2 + Math.random() * 2}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 3}s`
                }}
              />
            ))}
          </div>

          {/* 飞碟 - 响应式定位避免遮挡 */}
          <div className="absolute top-16 left-4 md:top-1/4 md:left-1/4" style={{ animation: 'float 6s ease-in-out infinite' }}>
            <div className="relative">
              {/* 飞碟主体 */}
              <div className="w-12 h-6 bg-gradient-to-r from-[#00bba7] to-[#00d4aa] rounded-full opacity-90 shadow-lg relative">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-3 bg-gradient-to-r from-[#ffffff] to-[#00bba7] rounded-full opacity-80"></div>
              </div>
              {/* 飞碟光束 */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-6 h-12 bg-gradient-to-b from-[#00bba7]/20 to-transparent opacity-60" style={{ animation: 'pulse 2s ease-in-out infinite' }}></div>
            </div>
          </div>

          {/* 环绕卫星系统 */}
          <div className="absolute top-1/2 right-1/4 transform -translate-y-1/2">
            <div className="relative w-24 h-24" style={{ animation: 'orbit 12s linear infinite' }}>
              {/* 轨道线 */}
              <div className="absolute inset-0 border border-[#00bba7]/20 rounded-full"></div>
              {/* 卫星1 */}
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-[#00bba7] rounded-full shadow-sm">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 border border-[#00bba7]/30 rounded-full" style={{ animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }}></div>
              </div>
            </div>
          </div>

          {/* 第二个环绕卫星 */}
          <div className="absolute bottom-1/3 left-1/3">
            <div className="relative w-16 h-16" style={{ animation: 'orbit 8s linear infinite reverse' }}>
              <div className="absolute inset-0 border border-[#00bba7]/15 rounded-full"></div>
              <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-[#00d4aa] rounded-full shadow-sm">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 border border-[#00d4aa]/40 rounded-full" style={{ animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }}></div>
              </div>
            </div>
          </div>

          {/* 大型环绕卫星 - 3D椭圆轨道围绕中心404区域 */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="relative w-96 h-96" style={{ animation: 'ellipticalOrbit 20s linear infinite', transformStyle: 'preserve-3d' }}>
              {/* 3D椭圆轨道线 */}
              <div className="absolute inset-0 border border-[#00bba7]/10 rounded-full transform rotateX-60 rotateY-15" style={{ width: '100%', height: '60%', top: '20%' }}></div>
              {/* 主卫星 */}
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2" style={{ animation: 'satelliteFloat 20s linear infinite' }}>
                <div className="relative">
                  {/* 卫星主体 - 根据位置调整大小营造远近感 */}
                  <div className="w-4 h-4 bg-gradient-to-br from-[#00bba7] to-[#00d4aa] rounded transform rotate-45 shadow-lg transition-all duration-300">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full opacity-80"></div>
                  </div>
                  {/* 卫星天线 */}
                  <div className="absolute -top-1 -left-1 w-0.5 h-3 bg-[#00bba7] transform -rotate-45"></div>
                  <div className="absolute -top-1 -right-1 w-0.5 h-3 bg-[#00bba7] transform rotate-45"></div>
                  {/* 信号波纹 */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-8 h-8 border border-[#00bba7]/20 rounded-full" style={{ animation: 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite' }}></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 border border-[#00bba7]/30 rounded-full" style={{ animation: 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite', animationDelay: '1s' }}></div>
                  </div>
                </div>
              </div>
              {/* 第二个卫星 - 椭圆轨道对角位置 */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2" style={{ animation: 'satelliteFloat2 20s linear infinite' }}>
                <div className="w-3 h-3 bg-[#00d4aa] rounded-full shadow-md transition-all duration-300">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 border border-[#00d4aa]/25 rounded-full" style={{ animation: 'ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes breathe {
            0%, 100% { 
              opacity: 0.3; 
              transform: scale(1); 
            }
            50% { 
              opacity: 1; 
              transform: scale(1.5); 
            }
          }
          
          @keyframes float {
            0%, 100% { 
              transform: translateY(0px) rotate(0deg); 
            }
            50% { 
              transform: translateY(-10px) rotate(2deg); 
            }
          }
          
          @keyframes orbit {
            from { 
              transform: rotate(0deg); 
            }
            to { 
              transform: rotate(360deg); 
            }
          }
          
          @keyframes ellipticalOrbit {
            from { 
              transform: rotateX(60deg) rotateY(15deg) rotateZ(0deg); 
            }
            to { 
              transform: rotateX(60deg) rotateY(15deg) rotateZ(360deg); 
            }
          }
          
          @keyframes satelliteFloat {
            0% { 
              transform: translateX(0px) translateY(-192px) scale(1.2);
              opacity: 1;
            }
            25% { 
              transform: translateX(136px) translateY(-96px) scale(0.8);
              opacity: 0.7;
            }
            50% { 
              transform: translateX(0px) translateY(192px) scale(0.6);
              opacity: 0.5;
            }
            75% { 
              transform: translateX(-136px) translateY(-96px) scale(0.8);
              opacity: 0.7;
            }
            100% { 
              transform: translateX(0px) translateY(-192px) scale(1.2);
              opacity: 1;
            }
          }
          
          @keyframes satelliteFloat2 {
            0% { 
              transform: translateX(0px) translateY(192px) scale(0.6);
              opacity: 0.5;
            }
            25% { 
              transform: translateX(-136px) translateY(96px) scale(0.8);
              opacity: 0.7;
            }
            50% { 
              transform: translateX(0px) translateY(-192px) scale(1.2);
              opacity: 1;
            }
            75% { 
              transform: translateX(136px) translateY(96px) scale(0.8);
              opacity: 0.7;
            }
            100% { 
              transform: translateX(0px) translateY(192px) scale(0.6);
              opacity: 0.5;
            }
          }
          
          @keyframes gentleGlow {
            0%, 100% { 
              opacity: 0.3;
              transform: scale(1);
            }
            50% { 
              opacity: 0.6;
              transform: scale(1.1);
            }
          }
          
          @keyframes floatingDots {
            0%, 100% { 
              transform: translateY(0px);
              opacity: 0.4;
            }
            50% { 
              transform: translateY(-8px);
              opacity: 0.8;
            }
          }
          
          @keyframes textShadow {
            0%, 100% { 
              transform: translate(0px, 0px);
              opacity: 0.05;
            }
            25% { 
              transform: translate(1px, 1px);
              opacity: 0.08;
            }
            50% { 
              transform: translate(0px, 2px);
              opacity: 0.1;
            }
            75% { 
              transform: translate(-1px, 1px);
              opacity: 0.08;
            }
          }
          
          @keyframes textShimmer {
            0%, 100% { 
              background-position: 0% 50%;
            }
            50% { 
              background-position: 100% 50%;
            }
          }
          
          @keyframes lineGlow {
            0%, 100% { 
              opacity: 0.6;
              box-shadow: 0 0 5px rgba(0, 187, 167, 0.3);
            }
            50% { 
              opacity: 1;
              box-shadow: 0 0 15px rgba(0, 187, 167, 0.6);
            }
          }
          
          @keyframes deepShadow {
            0%, 100% { 
              transform: translate(8px, 8px);
              opacity: 0.15;
            }
            50% { 
              transform: translate(6px, 6px);
              opacity: 0.25;
            }
          }
          
          @keyframes simpleGlow {
            0%, 100% { 
              opacity: 0.15;
              transform: scale(1);
            }
            50% { 
              opacity: 0.25;
              transform: scale(1.05);
            }
          }
        `}</style>

        {/* 主要内容 */}
        <div className="relative z-10 text-center max-w-2xl mx-auto">
          {/* 404 大标题 */}
          <div className="mb-8 relative">
            {/* 简单的光源效果 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute w-96 h-32 bg-gradient-radial from-[#00bba7]/15 via-[#00bba7]/8 to-transparent rounded-full blur-2xl" style={{ animation: 'simpleGlow 3s ease-in-out infinite' }}></div>
            </div>
            
            {/* 主要404文字 */}
            <h1 className="relative text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00bba7] to-[#ffffff]" style={{ 
              textShadow: '0 4px 8px rgba(0, 187, 167, 0.3)'
            }}>
              404
            </h1>
            <div className="mt-4 h-1 w-32 bg-gradient-to-r from-transparent via-[#00bba7] to-transparent mx-auto animate-pulse"></div>
          </div>

          {/* 错误信息 */}
          <div className="mb-8 space-y-3">
            <h2 className="text-xl md:text-2xl font-medium text-[#2e3f4b]">
              页面不存在
            </h2>
            <p className="text-gray-600 text-base">
              抱歉，您访问的页面无法找到
            </p>
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/"
              className="inline-flex items-center px-6 py-2.5 bg-[#00bba7] text-white text-sm font-medium rounded-md hover:bg-[#00a693] focus:outline-none focus:ring-2 focus:ring-[#00bba7] focus:ring-offset-2 transition-colors duration-200 shadow-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              返回首页
            </Link>

            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#00bba7] focus:ring-offset-2 transition-colors duration-200 shadow-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              返回上页
            </button>
          </div>

          {/* 搜索建议 */}
          <div className="mt-8 p-4 bg-white/60 backdrop-blur-sm rounded-lg border border-[#00bba7]/30 shadow-sm">
            <p className="text-gray-700 text-sm">
              💡 提示：您可以尝试搜索您需要的工具，或者浏览我们的
              <Link href="/bookmarks" className="text-[#00bba7] hover:text-[#00d4aa] transition-colors mx-1">
                书签导航
              </Link>
              找到有用的资源
            </p>
          </div>
        </div>
      </div>

      {/* Footer - 只在404页面显示 */}
      <Footer />
    </div>
  );
};

export default NotFound;