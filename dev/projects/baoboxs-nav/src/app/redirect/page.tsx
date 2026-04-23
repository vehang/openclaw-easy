'use client';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { redirectTool, redirectToolByShortUrl } from '@/services/api';
import { removeFrequentTool, removeFrequentToolBySl } from '@/utils/frequentToolsManager';
import LoginModal from '@/components/LoginModal';
import Loading from '@/components/ui/Loading';

export default function RedirectPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);
  const [loadingText, setLoadingText] = useState('目标页面准备中...');

  // 监听needLogin状态变化，自动打开登录窗口
  useEffect(() => {
    if (needLogin) {
      console.log('检测到需要登录，自动打开登录窗口');
      setShowLoginModal(true);
    }
  }, [needLogin]);

  // 监听showLoginModal状态变化，用于调试
  useEffect(() => {
    console.log('登录窗口状态变化:', { showLoginModal, needLogin });
  }, [showLoginModal, needLogin]);

  // 打开登录框
  const handleOpenLogin = () => {
    console.log('尝试打开登录框，当前状态:', { showLoginModal, needLogin, error });
    setShowLoginModal(true);
    console.log('已设置showLoginModal为true');
  };

  // 关闭登录框
  const handleCloseLogin = (reason?: 'manual' | 'success') => {
    console.log('关闭登录框，原因:', reason);
    setShowLoginModal(false);

    // 如果是登录成功，则重试重定向
    if (reason === 'success') {
      console.log('登录成功，重新尝试重定向');
      handleRetry();
    }
  };

  const handleRetry = async () => {
    handleRedirect();
  };

  const handleRedirect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setNeedLogin(false);
      setLoadingText('目标页面准备中...');

      // 从URL参数中获取重定向信息
      const toolId = searchParams.get('toolId');
      const source = searchParams.get('source');
      const url = searchParams.get('url');
      const bindId = searchParams.get('bindId');
      const shortUrl = searchParams.get('sl');

      // 添加调试信息
      console.log('重定向页面接收到参数:', {
        toolId,
        source,
        url,
        bindId,
        shortUrl
      });

      // 验证必需参数 - 如果有短地址，不需要验证source
      if (!shortUrl && (!source || !['homepage', 'bookmark', 'favorite'].includes(source))) {
        console.error('参数验证失败:', { shortUrl, source });
        setError('无效的访问来源');
        setIsLoading(false);
        return;
      }

      let response: { success: boolean; targetUrl?: string; message?: string; code?: number };

      // 如果有短地址，优先使用短地址重定向
      if (shortUrl) {
        console.log('使用短地址重定向:', shortUrl);

        // 构建短地址重定向请求数据 - 短地址包含所有必要信息，不需要source
        const shortUrlRequest = {
          sl: shortUrl,
          deviceId: typeof window !== 'undefined' ? localStorage.getItem('deviceId') || undefined : undefined
        };

        console.log('短地址重定向请求:', shortUrlRequest);

        // 调用短地址重定向接口
        response = await redirectToolByShortUrl(shortUrlRequest);

        console.log('短地址重定向响应:', response);
      } else {
        // 根据不同来源构建请求数据
        let requestData: {
          toolId?: number;
          source: 'homepage' | 'bookmark' | 'favorite';
          url?: string;
          bindId?: number;
        };

        switch (source) {
          case 'homepage':
            if (!toolId) {
              setError('缺少工具ID参数');
              setIsLoading(false);
              return;
            }
            requestData = {
              source: source as 'homepage',
              toolId: parseInt(toolId)
            };
            break;

          case 'bookmark':
            if (!url) {
              setError('缺少URL参数');
              setIsLoading(false);
              return;
            }
            requestData = {
              source: source as 'bookmark',
              url: url!
            };
            break;

          case 'favorite':
            // 收藏工具支持灵活的参数组合
            if (toolId && bindId) {
              // 完整参数：使用toolId和bindId
              requestData = {
                source: source as 'favorite',
                toolId: parseInt(toolId),
                bindId: parseInt(bindId)
              };
            } else if (url) {
              // 缺少toolId/bindId时，使用URL作为备用方案
              console.log('收藏工具使用URL作为备用方案:', url);
              requestData = {
                source: source as 'favorite',
                url: url
              };
            } else {
              console.error('收藏工具缺少有效参数:', { toolId, bindId, url });
              setError('缺少有效参数');
              setIsLoading(false);
              return;
            }
            break;

          default:
            setError('无效的访问来源');
            setIsLoading(false);
            return;
        }

        // 调用重定向接口
        response = await redirectTool(requestData);
      }

      // 添加详细的调试信息
      console.log('重定向API返回结果:', {
        success: response.success,
        code: response.code,
        message: response.message,
        targetUrl: response.targetUrl,
        fullResponse: response
      });

      // 处理响应
      if (response.success && response.targetUrl) {
        // 更新loading文字，表示正在跳转
        setLoadingText('正在跳转到目标页面...');

        // 延迟一小段时间，确保用户看到loading状态
        await new Promise(resolve => setTimeout(resolve, 500));

        // 重定向成功，跳转到目标URL
        window.location.href = response.targetUrl;

        // 注意：这里不设置setIsLoading(false)，因为页面即将跳转
        // 保持loading状态直到新页面加载完成
      } else {
        // 检查是否有有效的目标URL（非空字符串），如果有则直接跳转
        if (response.targetUrl && response.targetUrl.trim() !== '') {
          console.log('API返回失败但存在目标URL，直接跳转:', response.targetUrl);
          setLoadingText('正在跳转到目标页面...');

          // 延迟一小段时间，确保用户看到loading状态
          await new Promise(resolve => setTimeout(resolve, 100));

          // 直接跳转到目标URL
          window.location.href = response.targetUrl;

          // 尝试关闭当前页面（如果是弹窗或新标签页）
          setTimeout(() => {
            window.close();
          }, 200);

          return; // 直接返回，不执行后续错误处理
        }

        console.log('进入错误码判断分支, response.code:', response.code, 'shortUrl:', shortUrl, 'targetUrl:', response.targetUrl);

        // 检查是否需要登录
        if (response.code === 9997 || response.code === 9996) {
          console.log('检测到需要登录，错误码:', response.code);
          setNeedLogin(true);
          setError(response.message || '请先登录后再访问该工具');
        } else if (response.code && [1001101, 1001102, 1001201, 1001202, 1001301, 1001303, 1001304, 1001305, 1001601].includes(response.code)) {
          // 工具失效，从本地缓存中删除
          console.log('✅ 检测到短地址失效，错误码:', response.code, 'shortUrl:', shortUrl, 'toolId:', toolId, 'source:', source, 'bindId:', bindId);

          // 根据 source 和可用参数组装 uniqueKey 删除
          if (source === 'favorite' && bindId) {
            // favorite 且有 bindId，用 favorite_{bindId}
            const uniqueKey = `favorite_${bindId}`;
            console.log('✅ 准备用 favorite + bindId 删除失效的常用工具, uniqueKey:', uniqueKey);
            removeFrequentTool(uniqueKey);
            console.log('✅ 删除完成');
          } else if (toolId) {
            // 有 toolId，用 homepage_{toolId}
            const uniqueKey = `homepage_${toolId}`;
            console.log('✅ 准备用 toolId 删除失效的常用工具, uniqueKey:', uniqueKey);
            removeFrequentTool(uniqueKey);
            console.log('✅ 删除完成');
          } else if (shortUrl) {
            // 没有 id，用 shortUrl 删除
            console.log('✅ 准备用 shortUrl 删除失效的常用工具, shortUrl:', shortUrl);
            removeFrequentToolBySl(shortUrl);
            console.log('✅ 删除完成');
          } else {
            console.warn('⚠️ 没有可用的标识符，无法删除工具');
          }

          setError(response.message || '该工具不存在或已被删除');
        } else {
          console.log('其他错误，错误码:', response.code);
          // 其他错误
          setError(response.message || '重定向失败');
        }
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('重定向处理失败:', error);
      setError(error.message || '重定向失败');
      setIsLoading(false);
    }
  };

  // 初始化时自动执行重定向
  useEffect(() => {
    handleRedirect();
  }, []);

  return (
    <>
      {/* 登录模态框 - 始终在最外层渲染，确保最高层级 */}
      <div className="relative z-[9999]">
        {showLoginModal && (
          <LoginModal onClose={handleCloseLogin} />
        )}
      </div>

      <div className="fixed inset-0 flex items-center justify-center bg-white overflow-hidden w-full h-full">
        <div className="flex flex-col items-center justify-center w-full h-full">
          {isLoading ? (
            <Loading title={loadingText} subtitle="正在为您跳转，请稍候！" variant="complex" size="lg" showProgress />
          ) : error ? (
            <div className="text-center max-w-md mx-auto p-8">
              <div className={`w-16 h-16 mx-auto mb-6 ${needLogin ? 'bg-yellow-100' : 'bg-red-100'} rounded-full flex items-center justify-center`}>
                {needLogin ? (
                  // 登录图标
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ) : (
                  // 错误图标
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {needLogin ? '需要登录' : '跳转失败'}
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed">{error}</p>

              {/* 操作按钮 */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {needLogin ? (
                  <>
                    {/* 登录按钮 - 主要操作 */}
                    <button
                      onClick={handleOpenLogin}
                      className="inline-flex items-center justify-center px-4 py-2 bg-[#00bba7] text-white rounded-md hover:bg-[#00a593] active:bg-[#009480] transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                    >
                      <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      立即登录
                    </button>

                    {/* 返回首页按钮 - 次要操作 */}
                    <button
                      onClick={() => window.close()}
                      className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-md hover:border-gray-400 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                    >
                      <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      返回首页
                    </button>
                  </>
                ) : (
                  <>
                    {/* 重试按钮 - 实心样式 */}
                    <button
                      onClick={handleRetry}
                      className="inline-flex items-center justify-center px-4 py-2 bg-[#00bba7] text-white rounded-md hover:bg-[#00a593] active:bg-[#009480] transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                    >
                      <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      重试
                    </button>

                    {/* 返回首页按钮 - 轮廓样式，更优雅 */}
                    <button
                      onClick={() => window.close()}
                      className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-md hover:border-gray-400 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                    >
                      <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      返回首页
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
} 