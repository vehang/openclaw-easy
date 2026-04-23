'use client';

import {useState, useEffect} from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import Image from 'next/image';
import ExtensionManagerModal from '@/components/ExtensionManagerModal';
import ExtensionDownload from '@/components/ExtensionDownload';

export default function WechatCollectionTutorial() {
    const [activeTab, setActiveTab] = useState<'wechat' | 'plugin'>('wechat');
    const [browserInfo, setBrowserInfo] = useState<{name: string, extensionUrl: string}>({
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
                    <Link href="/favorites" className="text-[#00bba7] hover:underline flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24"
                             stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                        </svg>
                        返回收藏页面
                    </Link>
                </div>

                <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">收藏站点使用教程</h1>

                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <p className="text-center text-gray-600 mb-8">
                        宝盒导航提供两种便捷的收藏方式，选择最适合您的方式来快速收藏喜欢的网站！
                    </p>

                    {/* 标签页切换 */}
                    <div className="flex justify-center mb-8">
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setActiveTab('wechat')}
                                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                                    activeTab === 'wechat'
                                        ? 'bg-[#00bba7] text-white'
                                        : 'text-gray-600 hover:text-gray-800'
                                }`}
                            >
                                方式一：📱 公众号收藏
                            </button>
                            <button
                                onClick={() => setActiveTab('plugin')}
                                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                                    activeTab === 'plugin'
                                        ? 'bg-[#00bba7] text-white'
                                        : 'text-gray-600 hover:text-gray-800'
                                }`}
                            >
                                方式二：🔌 插件收藏
                            </button>
                        </div>
                    </div>

                    {/* 方式一：公众号收藏 */}
                    {activeTab === 'wechat' && (
                        <div className="prose max-w-none">
                            <div className="bg-blue-50 p-6 rounded-lg mb-8">
                                <div className="flex items-center mb-4">
                                    <span
                                        className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium mr-3">方式一</span>
                                    <h2 className="text-xl font-semibold text-blue-700 m-0">📱 公众号收藏</h2>
                                </div>
                                <p className="text-blue-600 m-0">
                                    通过微信公众号收藏，随时随地都能快速保存喜欢的网站，特别适合手机端使用。
                                </p>
                            </div>

                            {/* 3个步骤在一行 */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                {/* 步骤1：关注公众号 */}
                                <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
                                    <img
                                        src="/icons/qrcode.jpg"
                                        alt="关注公众号"
                                        className="w-64 h-64 rounded-lg shadow-lg border-2 border-blue-200 object-cover mb-4"
                                    />
                                    <h3 className="text-lg font-medium mb-2 text-gray-800">步骤1：关注公众号</h3>
                                    <p className="text-center text-gray-600 text-sm">
                                        扫描二维码关注"宝盒导航"公众号
                                    </p>
                                </div>

                                {/* 步骤2：发送链接 */}
                                <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
                                    <img
                                        src="/images/wechat-step2.png"
                                        alt="发送链接"
                                        className="w-64 h-64 rounded-lg shadow-lg border-2 border-blue-200 object-cover mb-4"
                                    />
                                    <h3 className="text-lg font-medium mb-2 text-gray-800">步骤2：发送链接</h3>
                                    <p className="text-center text-gray-600 text-sm">
                                        将网页链接分享或复制到公众号对话框发送
                                    </p>
                                </div>

                                {/* 步骤3：查看收藏 */}
                                <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
                                    <img
                                        src="/images/wechat-step3.png"
                                        alt="查看收藏"
                                        className="w-64 h-64 rounded-lg shadow-lg border-2 border-blue-200 object-cover mb-4"
                                    />
                                    <h3 className="text-lg font-medium mb-2 text-gray-800">步骤3：<Link
                                        href="/favorites"
                                        className="text-[#00bba7] hover:underline">查看收藏</Link></h3>
                                    <p className="text-center text-gray-600 text-sm">
                                        系统自动保存，点击回到 <Link href="/favorites"
                                                                    className="text-[#00bba7] hover:underline">收藏页面</Link> 即可查看
                                    </p>
                                </div>
                            </div>

                            <div className="bg-green-50 p-4 rounded-lg">
                                <h3 className="text-lg font-medium mb-2 text-green-700">✨ 温馨提示</h3>
                                <ul className="list-disc pl-6 text-green-600 mb-0">
                                    <li>支持直接复制链接发送到公众号</li>
                                    <li>每次收藏成功后都会收到确认消息</li>
                                    <li>重复收藏同一链接只会保存一次</li>
                                    <li>解析或识别有误时，可以在收藏页面手动编辑调整</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* 方式二：插件收藏 */}
                    {activeTab === 'plugin' && (
                        <div className="prose max-w-none">
                            <div className="bg-purple-50 p-6 rounded-lg mb-8">
                                <div className="flex items-center mb-4">
                                    <span
                                        className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium mr-3">方式二</span>
                                    <h2 className="text-xl font-semibold text-purple-700 m-0">🔌 插件收藏</h2>
                                </div>
                                <p className="text-purple-600 m-0">
                                    通过浏览器插件收藏，一键保存，特别适合电脑端用户，操作更加便捷高效。
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                {/* 步骤1：下载插件 */}
                                <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
                                    <img
                                        src="/images/plug-step1.png"
                                        alt="下载插件"
                                        className="w-48 h-48 rounded-lg shadow-lg border-2 border-purple-200 object-cover mb-4"
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
                                        className="w-48 h-48 rounded-lg shadow-lg border-2 border-purple-200 object-cover mb-4"
                                    />
                                    <h3 className="text-lg font-medium mb-2 text-gray-800">步骤2：打开插件管理</h3>
                                    <p className="text-center text-gray-600 text-sm">
                                        检测到您使用的是 <strong>{browserInfo.name}</strong><br/>
                                        <button
                                            onClick={openExtensionManager}
                                            className="text-[#00bba7] hover:underline font-medium">
                                            点击打开插件管理
                                        </button>
                                        <br/>
                                        <span className="text-xs text-gray-500">
                                          (如无法自动打开，地址会复制到剪贴板)
                                        </span>
                                        <br/>
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
                                        className="w-48 h-48 rounded-lg shadow-lg border-2 border-purple-200 object-cover mb-4"
                                    />
                                    <h3 className="text-lg font-medium mb-2 text-gray-800">步骤3：开发者模式</h3>
                                    <p className="text-center text-gray-600 text-sm">
                                        在插件管理页面右上角<br/>开启"开发者模式"开关
                                    </p>
                                </div>

                                {/* 步骤4：拖拽安装 */}
                                <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
                                    <img
                                        src="/images/plug-step4.png"
                                        alt="发送链接"
                                        className="w-48 h-48 rounded-lg shadow-lg border-2 border-purple-200 object-cover mb-4"
                                    />
                                    <h3 className="text-lg font-medium mb-2 text-gray-800">步骤4：拖拽安装</h3>
                                    <p className="text-center text-gray-600 text-sm">
                                        将下载的插件压缩包<br/>直接拖拽到插件管理页面
                                    </p>
                                </div>

                                {/* 步骤5：锁定插件 */}
                                <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
                                    <img
                                        src="/images/plug-step5.png"
                                        alt="锁定插件"
                                        className="w-48 h-48 rounded-lg shadow-lg border-2 border-purple-200 object-cover mb-4"
                                    />
                                    <h3 className="text-lg font-medium mb-2 text-gray-800">步骤5：锁定插件</h3>
                                    <p className="text-center text-gray-600 text-sm">
                                        点击浏览器右上角的拼图图标<br/>将插件锁定到工具栏
                                    </p>
                                </div>

                                {/* 步骤6：右键收藏 */}
                                <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
                                    <img
                                        src="/images/plug-step6.png"
                                        alt="右键收藏"
                                        className="w-48 h-48 rounded-lg shadow-lg border-2 border-purple-200 object-cover mb-4"
                                    />
                                    <h3 className="text-lg font-medium mb-2 text-gray-800">步骤6：右键收藏</h3>
                                    <p className="text-center text-gray-600 text-sm">
                                        在任意页面右键选择<br/>"收藏到宝盒导航"
                                    </p>
                                </div>
                            </div>

                            <div className="bg-purple-50 p-4 rounded-lg">
                                <h3 className="text-lg font-medium mb-2 text-purple-700">🚀 插件优势</h3>
                                <ul className="list-disc pl-6 text-purple-600 mb-0">
                                    <li>一键收藏，无需切换应用</li>
                                    <li>自动获取页面标题和描述</li>
                                    <li>支持批量管理收藏</li>
                                    <li>解析或识别有误时，可以在收藏页面编辑调整</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* 常见问题 */}
                    <div className="mt-12 bg-gray-50 rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">❓ 常见问题</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-medium text-gray-800 mb-2">Q: 收藏的网站会同步吗？</h4>
                                <p className="text-gray-600 text-sm">A:
                                    是的，无论通过哪种方式收藏，数据都会实时同步到您的账户。</p>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-800 mb-2">Q: 插件支持哪些浏览器？</h4>
                                <p className="text-gray-600 text-sm">A: 目前支持Chrome、Edge等Chromium内核浏览器。</p>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-800 mb-2">Q: 收藏失败怎么办？</h4>
                                <p className="text-gray-600 text-sm">A:
                                    请检查网络连接，确保已登录账户，或尝试重新收藏。</p>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-800 mb-2">Q: 自动识别的标题和描述不太准确，影响使用了？</h4>
                                <p className="text-gray-600 text-sm">A: 可以在收藏页根据自己的需求编辑即可</p>
                            </div>
                        </div>
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
        </Layout>
    );
}