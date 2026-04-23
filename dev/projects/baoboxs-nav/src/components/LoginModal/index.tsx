/**
 * LoginModal - 登录弹窗主入口
 * 重构后的入口文件，整合子组件
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { FaTimes } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchLoginCaptcha,
  createLoginStatusListener,
  register as apiRegister,
  login as apiLogin,
  loginByGzhCode,
} from '@/services/api';
import { initDeviceId } from '@/utils/device';
import { STORAGE_KEYS } from '@/constants/storage';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '../ui/ToastContainer';

import { TabBar } from './TabBar';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { QRCodeLogin } from './QRCodeLogin';
import { GzhLogin } from './GzhLogin';
import type { LoginTab } from './types';

interface LoginModalProps {
  onClose: (reason?: 'manual' | 'success') => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
  // ==================== 基础状态 ====================
  const [isMounted, setIsMounted] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<LoginTab>('qrcode');
  const [tabSwitchAnimation, setTabSwitchAnimation] = useState(false);
  const [isModalActive, setIsModalActive] = useState(true);

  // ==================== 表单状态 ====================
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');

  // ==================== 密码可见性 ====================
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ==================== 验证码状态 ====================
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [captchaError, setCaptchaError] = useState(false);
  const [token, setToken] = useState('');
  const [expireTime, setExpireTime] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [initialDuration, setInitialDuration] = useState(0);
  const [pauseCountdown, setPauseCountdown] = useState(false);

  // ==================== 公众号登录 ====================
  const [gzhCode, setGzhCode] = useState('');
  const [isGzhSubmitting, setIsGzhSubmitting] = useState(false);

  // ==================== Refs ====================
  const portalElRef = useRef<HTMLDivElement | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadingRef = useRef(false);
  const lastRequestTimeRef = useRef(0);

  // ==================== Hooks ====================
  const { login } = useAuth();
  const { toasts, showError, removeToast } = useToast();

  // ==================== 工具函数 ====================
  const getDeviceId = useCallback(() => initDeviceId() || '', []);

  // iOS 兼容的时间解析
  const parseServerDateSafe = useCallback((input: unknown): Date | null => {
    try {
      if (input instanceof Date && !isNaN(input.getTime())) return input;
      if (typeof input === 'number') {
        const ms = input < 1e12 ? input * 1000 : input;
        const d = new Date(ms);
        return isNaN(d.getTime()) ? null : d;
      }
      if (typeof input === 'string') {
        const s = input.trim();
        if (/^\d{10,13}$/.test(s)) {
          const n = Number(s);
          const ms = s.length === 10 ? n * 1000 : n;
          const d = new Date(ms);
          return isNaN(d.getTime()) ? null : d;
        }
        const m = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
        if (m) {
          const [, y, mo, d, h = '0', mi = '0', se = '0'] = m;
          const date = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(se));
          return isNaN(date.getTime()) ? null : date;
        }
        const d2 = new Date(s.replace(/-/g, '/'));
        return isNaN(d2.getTime()) ? null : d2;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // ==================== 验证函数 ====================
  const validateUsername = (value: string) => /^[A-Za-z][A-Za-z0-9_]{6,18}$/.test(value);
  const validatePassword = (value: string) => value.length >= 6;
  const validateNickname = (value: string) => /^[\u4e00-\u9fa5a-zA-Z0-9_]{2,20}$/.test(value);
  const validateGzhCode = (code: string) => /^\d{4,6}$/.test(code);

  // ==================== 清理资源 ====================
  const cleanupResources = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  // ==================== SSE 连接 ====================
  const createSseConnection = useCallback((deviceId: string, code: string) => {
    if (!isModalActive) return;
    if (eventSourceRef.current) eventSourceRef.current.close();

    const eventSource = createLoginStatusListener(deviceId, code);
    eventSourceRef.current = eventSource;
    const messageReceivedRef = { value: false };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        messageReceivedRef.value = true;

        if (data.code === 0 && data.data) {
          setPauseCountdown(true);
          if (data.data.token) setToken(data.data.token);

          if (data.data.userName || data.data.username) {
            const userData = { ...data.data, loginTime: Date.now() };
            localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
            localStorage.setItem(STORAGE_KEYS.LAST_TOKEN_REFRESH_TIME, Date.now().toString());
            eventSource.close();
            eventSourceRef.current = null;
            login(userData);

            const currentPath = window.location.pathname;
            if (currentPath.includes('/bookmarks') || currentPath.includes('/favorites')) {
              window.dispatchEvent(new Event('LOGIN_SUCCESS_RELOAD_DATA'));
              onClose();
            } else {
              onClose('success');
            }
          } else {
            eventSource.close();
            eventSourceRef.current = null;
            setIsNewUser(true);
            setError('请完成注册以继续使用');
          }
        } else if (data.code !== 0) {
          setError(data.errorMsg || '登录失败，请重试');
          eventSource.close();
          eventSourceRef.current = null;
        }
      } catch (e) {
        console.error('解析SSE消息出错:', e);
      }
    };

    eventSource.onerror = () => {
      if (messageReceivedRef.value) {
        eventSource.close();
        eventSourceRef.current = null;
      }
    };

    return eventSource;
  }, [onClose, isModalActive, login]);

  // ==================== 获取验证码 ====================
  const fetchCaptcha = useCallback(async () => {
    if (!isModalActive) return;
    const now = Date.now();
    if (isLoadingRef.current || now - lastRequestTimeRef.current < 3000) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    isLoadingRef.current = true;
    lastRequestTimeRef.current = now;
    setCaptchaLoading(true);
    setCaptchaError(false);

    try {
      const deviceId = getDeviceId();
      const data = await fetchLoginCaptcha(deviceId);
      if (data) {
        setCaptchaCode(String(data.code));
        const expDate = parseServerDateSafe(data.expDate);
        if (!expDate || isNaN(expDate.getTime())) {
          setCaptchaError(true);
          return;
        }
        setExpireTime(expDate);
        const diffSeconds = Math.floor((expDate.getTime() - Date.now()) / 1000);
        const validDuration = diffSeconds > 0 ? diffSeconds : 0;
        setInitialDuration(validDuration);
        setCountdown(Math.max(0, diffSeconds));
        setCaptchaError(false);
        createSseConnection(deviceId, String(data.code));
      } else {
        setCaptchaError(true);
      }
    } catch {
      setCaptchaError(true);
    } finally {
      setCaptchaLoading(false);
      setTimeout(() => { isLoadingRef.current = false; }, 1000);
    }
  }, [getDeviceId, parseServerDateSafe, createSseConnection, isModalActive]);

  // ==================== 倒计时 ====================
  useEffect(() => {
    if (!isModalActive || !expireTime || pauseCountdown) {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      return;
    }

    const calculateCountdown = () => {
      const diffSeconds = Math.floor((expireTime.getTime() - Date.now()) / 1000);
      return Math.max(0, diffSeconds);
    };

    setCountdown(calculateCountdown());

    const timer = setInterval(() => {
      if (!isModalActive) {
        clearInterval(timer);
        return;
      }
      const diffSeconds = calculateCountdown();
      if (diffSeconds <= 0) {
        clearInterval(timer);
        countdownTimerRef.current = null;
        setCountdown(0);
        setCaptchaCode('');
        setTimeout(() => {
          if (isModalActive && !captchaError && !isLoadingRef.current) {
            fetchCaptcha();
          }
        }, 100);
      } else {
        setCountdown(diffSeconds);
      }
    }, 1000);

    countdownTimerRef.current = timer;
    return () => {
      clearInterval(timer);
      if (countdownTimerRef.current === timer) countdownTimerRef.current = null;
    };
  }, [expireTime, captchaError, pauseCountdown, isModalActive, fetchCaptcha]);

  // ==================== 挂载/卸载 ====================
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const html = document.documentElement;
    const body = document.body;
    const originalHtmlOverflow = html.style.overflow;
    const originalBodyOverflow = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';

    const el = document.createElement('div');
    el.setAttribute('data-modal-root', 'true');
    el.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:2147483647;width:100vw;height:100vh;isolation:isolate;pointer-events:auto;';
    document.body.appendChild(el);
    portalElRef.current = el;

    return () => {
      html.style.overflow = originalHtmlOverflow;
      body.style.overflow = originalBodyOverflow;
      if (portalElRef.current?.parentNode) {
        portalElRef.current.parentNode.removeChild(portalElRef.current);
      }
      portalElRef.current = null;
    };
  }, [isMounted]);

  useEffect(() => {
    return () => cleanupResources();
  }, [cleanupResources]);

  useEffect(() => {
    if (isModalActive) fetchCaptcha();
  }, [isModalActive, fetchCaptcha]);

  useEffect(() => {
    if (activeTab === 'qrcode' && isModalActive && !captchaLoading && countdown === 0 && !captchaCode && !captchaError) {
      fetchCaptcha();
    }
  }, [activeTab, isModalActive, captchaLoading, countdown, captchaCode, captchaError, fetchCaptcha]);

  // ==================== Tab 切换 ====================
  const handleTabSwitch = useCallback((tab: LoginTab) => {
    if (tab === activeTab) return;
    setTabSwitchAnimation(true);
    setActiveTab(tab);
    setError('');
    setTimeout(() => setTabSwitchAnimation(false), 300);
  }, [activeTab]);

  // ==================== 登录处理 ====================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }
    if (!validateUsername(username)) {
      setError('用户名格式不正确');
      return;
    }
    if (!validatePassword(password)) {
      setError('密码长度不能小于6位');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await apiLogin(username, password);
      if (response?.code === 0) {
        const userData = { ...response.data, loginTime: Date.now(), username: response.data.username || username };
        login(userData);
        localStorage.setItem(STORAGE_KEYS.LAST_TOKEN_REFRESH_TIME, Date.now().toString());

        const currentPath = window.location.pathname;
        if (currentPath.includes('/bookmarks') || currentPath.includes('/favorites')) {
          window.dispatchEvent(new Event('LOGIN_SUCCESS_RELOAD_DATA'));
          onClose();
        } else {
          onClose('success');
        }
      } else {
        setError(response?.errorMsg || '登录失败');
      }
    } catch {
      setError('登录失败，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== 注册处理 ====================
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !nickname || !email) {
      setError('请填写所有必填字段');
      return;
    }
    if (!validateUsername(username)) {
      setError('用户名格式不正确');
      return;
    }
    if (!validatePassword(password)) {
      setError('密码长度不能小于6位');
      return;
    }
    if (!validateNickname(nickname)) {
      setError('昵称格式不正确');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    if (!token) {
      setError('注册凭证已失效，请重新扫码');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await apiRegister(username, password, nickname, email, token);
      if (response.code === 0) {
        const userData = { ...response.data, loginTime: Date.now(), email, username: response.data.username || username };
        login(userData);
        localStorage.setItem(STORAGE_KEYS.LAST_TOKEN_REFRESH_TIME, Date.now().toString());

        const currentPath = window.location.pathname;
        if (currentPath.includes('/bookmarks') || currentPath.includes('/favorites')) {
          window.dispatchEvent(new Event('LOGIN_SUCCESS_RELOAD_DATA'));
          onClose();
        } else {
          onClose('success');
        }
      } else {
        setError(response.errorMsg);
      }
    } catch {
      setError('注册失败，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== 公众号验证码登录 ====================
  const handleGzhLogin = async () => {
    if (!gzhCode.trim()) {
      setError('请输入验证码');
      return;
    }
    if (!validateGzhCode(gzhCode.trim())) {
      setError('验证码格式不正确(4-6位数字)');
      return;
    }

    setIsGzhSubmitting(true);
    setError('');

    try {
      const deviceId = getDeviceId();
      const response = await loginByGzhCode(gzhCode.trim(), deviceId);

      if (response?.code === 0) {
        const userData = response.data;
        if (userData.userName || userData.username) {
          const completeUserData = { ...userData, loginTime: Date.now() };
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(completeUserData));
          localStorage.setItem(STORAGE_KEYS.LAST_TOKEN_REFRESH_TIME, Date.now().toString());
          login(completeUserData);

          const currentPath = window.location.pathname;
          if (currentPath.includes('/bookmarks') || currentPath.includes('/favorites')) {
            window.dispatchEvent(new Event('LOGIN_SUCCESS_RELOAD_DATA'));
            onClose();
          } else {
            onClose('success');
          }
        } else {
          if (userData.token) setToken(userData.token);
          setIsNewUser(true);
          setError('请完成注册以继续使用');
        }
      } else {
        const errorMessage = response?.errorMsg || '验证码错误，请重试';
        setError(errorMessage);
        showError('验证失败', errorMessage);
        if (response?.code === 1001 || response?.code === 1002) {
          setGzhCode('');
        }
      }
    } catch {
      const errorMessage = '登录失败，请稍后再试';
      setError(errorMessage);
      showError('登录失败', errorMessage);
    } finally {
      setIsGzhSubmitting(false);
    }
  };

  // ==================== 关闭弹窗 ====================
  const handleModalClose = useCallback((reason?: 'manual' | 'success') => {
    setIsModalActive(false);
    cleanupResources();
    onClose(reason);
  }, [onClose, cleanupResources]);

  // ==================== 倒计时格式化 ====================
  const formatCountdown = () => `${countdown}s`;

  // ==================== 渲染 ====================
  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black/50 ios-modal-overlay pointer-events-auto isolate"
      style={{ width: '100vw', height: '100vh', zIndex: 2147483647 }}
    >
      <div className="flex flex-col sm:flex-row items-start" style={{ margin: '0.5rem' }}>
        <TabBar activeTab={activeTab} onTabChange={handleTabSwitch} />

        <div
          ref={modalRef}
          className="bg-white sm:rounded-r-2xl sm:rounded-bl-2xl rounded-b-2xl shadow-xl relative max-h-[90dvh] overflow-auto"
          style={{
            width: '580px',
            maxWidth: 'calc(100vw - 1rem)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          }}
        >
          <button
            onClick={() => handleModalClose('manual')}
            className="absolute right-5 top-4 text-gray-400 hover:text-gray-600 z-10 transition-colors hover:rotate-90 duration-300"
          >
            <FaTimes className="text-xl" />
          </button>

          <div className="p-8">
            <h2 className="text-2xl font-semibold text-center text-[#2a8a84] mb-2">
              欢迎来到程序员宝盒
            </h2>
            <p className="text-center text-sm text-gray-500 mb-6">选择您喜欢的方式登录</p>
            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>

            {!isNewUser ? (
              <div className={`transition-all duration-300 ${tabSwitchAnimation ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
                {activeTab === 'password' && (
                  <LoginForm
                    username={username}
                    password={password}
                    showPassword={showLoginPassword}
                    error={error}
                    isLoading={isLoading}
                    onUsernameChange={setUsername}
                    onPasswordChange={setPassword}
                    onTogglePassword={() => setShowLoginPassword(!showLoginPassword)}
                    onSubmit={handleLogin}
                    onSwitchToRegister={() => handleTabSwitch('qrcode')}
                    validateUsername={validateUsername}
                    validatePassword={validatePassword}
                  />
                )}
                {activeTab === 'qrcode' && (
                  <QRCodeLogin
                    captchaCode={captchaCode}
                    captchaLoading={captchaLoading}
                    captchaError={captchaError}
                    countdown={countdown}
                    initialDuration={initialDuration}
                    error={error}
                    onRefresh={fetchCaptcha}
                    formatCountdown={formatCountdown}
                  />
                )}
                {activeTab === 'gzh' && (
                  <GzhLogin
                    gzhCode={gzhCode}
                    isSubmitting={isGzhSubmitting}
                    error={error}
                    onCodeChange={setGzhCode}
                    onSubmit={handleGzhLogin}
                  />
                )}
              </div>
            ) : (
              <RegisterForm
                username={username}
                password={password}
                confirmPassword={confirmPassword}
                nickname={nickname}
                email={email}
                showRegisterPassword={showRegisterPassword}
                showConfirmPassword={showConfirmPassword}
                error={error}
                isLoading={isLoading}
                onUsernameChange={setUsername}
                onPasswordChange={setPassword}
                onConfirmPasswordChange={setConfirmPassword}
                onNicknameChange={setNickname}
                onEmailChange={setEmail}
                onToggleRegisterPassword={() => setShowRegisterPassword(!showRegisterPassword)}
                onToggleConfirmPassword={() => setShowConfirmPassword(!showConfirmPassword)}
                onSubmit={handleRegister}
                validateUsername={validateUsername}
                validateNickname={validateNickname}
              />
            )}

            <div className="mt-6 text-center text-sm text-gray-600">
              <div className="mb-2">程序员宝盒 - 您的编程导航助手</div>
              <div className="text-xs">
                登录即同意
                <Link href="/agreement" target="_blank" className="text-teal-600 hover:underline mx-1">
                  用户协议
                </Link>
                |
                <Link href="/privacy" target="_blank" className="text-teal-600 hover:underline mx-1">
                  隐私政策
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isMounted) return null;

  return (
    <>
      {createPortal(modalContent, portalElRef.current || document.body)}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </>
  );
};

export default LoginModal;