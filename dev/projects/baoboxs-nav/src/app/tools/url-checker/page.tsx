'use client';

import React, { useState, useEffect } from 'react';
import { FiSearch, FiPlus, FiSettings, FiTrash2, FiEdit3, FiRefreshCw, FiShield, FiAlertTriangle, FiCheck } from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';
import { UrlCheckManager } from '@/components/UrlCheck/UrlCheckManager';
import { TokenBinding } from '@/components/UrlCheck/TokenBinding';
import { UrlQuickCheck } from '@/components/UrlCheck/UrlQuickCheck';
import LoginModal from '@/components/LoginModal';
import { STORAGE_KEYS } from '@/constants/storage';

declare global {
  interface Window {
    showLoginModal?: () => void;
  }
}

const UrlCheckerPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('quick-check');
  const { user, isAuthenticated, isLoading } = useAuth();
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // 登录状态检查
  useEffect(() => {
    if (isLoading) return;

    const checkLoginStatus = () => {
      if (typeof window !== 'undefined') {
        const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
        const hasUserData = !!userData;
        const hookAuth = isAuthenticated;
        const finalStatus = hasUserData || hookAuth;
        
        console.log('URL检测页面 - 登录状态检查:', { 
          hasUserData, 
          hookAuth, 
          finalStatus
        });
        
        // 使用函数式更新避免依赖当前状态
        setUserLoggedIn(currentStatus => {
          if (finalStatus !== currentStatus) {
            console.log('URL检测页面 - 登录状态发生变化:', finalStatus ? '已登录' : '未登录');
            return finalStatus;
          }
          return currentStatus;
        });
        
        // 如果未登录且当前在需要登录的tab，强制切换到快速检测
        if (!finalStatus && (activeTab === 'token-binding' || activeTab === 'url-manager')) {
          console.log('URL检测页面 - 未登录状态，强制切换到快速检测');
          setActiveTab('quick-check');
        }
      }
    };

    // 立即检查一次
    checkLoginStatus();

    // 监听各种状态变化事件
    const handleChange = (eventType: string) => {
      console.log(`URL检测页面 - 收到事件: ${eventType}`);
      // 稍微延迟执行，确保状态已经更新
      setTimeout(() => {
        checkLoginStatus();
      }, 100);
    };

    const handleStorageChange = () => handleChange('storage');
    const handleUserDataUpdate = () => handleChange('userData_updated');
    const handleLoginStateChange = () => handleChange('LOGIN_STATE_CHANGED');
    const handleUserDataUpdated = () => handleChange('USER_DATA_UPDATED');

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userData_updated', handleUserDataUpdate);
    window.addEventListener('LOGIN_STATE_CHANGED', handleLoginStateChange);
    window.addEventListener('USER_DATA_UPDATED', handleUserDataUpdated);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userData_updated', handleUserDataUpdate);
      window.removeEventListener('LOGIN_STATE_CHANGED', handleLoginStateChange);
      window.removeEventListener('USER_DATA_UPDATED', handleUserDataUpdated);
    };
  }, [isAuthenticated, isLoading, activeTab]);

  // 单独监听 isAuthenticated 的变化，确保 hook 状态变化时立即响应
  useEffect(() => {
    if (!isLoading) {
      console.log('URL检测页面 - useAuth状态变化:', { isAuthenticated });
      // 使用函数式更新避免依赖当前状态
      setUserLoggedIn(currentStatus => {
        if (isAuthenticated !== currentStatus) {
          console.log('URL检测页面 - useAuth状态与本地状态不一致，立即更新');
          return isAuthenticated;
        }
        return currentStatus;
      });
    }
  }, [isAuthenticated, isLoading]);

  // 专门监听登录成功事件，确保登录后立即更新状态
  useEffect(() => {
    const handleLoginSuccess = () => {
      console.log('URL检测页面 - 收到登录成功事件，立即刷新状态');
      
      // 强制重新检查登录状态
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
          const hasUserData = !!userData;
          
          if (hasUserData) {
            console.log('URL检测页面 - 登录成功，设置为已登录状态');
            // 使用函数式更新确保状态正确设置
            setUserLoggedIn(currentStatus => {
              if (!currentStatus) {
                return true;
              }
              return currentStatus;
            });
          }
        }
      }, 50);
    };

    // 监听登录成功相关的事件
    window.addEventListener('LOGIN_SUCCESS_RELOAD_DATA', handleLoginSuccess);
    
    return () => {
      window.removeEventListener('LOGIN_SUCCESS_RELOAD_DATA', handleLoginSuccess);
    };
  }, []);

  // 设置全局登录模态框函数
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.showLoginModal = () => {
        setShowLoginModal(true);
      };
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete window.showLoginModal;
      }
    };
  }, []);

  // 处理登录模态框关闭
  const handleCloseLoginModal = (reason?: 'manual' | 'success') => {
    setShowLoginModal(false);
    
    // 如果登录成功，状态会通过事件监听器自动更新
    if (reason === 'success') {
      console.log('URL检测页面 - 登录成功，页面状态将自动更新');
    }
  };

  // 调试登录状态
  useEffect(() => {
    console.log('URL检测页面 - 登录状态:', { 
      user: user?.username || '未登录', 
      isAuthenticated,
      userLoggedIn,
      isLoading 
    });
  }, [user, isAuthenticated, userLoggedIn, isLoading]);

  // 处理tab切换
  const handleTabClick = (tabId: string) => {
    // 检查是否是需要登录的tab
    const needsAuth = tabId === 'token-binding' || tabId === 'url-manager';
    
    if (needsAuth && !userLoggedIn) {
      // 未登录状态下点击需要登录的tab，弹出登录框
      setShowLoginModal(true);
      return; // 阻止tab切换
    }

    // 已登录或点击不需要登录的tab，允许切换
    setActiveTab(tabId);
  };

  const tabs = [
    { id: 'quick-check', label: '快速检测', icon: FiSearch, description: '无需登录，快速检测URL状态' },
    { id: 'token-binding', label: 'Token绑定', icon: FiSettings, description: '绑定爱语飞飞Token' },
    { id: 'url-manager', label: '检测管理', icon: FiShield, description: '管理定时检测任务' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                <FiShield className="text-teal-600 w-6 h-6 sm:w-7 sm:h-7" />
                URL安全检测
              </h1>
              <p className="mt-2 text-sm sm:text-base text-gray-600">
                基于腾讯安全和微信平台的URL检测服务，支持实时检测和定时监控
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
              <FiCheck className="text-green-500" />
              <span>腾讯安全</span>
              <FiCheck className="text-green-500" />
              <span>微信检测</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const needsAuth = tab.id === 'token-binding' || tab.id === 'url-manager';
              const isDisabled = needsAuth && !userLoggedIn;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`
                    group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                    ${isActive
                      ? 'border-teal-500 text-teal-600'
                      : isDisabled
                      ? 'border-transparent text-gray-400 cursor-pointer'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${
                    isActive ? 'text-teal-600' : isDisabled ? 'text-gray-400' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  <span>{tab.label}</span>
                  {isDisabled && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                      需要登录
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab description */}
        <div className="mt-4 mb-6">
          {tabs.map((tab) => (
            activeTab === tab.id && (
              <p key={tab.id} className="text-gray-600 text-xs sm:text-sm">
                {tab.description}
              </p>
            )
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* 快速检测 - 不需要登录 */}
        {activeTab === 'quick-check' && <UrlQuickCheck />}
        
        {/* Token绑定 - 需要登录 */}
        {activeTab === 'token-binding' && (
          userLoggedIn ? (
            <TokenBinding />
          ) : (
            <LoginPrompt onShowLogin={() => setShowLoginModal(true)} />
          )
        )}
        
        {/* 检测管理 - 需要登录 */}
        {activeTab === 'url-manager' && (
          userLoggedIn ? (
            <UrlCheckManager />
          ) : (
            <LoginPrompt onShowLogin={() => setShowLoginModal(true)} />
          )
        )}
      </div>
      
      {/* 登录模态框 */}
      {showLoginModal && <LoginModal onClose={handleCloseLoginModal} />}
    </div>
  );
};

// 登录提示组件
const LoginPrompt: React.FC<{ onShowLogin: () => void }> = ({ onShowLogin }) => (
  <div className="text-center py-12">
    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
      <FiSettings className="w-8 h-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">需要登录才能使用此功能</h3>
    <p className="text-gray-600 mb-6">请先登录您的账户以访问此功能</p>
    <button
      onClick={onShowLogin}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
    >
      立即登录
    </button>
  </div>
);

export default UrlCheckerPage; 