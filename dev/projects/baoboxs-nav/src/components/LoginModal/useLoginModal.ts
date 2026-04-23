/**
 * useLoginModal - 登录弹窗状态管理 Hook
 * 从 LoginModal.tsx 提取的状态和逻辑
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { createLoginStatusListener } from '@/services/api';
import { initDeviceId } from '@/utils/device';
import { STORAGE_KEYS } from '@/constants/storage';

export type LoginTab = 'password' | 'qrcode' | 'gzh';

export interface LoginModalState {
  // 基础状态
  isMounted: boolean;
  isNewUser: boolean;
  isLoading: boolean;
  error: string;
  
  // 登录方式
  activeTab: LoginTab;
  
  // 密码登录/注册
  username: string;
  password: string;
  confirmPassword: string;
  nickname: string;
  email: string;
  agreeTerms: boolean;
  
  // 密码可见性
  showLoginPassword: boolean;
  showRegisterPassword: boolean;
  showConfirmPassword: boolean;
  
  // 验证码
  captchaCode: string;
  captchaLoading: boolean;
  captchaError: boolean;
  token: string;
  expireTime: Date | null;
  countdown: number;
  pauseCountdown: boolean;
  
  // 公众号登录
  gzhCode: string;
  isGzhSubmitting: boolean;
  
  // 动画
  tabSwitchAnimation: boolean;
}

export function useLoginModal(onClose: (reason?: 'manual' | 'success') => void) {
  // 基础状态
  const [isMounted, setIsMounted] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 登录方式
  const [activeTab, setActiveTab] = useState<LoginTab>('qrcode');
  
  // 密码登录/注册
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  // 密码可见性
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // 验证码
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [captchaError, setCaptchaError] = useState(false);
  const [token, setToken] = useState('');
  const [expireTime, setExpireTime] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [pauseCountdown, setPauseCountdown] = useState(false);
  
  // 公众号登录
  const [gzhCode, setGzhCode] = useState('');
  const [isGzhSubmitting, setIsGzhSubmitting] = useState(false);
  
  // 动画
  const [tabSwitchAnimation, setTabSwitchAnimation] = useState(false);
  
  // Refs
  const eventSourceRef = useRef<EventSource | null>(null);
  const countdownTimerRef = useState<NodeJS.Timeout | null>(null);
  const isLoadingRef = useRef(false);
  const [isModalActive, setIsModalActive] = useState(true);
  
  // 生成设备ID
  const getDeviceId = useCallback(() => {
    return initDeviceId() || '';
  }, []);
  
  // 挂载状态
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // 清理资源
  const cleanupResources = useCallback(() => {
    if (countdownTimerRef[0]) {
      clearInterval(countdownTimerRef[0]);
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);
  
  // 组件卸载清理
  useEffect(() => {
    return () => {
      cleanupResources();
    };
  }, [cleanupResources]);
  
  // 切换Tab
  const switchTab = useCallback((tab: LoginTab) => {
    setTabSwitchAnimation(true);
    setActiveTab(tab);
    setError('');
    setTimeout(() => setTabSwitchAnimation(false), 200);
  }, []);
  
  // 重置表单
  const resetForm = useCallback(() => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setNickname('');
    setEmail('');
    setAgreeTerms(false);
    setError('');
    setCaptchaCode('');
    setToken('');
    setIsNewUser(false);
    setPauseCountdown(false);
  }, []);
  
  return {
    // 状态
    isMounted,
    isNewUser,
    isLoading,
    error,
    activeTab,
    username,
    password,
    confirmPassword,
    nickname,
    email,
    agreeTerms,
    showLoginPassword,
    showRegisterPassword,
    showConfirmPassword,
    captchaCode,
    captchaLoading,
    captchaError,
    token,
    expireTime,
    countdown,
    pauseCountdown,
    gzhCode,
    isGzhSubmitting,
    tabSwitchAnimation,
    isModalActive,
    
    // Setters
    setIsMounted,
    setIsNewUser,
    setIsLoading,
    setError,
    setActiveTab,
    setUsername,
    setPassword,
    setConfirmPassword,
    setNickname,
    setEmail,
    setAgreeTerms,
    setShowLoginPassword,
    setShowRegisterPassword,
    setShowConfirmPassword,
    setCaptchaCode,
    setCaptchaLoading,
    setCaptchaError,
    setToken,
    setExpireTime,
    setCountdown,
    setPauseCountdown,
    setGzhCode,
    setIsGzhSubmitting,
    setIsModalActive,
    
    // 方法
    getDeviceId,
    cleanupResources,
    switchTab,
    resetForm,
    
    // Refs
    eventSourceRef,
    countdownTimerRef,
    isLoadingRef,
  };
}