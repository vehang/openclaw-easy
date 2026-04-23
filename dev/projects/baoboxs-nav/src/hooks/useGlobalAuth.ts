import { useEffect, useState } from 'react';
import { STORAGE_KEYS } from '@/constants/storage';
import { localStorageUtils } from '@/utils/localStorage';

export const useGlobalAuth = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const handleTokenExpired = () => {
      console.log('Token过期，显示登录窗口');
      setShowLoginModal(true);
    };

    // 监听token过期事件
    window.addEventListener(STORAGE_KEYS.TOKEN_EXPIRED_EVENT, handleTokenExpired);

    return () => {
      window.removeEventListener(STORAGE_KEYS.TOKEN_EXPIRED_EVENT, handleTokenExpired);
    };
  }, []);

  return {
    showLoginModal,
    setShowLoginModal
  };
}; 