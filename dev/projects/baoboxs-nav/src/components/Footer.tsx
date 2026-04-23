import React from 'react';
import Image from 'next/image';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#2e3f4b] text-white py-4">
      <div className="container mx-auto px-4">
        {/* 内容区域 - 在最小屏幕时隐藏 */}
        <div className="hidden sm:block">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 关于我们 */}
            <div className="flex gap-3 items-start">
              <div className="flex items-start">
                <h3 className="text-sm font-semibold mr-1" style={{writingMode: 'vertical-rl', textOrientation: 'mixed'}}>关于我们</h3>
                <div className="w-0.5 bg-teal-500 h-14"></div>
              </div>
              <div className="flex-1">
                <p className="text-gray-300 text-xs leading-relaxed">
                  程序员宝盒是一个为开发者提供各种实用工具和资源的导航平台，旨在提高开发效率，解决工作中的各种问题。如果您有好的工具，也欢迎您推荐给我们。
                </p>
              </div>
            </div>
            
            {/* 常用链接 - 只在大屏显示 */}
            <div className="hidden lg:flex gap-3 items-start">
              <div className="flex items-start">
                <h3 className="text-sm font-semibold mr-1" style={{writingMode: 'vertical-rl', textOrientation: 'mixed'}}>常用链接</h3>
                <div className="w-0.5 bg-teal-500 h-14"></div>
              </div>
              <div className="flex-1 space-y-1 text-xs">
                <div><a href="/" className="text-gray-300 hover:text-teal-400 transition-colors">首页</a></div>
                <div><a href="/bookmarks" className="text-gray-300 hover:text-teal-400 transition-colors">书签</a></div>
                <div><a href="/favorites" className="text-gray-300 hover:text-teal-400 transition-colors">收藏</a></div>
              </div>
            </div>
            
            {/* 联系我们 */}
            <div className="flex gap-3 items-start">
              <div className="flex items-start">
                <h3 className="text-sm font-semibold mr-1" style={{writingMode: 'vertical-rl', textOrientation: 'mixed'}}>联系我们</h3>
                <div className="w-0.5 bg-teal-500 h-14"></div>
              </div>
              <div className="flex-1 space-y-1 text-xs">
                <div className="text-gray-300 flex items-center">
                  <span className="inline-block w-4 h-4 mr-1">📧</span>397729842@qq.com
                </div>
                <div className="text-gray-300 flex items-center">
                  <span className="inline-block w-4 h-4 mr-1">💬</span>微信：mbb2100
                </div>
                <div className="text-gray-300 flex items-center">
                  <span className="inline-block w-4 h-4 mr-1">👥</span>QQ：397729842
                </div>
              </div>
            </div>
            
            {/* 关注我们 + 二维码 - 只在大屏显示 */}
            <div className="hidden lg:flex gap-3 items-start">
              <div className="flex items-start">
                <h3 className="text-sm font-semibold mr-1" style={{writingMode: 'vertical-rl', textOrientation: 'mixed'}}>关注我们</h3>
                <div className="w-0.5 bg-teal-500 h-14"></div>
              </div>
              <div className="flex-1 flex items-start space-x-3">
                {/* 社交媒体图标 */}
                <div className="flex flex-col space-y-2">
                  <a href="#" className="text-gray-300 hover:text-teal-400 transition-colors" title="微信公众号">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.69,11.52c-0.59,0-1.06,0.47-1.06,1.06s0.47,1.06,1.06,1.06s1.06-0.47,1.06-1.06S9.28,11.52,8.69,11.52z M15.31,11.52c-0.59,0-1.06,0.47-1.06,1.06s0.47,1.06,1.06,1.06s1.06-0.47,1.06-1.06S15.9,11.52,15.31,11.52z M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M17.77,14.42c-0.78,1.69-2.31,2.92-4.16,3.32c-1.01,0.23-2.04,0.24-3.07,0.02c-0.36-0.07-0.71-0.16-1.06-0.28c-0.35-0.12-0.68-0.27-1-0.44l-0.08-0.05l-0.07-0.04l-0.09,0.05c-0.23,0.13-0.46,0.26-0.7,0.37l-0.59,0.29l0.15-0.62c0.11-0.45,0.21-0.89,0.31-1.32l0.05-0.21l-0.15-0.15c-0.59-0.57-1.05-1.23-1.38-1.96c-0.33-0.73-0.5-1.5-0.5-2.28c0-2.87,2.68-5.2,5.97-5.2s5.97,2.33,5.97,5.2C17.37,12.26,17.17,13.37,17.77,14.42z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-gray-300 hover:text-teal-400 transition-colors" title="GitHub">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                  </a>
                </div>
                
                {/* 二维码 + 扫码关注 */}
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-16 bg-white rounded">
                    <Image
                      src="/icons/qrcode.jpg"
                      alt="微信公众号"
                      width={60}
                      height={60}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                  <p className="text-xs text-gray-400"  style={{writingMode: 'vertical-rl'}}>扫码关注</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 版权信息 */}
        <div className="mt-3 pt-3 sm:border-t border-gray-700 text-center text-xs text-gray-400 space-y-1">
          <p className="text-xs text-gray-400 leading-relaxed"> 声明：本站收录的第三方站点，版权、所有权均归目标站点所有，服务均由第三方站点直接提供，请使用者自行斟酌，本站不承担任何责任。 </p>
          <p>Copyright © 2021-{new Date().getFullYear()} 程序员宝盒 版权所有</p>
          <p>
            <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="hover:text-teal-400 transition-colors">
              鄂ICP备19026530号-3
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;