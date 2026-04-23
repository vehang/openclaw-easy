/**
 * TabBar - 登录方式切换栏组件
 * 从 LoginModal.tsx 拆分
 */

import React from 'react';
import { FaUser, FaQrcode, FaKey } from 'react-icons/fa';
import type { LoginTab } from './types';

interface TabBarProps {
  activeTab: LoginTab;
  onTabChange: (tab: LoginTab) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
  return (
    <>
      {/* 左侧 TabBar - 精美设计的登录方式切换栏 (桌面端) */}
      <div
        className="flex flex-col items-center rounded-l-2xl shadow-xl hidden sm:flex"
        style={{
          background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
          width: '80px',
          gap: '12px',
          padding: '24px 0',
        }}
      >
        {/* TabBar 标题装饰 */}
        <div className="mb-2">
          <div
            className="w-10 h-1 rounded-full mx-auto"
            style={{ background: 'linear-gradient(90deg, #12b8a6 0%, #0d9488 100%)' }}
          />
        </div>

        {/* 账号密码登录 Tab */}
        <TabButton
          icon={<FaUser />}
          label="账号"
          isActive={activeTab === 'password'}
          onClick={() => onTabChange('password')}
          title="账号密码登录"
        />

        {/* 公众号扫码登录 Tab */}
        <TabButton
          icon={<FaQrcode />}
          label="扫码"
          isActive={activeTab === 'qrcode'}
          onClick={() => onTabChange('qrcode')}
          title="公众号扫码登录"
        />

        {/* 公众号验证码登录 Tab */}
        <TabButton
          icon={<FaKey />}
          label="验证码"
          isActive={activeTab === 'gzh'}
          onClick={() => onTabChange('gzh')}
          title="公众号验证码登录"
        />
      </div>

      {/* 小屏幕顶部 TabBar - 只显示图标 */}
      <div
        className="sm:hidden flex flex-row items-center justify-center rounded-t-2xl shadow-xl w-full"
        style={{
          background: 'linear-gradient(90deg, #f8fafc 0%, #e2e8f0 100%)',
          gap: '8px',
          padding: '8px 12px',
        }}
      >
        <MobileTabButton
          icon={<FaUser className="text-base" />}
          isActive={activeTab === 'password'}
          onClick={() => onTabChange('password')}
          title="账号密码登录"
        />
        <MobileTabButton
          icon={<FaQrcode className="text-base" />}
          isActive={activeTab === 'qrcode'}
          onClick={() => onTabChange('qrcode')}
          title="公众号扫码登录"
        />
        <MobileTabButton
          icon={<FaKey className="text-base" />}
          isActive={activeTab === 'gzh'}
          onClick={() => onTabChange('gzh')}
          title="公众号验证码登录"
        />
      </div>
    </>
  );
};

// 桌面端 Tab 按钮
interface TabButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  title: string;
}

const TabButton: React.FC<TabButtonProps> = ({ icon, label, isActive, onClick, title }) => (
  <button
    onClick={onClick}
    className="group relative w-14 h-14 rounded-xl flex flex-col items-center justify-center transition-all duration-300 hover:scale-105"
    style={{
      background: isActive
        ? 'linear-gradient(135deg, #12b8a6 0%, #0d9488 100%)'
        : 'transparent',
      boxShadow: isActive
        ? '0 8px 20px rgba(18, 184, 166, 0.35), 0 0 0 3px rgba(18, 184, 166, 0.2)'
        : '0 2px 8px rgba(0, 0, 0, 0.05)',
      transform: isActive ? 'scale(1.05)' : 'scale(1)',
    }}
    title={title}
  >
    {isActive && (
      <div className="absolute inset-0 rounded-xl animate-pulse opacity-30 bg-white" />
    )}
    <span
      className={`text-xl transition-colors duration-300 ${
        isActive ? 'text-white' : 'text-gray-500 group-hover:text-teal-600'
      }`}
    >
      {icon}
    </span>
    <span
      className={`text-[10px] font-medium mt-1 transition-colors duration-300 ${
        isActive ? 'text-white' : 'text-gray-500 group-hover:text-teal-600'
      }`}
    >
      {label}
    </span>
    {/* 激活指示器 */}
    {isActive && (
      <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-teal-500 rounded-r-full shadow-lg" />
    )}
  </button>
);

// 移动端 Tab 按钮
interface MobileTabButtonProps {
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  title: string;
}

const MobileTabButton: React.FC<MobileTabButtonProps> = ({ icon, isActive, onClick, title }) => (
  <button
    onClick={onClick}
    className="group relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200"
    style={{
      background: isActive
        ? 'linear-gradient(135deg, #12b8a6 0%, #0d9488 100%)'
        : 'transparent',
      boxShadow: isActive ? '0 4px 12px rgba(18, 184, 166, 0.3)' : 'none',
    }}
    title={title}
  >
    <span
      className={`transition-colors duration-200 ${
        isActive ? 'text-white' : 'text-gray-500'
      }`}
    >
      {icon}
    </span>
  </button>
);

export default TabBar;