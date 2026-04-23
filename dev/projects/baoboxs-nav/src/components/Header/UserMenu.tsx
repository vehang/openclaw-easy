import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { FaUser } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import LoginModal from '@/components/LoginModal';
import { STORAGE_KEYS, USER_DATA_UPDATED_EVENT } from '@/constants/storage';
import { isUserFullyRegistered } from '@/utils/auth';

const UserMenu: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isUserDataLoading, setIsUserDataLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 使用本地存储Hook获取用户数据
  const [userData, setUserData] = useLocalStorage<any>(STORAGE_KEYS.USER_DATA, null);

  // 从缓存中读取用户数据
  const refreshUserData = useCallback(() => {
    try {
      setIsUserDataLoading(true);
      // 确保只在客户端执行
      if (typeof window === 'undefined') return;
      
      const cachedUserData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (cachedUserData) {
        const parsedData = JSON.parse(cachedUserData);
        setUserData(parsedData);
        console.log('用户数据已刷新');
      } else {
        setUserData(null);
      }
    } catch (error) {
      console.error('解析缓存的用户数据出错:', error);
    } finally {
      setIsUserDataLoading(false);
    }
  }, [setUserData]);

  // 监听用户数据更新事件
  useEffect(() => {
    // 确保只在客户端执行
    if (typeof window === 'undefined') return;
    
    // 创建事件监听器，当其他组件更新用户数据时触发刷新
    const handleUserDataUpdate = () => {
      console.log('接收到用户数据更新事件');
      refreshUserData();
    };
    
    // 添加事件监听
    window.addEventListener(USER_DATA_UPDATED_EVENT, handleUserDataUpdate);
    
    // 组件挂载时也刷新一次数据
    refreshUserData();
    
    // 组件卸载时移除事件监听
    return () => {
      window.removeEventListener(USER_DATA_UPDATED_EVENT, handleUserDataUpdate);
      // 清理定时器
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []); // 移除refreshUserData依赖，只在组件挂载时执行一次

  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  const handleCloseModal = () => {
    setShowLoginModal(false);
    // 模态框关闭时刷新用户数据（事件监听器会处理刷新）
    refreshUserData();
  };

  const handleLogout = () => {
    logout();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userData');
      localStorage.removeItem('lastTokenRefreshTime');
    }
    setUserData(null);
    setShowUserMenu(false); // 登出后关闭菜单
    
    // 跳转到主页
    router.push('/');
  };

  // 添加鼠标进入和离开的处理函数
  const handleMouseEnter = () => {
    // 清除之前的隐藏定时器
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setShowUserMenu(true);
  };

  const handleMouseLeave = () => {
    // 添加延迟，给用户时间移动鼠标到菜单上
    hideTimeoutRef.current = setTimeout(() => {
      setShowUserMenu(false);
    }, 300);
  };

  // 菜单区域的鼠标事件处理
  const handleMenuMouseEnter = () => {
    // 清除隐藏定时器，保持菜单显示
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setShowUserMenu(true);
  };

  const handleMenuMouseLeave = () => {
    // 立即隐藏菜单
    setShowUserMenu(false);
  };

  return (
    <div className="flex-shrink-0">
      {isUserDataLoading ? (
        // 数据加载中显示加载状态
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gray-600 animate-pulse"></div>
          <div className="hidden md:block w-16 h-4 bg-gray-600 rounded animate-pulse"></div>
        </div>
      ) : isUserFullyRegistered(userData) ? (
        <div className="relative">
          <button 
            className="flex items-center space-x-2 focus:outline-none hover:opacity-80 transition-opacity"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-teal-400">
              <Image 
                src={userData?.avatarUrl || user?.avatarUrl || "/icons/def_user_icon1.png"} 
                alt={(userData?.username || user?.username || "用户头像")} 
                width={32} 
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
            <span 
              className="hidden md:inline-block text-sm max-w-16 lg:max-w-24 xl:max-w-32 truncate" 
              title={userData?.nickname || userData?.username || ''}
            >
              {userData?.nickname || userData?.username}
            </span>
          </button>
          
          {/* 用户菜单 */}
          {showUserMenu && (
            <>
              {/* 透明连接区域，方便鼠标移动 */}
              <div 
                className="absolute right-0 top-full w-48 h-2 z-40"
                onMouseEnter={handleMenuMouseEnter}
                onMouseLeave={handleMenuMouseLeave}
              />
              <div 
                className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
                onMouseEnter={handleMenuMouseEnter}
                onMouseLeave={handleMenuMouseLeave}
                style={{
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  animation: 'fadeIn 0.15s ease-out'
                }}
              >
                {/* 暂时隐藏个人中心和账号设置 */}
                {/* <a href="/user/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">个人中心</a> */}
                {/* <a href="/user/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">账号设置</a> */}
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  退出登录
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <button 
          onClick={handleLoginClick}
          className="flex items-center justify-center bg-teal-500 hover:bg-teal-600 text-white rounded-md transition-colors md:px-4 md:py-1.5 p-2"
        >
          <FaUser className="text-sm" />
          <span className="text-sm hidden md:inline-block ml-2">登录/注册</span>
        </button>
      )}

      {/* 登录模态框 */}
      {showLoginModal && <LoginModal onClose={handleCloseModal} />}
    </div>
  );
};

export default UserMenu; 