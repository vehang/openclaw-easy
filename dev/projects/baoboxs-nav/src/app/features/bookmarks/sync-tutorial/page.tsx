"use client";

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import ExtensionManagerModal from '@/components/ExtensionManagerModal';
import ExtensionDownload from '@/components/ExtensionDownload';

export default function SyncTutorialPage() {
  const [browserInfo, setBrowserInfo] = useState<{ name: string, extensionUrl: string }>({
    name: 'Chrome',
    extensionUrl: 'chrome://extensions/'
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 检测浏览器类型
  useEffect(() => {
    const detectBrowser = () => {
      const userAgent = navigator.userAgent;

      if (userAgent.includes('Edg/')) {
        return {
          name: 'Microsoft Edge',
          extensionUrl: 'edge://extensions/'
        };
      } else if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/')) {
        return {
          name: 'Google Chrome',
          extensionUrl: 'chrome://extensions/'
        };
      } else if (userAgent.includes('Firefox/')) {
        return {
          name: 'Mozilla Firefox',
          extensionUrl: 'about:addons'
        };
      } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) {
        return {
          name: 'Safari',
          extensionUrl: 'safari://extensions/'
        };
      } else {
        return {
          name: 'Chrome',
          extensionUrl: 'chrome://extensions/'
        };
      }
    };

    setBrowserInfo(detectBrowser());
  }, []);

  // 打开插件管理页面
  const openExtensionManager = () => {
    // 先尝试直接打开
    const newWindow = window.open(browserInfo.extensionUrl, '_blank');

    // 使用 setTimeout 检查是否成功打开
    setTimeout(() => {
      // 如果窗口未能成功打开（被阻止），显示自定义弹窗
      if (!newWindow || newWindow.closed) {
        setIsModalOpen(true);
      }
    }, 1000); // 等待1秒检查窗口状态
  };

  return (
    <Layout categories={[]} isLoading={false} useSidebarMargin={false} useFlowLayout={true}>
      <div className="py-6 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="mb-6">
          <Link href="/bookmarks" className="text-[#00bba7] hover:underline flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回书签页面
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">书签同步教程</h1>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-[#00bba7]">为什么需要同步书签？</h2>
          <p className="text-gray-700 mb-4">
            在不同设备上使用浏览器时，您可能会遇到书签无法共享的问题。通过我们的书签同步功能，您可以：
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
            <li>在任何设备上访问您的所有书签</li>
            <li>保持所有设备上的书签同步更新</li>
            <li>防止重要书签丢失</li>
            <li>轻松整理和管理您的书签集合</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-[#00bba7]">同步步骤</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* 步骤1：下载插件 */}
            <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
              <img
                src="/images/plug-step1.png"
                alt="下载插件"
                className="w-48 h-48 rounded-lg shadow-lg border-2 border-[#00bba7] object-cover mb-4"
              />
              <h3 className="text-lg font-medium mb-2 text-gray-800">步骤1：下载插件</h3>
              <div className="mt-4">
                <ExtensionDownload showDescription={false} />
              </div>
            </div>

            {/* 步骤2：打开插件管理 */}
            <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
              <img
                src="/images/plug-step2.png"
                alt="打开插件管理"
                className="w-48 h-48 rounded-lg shadow-lg border-2 border-[#00bba7] object-cover mb-4"
              />
              <h3 className="text-lg font-medium mb-2 text-gray-800">步骤2：打开插件管理</h3>
              <p className="text-center text-gray-600 text-sm">
                检测到您使用的是 <strong>{browserInfo.name}</strong><br />
                <button
                  onClick={openExtensionManager}
                  className="text-[#00bba7] hover:underline font-medium">
                  点击打开插件管理
                </button>
                <br />
                <span className="text-xs text-gray-500">
                  (如无法自动打开，地址会复制到剪贴板)
                </span>
                <br />
                <span className="text-xs text-gray-400">
                  手动地址：{browserInfo.extensionUrl}
                </span>
              </p>
            </div>

            {/* 步骤3：开发者模式 */}
            <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
              <img
                src="/images/plug-step3.png"
                alt="开发者模式"
                className="w-48 h-48 rounded-lg shadow-lg border-2 border-[#00bba7] object-cover mb-4"
              />
              <h3 className="text-lg font-medium mb-2 text-gray-800">步骤3：开发者模式</h3>
              <p className="text-center text-gray-600 text-sm">
                在插件管理页面右上角<br />开启"开发者模式"开关
              </p>
            </div>

            {/* 步骤4：拖拽安装 */}
            <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
              <img
                src="/images/plug-step4.png"
                alt="拖拽安装"
                className="w-48 h-48 rounded-lg shadow-lg border-2 border-[#00bba7] object-cover mb-4"
              />
              <h3 className="text-lg font-medium mb-2 text-gray-800">步骤4：拖拽安装</h3>
              <p className="text-center text-gray-600 text-sm">
                将下载的插件压缩包<br />直接拖拽到插件管理页面进行安装
              </p>
            </div>

            {/* 步骤5：锁定插件 */}
            <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
              <img
                src="/images/plug-step5.png"
                alt="锁定插件"
                className="w-48 h-48 rounded-lg shadow-lg border-2 border-[#00bba7] object-cover mb-4"
              />
              <h3 className="text-lg font-medium mb-2 text-gray-800">步骤5：锁定插件</h3>
              <p className="text-center text-gray-600 text-sm">
                点击浏览器右上角的拼图图标<br />将插件锁定到工具栏便于使用
              </p>
            </div>

            {/* 步骤6：同步书签 */}
            <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
              <img
                src="/images/plug-step6_1.png"
                alt="同步书签"
                className="w-48 h-48 rounded-lg shadow-lg border-2 border-[#00bba7] object-cover mb-4"
              />
              <h3 className="text-lg font-medium mb-2 text-gray-800">步骤6：同步书签</h3>
              <p className="text-center text-gray-600 text-sm">
                点击插件图标，登录您的账户<br />点击"同步书签"进行全量同步
              </p>
            </div>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg mb-6">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-lg font-medium mb-2 text-amber-700">⚠️ 重要提醒</h3>
                <ul className="list-disc pl-6 text-amber-600 mb-0 space-y-1">
                  <li>同步并非增量操作，每次同步将覆盖服务器上的所有书签数据</li>
                  <li>请确保在所有设备上使用相同的账户登录</li>
                  <li>建议定期同步以保持数据最新</li>
                  <li>同步完成后可在 <a href="/bookmarks" className="text-[#00bba7] hover:underline font-medium">书签页面</a> 查看管理</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-[#00bba7]">常见问题</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-800 mb-2">我的书签会自动同步吗？</h3>
              <p className="text-gray-700">
                默认情况下，书签不会自动同步。您需要手动点击扩展中的"同步"按钮。但您可以在扩展设置中启用自动同步功能，设置同步频率。
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-800 mb-2">同步会覆盖我现有的书签吗？</h3>
              <p className="text-gray-700">
                不会。我们的同步系统会智能合并您的书签，避免创建重复项。如果在不同设备上有相同URL的书签，系统会保留最近修改的那一个。
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-800 mb-2">我可以同步多少书签？</h3>
              <p className="text-gray-700">
                免费账户可以同步最多1000个书签。如果您需要同步更多书签，可以升级到我们的高级账户，获得无限书签同步能力。
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-800 mb-2">如何解决同步问题？</h3>
              <p className="text-gray-700">
                如果您在同步过程中遇到问题，请尝试以下步骤：
              </p>
              <ul className="list-disc pl-6 mt-2 text-gray-700 space-y-1">
                <li>确保您已登录相同的账户</li>
                <li>检查您的网络连接</li>
                <li>重新安装浏览器扩展</li>
                <li>清除浏览器缓存后重试</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 插件管理弹窗 */}
        <ExtensionManagerModal
          isOpen={isModalOpen}
          browserName={browserInfo.name}
          extensionUrl={browserInfo.extensionUrl}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </Layout>
  );
}