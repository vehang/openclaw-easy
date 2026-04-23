"use client";

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { FaTimes, FaCheckCircle, FaSpinner, FaExclamationCircle } from 'react-icons/fa';
import { useErrorHandling } from '@/hooks/useErrorHandling';
import { useScrollLock } from '@/hooks/useScrollLock';

// 抖动动画样式
const shakeAnimation = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
    20%, 40%, 60%, 80% { transform: translateX(2px); }
  }
  .shake {
    animation: shake 0.5s ease-in-out;
  }
`;

interface SiteRecommendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowSuccess?: (title: string, message?: string) => void;
  onShowError?: (title: string, message?: string) => void;
}

interface SiteRecommendFormData {
  toolUrl: string;
  toolTitle: string;
  toolIcon: string;
  toolDescription: string;
}

interface FormErrors {
  toolUrl?: string;
  toolIcon?: string;
  toolDescription?: string;
}

type ValidationStatus = 'idle' | 'validating' | 'success' | 'error';

const SiteRecommendModal: React.FC<SiteRecommendModalProps> = ({
  isOpen,
  onClose,
  onShowSuccess,
  onShowError
}) => {
  const [formData, setFormData] = useState<SiteRecommendFormData>({
    toolUrl: '',
    toolTitle: '',
    toolIcon: '',
    toolDescription: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [shakingFields, setShakingFields] = useState<Set<string>>(new Set());
  const [urlValidationStatus, setUrlValidationStatus] = useState<ValidationStatus>('idle');
  const [iconValidationStatus, setIconValidationStatus] = useState<ValidationStatus>('idle');
  const { handleAsyncError } = useErrorHandling('工具推荐提交');

  // 弹窗滚动锁定
  useScrollLock(isOpen);

  // 触发抖动效果
  const triggerShake = (fieldName: string) => {
    setShakingFields(prev => new Set(prev).add(fieldName));
    setTimeout(() => {
      setShakingFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(fieldName);
        return newSet;
      });
    }, 500);
  };

  // 验证URL是否可访问（前端直接检测）
  const validateUrlAvailability = async (url: string, type: 'url' | 'icon'): Promise<boolean> => {
    if (!url.trim()) return false;

    try {
      // 先验证URL格式
      new URL(url.trim());
    } catch (error) {
      return false;
    }

    // 设置验证状态为验证中
    if (type === 'url') {
      setUrlValidationStatus('validating');
    } else {
      setIconValidationStatus('validating');
    }

    try {
      // 使用 fetch 的 no-cors 模式检测 URL 可访问性
      // no-cors 模式允许向不同源发起请求，虽然无法读取响应内容，但可以检测 URL 是否可达
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8秒超时

      await fetch(url.trim(), {
        method: 'GET',
        mode: 'no-cors', // 允许跨域请求
        cache: 'no-cache',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // 如果请求没有抛出错误，说明 URL 可访问
      console.log(`URL可访问: ${url}`);
      if (type === 'url') {
        setUrlValidationStatus('success');
      } else {
        setIconValidationStatus('success');
      }
      return true;
    } catch (error) {
      console.error(`URL不可访问: ${url}`, error);
      // 验证失败
      if (type === 'url') {
        setUrlValidationStatus('error');
      } else {
        setIconValidationStatus('error');
      }
      return false;
    }
  };

  // 表单验证
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // 网址验证（必填）
    if (!formData.toolUrl.trim()) {
      errors.toolUrl = '请输入网址';
      triggerShake('toolUrl');
    } else {
      try {
        new URL(formData.toolUrl.trim());
        // 检查 URL 可访问性验证状态
        if (urlValidationStatus === 'error') {
          errors.toolUrl = '网址无法访问，请检查';
          triggerShake('toolUrl');
        } else if (urlValidationStatus === 'validating') {
          errors.toolUrl = '正在验证网址，请稍候...';
          triggerShake('toolUrl');
        }
      } catch (error) {
        errors.toolUrl = '请输入有效的URL';
        triggerShake('toolUrl');
      }
    }

    // 图标验证（选填，但如果填写了需要验证URL格式）
    if (formData.toolIcon.trim()) {
      try {
        const iconUrl = new URL(formData.toolIcon.trim());
        // 验证是否为HTTP或HTTPS协议
        if (!iconUrl.protocol.match(/^https?:/)) {
          errors.toolIcon = '请输入有效的HTTP或HTTPS链接地址';
          triggerShake('toolIcon');
        } else {
          // 检查图标可访问性验证状态
          if (iconValidationStatus === 'error') {
            errors.toolIcon = '图标地址无法访问，请检查';
            triggerShake('toolIcon');
          } else if (iconValidationStatus === 'validating') {
            errors.toolIcon = '正在验证图标地址，请稍候...';
            triggerShake('toolIcon');
          }
        }
      } catch (error) {
        errors.toolIcon = '请输入有效的链接地址';
        triggerShake('toolIcon');
      }
    }

    // 描述验证（选填，但如果填写了不能超过300字）
    if (formData.toolDescription.trim() && formData.toolDescription.length > 300) {
      errors.toolDescription = '描述不能超过300字';
      triggerShake('toolDescription');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // 如果是描述字段，限制300字
    if (name === 'toolDescription' && value.length > 300) {
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));

    // 清除该字段的错误状态
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleInputBlur = async (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // 对网址进行实时验证和可访问性检测
    if (name === 'toolUrl' && value.trim()) {
      try {
        new URL(value.trim());
        // 先清除格式错误
        if (formErrors.toolUrl) {
          setFormErrors(prev => ({ ...prev, toolUrl: undefined }));
        }
        // 调用API验证URL可访问性
        const isAccessible = await validateUrlAvailability(value.trim(), 'url');
        if (!isAccessible) {
          setFormErrors(prev => ({ ...prev, toolUrl: '网址无法访问，请检查' }));
          triggerShake('toolUrl');
        }
      } catch (error) {
        // 验证失败，显示错误
        setFormErrors(prev => ({ ...prev, toolUrl: '请输入有效的URL' }));
        triggerShake('toolUrl');
        setUrlValidationStatus('error');
      }
    }

    // 对图标进行实时验证和可访问性检测
    if (name === 'toolIcon' && value.trim()) {
      try {
        const iconUrl = new URL(value.trim());
        // 验证是否为HTTP或HTTPS协议
        if (!iconUrl.protocol.match(/^https?:/)) {
          setFormErrors(prev => ({ ...prev, toolIcon: '请输入有效的HTTP或HTTPS链接地址' }));
          triggerShake('toolIcon');
          setIconValidationStatus('error');
        } else {
          // 先清除格式错误
          if (formErrors.toolIcon) {
            setFormErrors(prev => ({ ...prev, toolIcon: undefined }));
          }
          // 调用API验证URL可访问性
          const isAccessible = await validateUrlAvailability(value.trim(), 'icon');
          if (!isAccessible) {
            setFormErrors(prev => ({ ...prev, toolIcon: '图标地址无法访问，请检查' }));
            triggerShake('toolIcon');
          }
        }
      } catch (error) {
        // 验证失败，显示错误
        setFormErrors(prev => ({ ...prev, toolIcon: '请输入有效的链接地址' }));
        triggerShake('toolIcon');
        setIconValidationStatus('error');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 使用自定义验证
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await handleAsyncError(async () => {
        // 构建请求头
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-Device-Id': getDeviceId() || ''
        };

        // 添加认证头（如果用户已登录）
        const authHeaders = getAuthHeaders();
        Object.assign(headers, authHeaders);

        console.log('提交工具推荐:', formData);

        const response = await fetch('/api/utility/proxy/nav/recommend/submit', {
          method: 'POST',
          headers,
          body: JSON.stringify(formData)
        });

        const result = await response.json();
        console.log('工具推荐提交结果:', result);

        if (result.code === 0) {
          onShowSuccess?.('提交成功', '感谢您的推荐，我们会尽快审核您的推荐内容。');
          // 提交成功后立即关闭弹窗
          handleClose();
        } else {
          throw new Error(result.errorMsg || '提交失败，请稍后重试');
        }
      }, {
        showToast: onShowError,
        errorTitle: '提交失败'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      toolUrl: '',
      toolTitle: '',
      toolIcon: '',
      toolDescription: ''
    });
    setFormErrors({});
    setShakingFields(new Set());
    setIsSubmitting(false);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };


  // 获取设备ID
  const getDeviceId = () => {
    if (typeof window === 'undefined') return null;

    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      // 生成新的设备ID
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  };

  // 获取认证头（如果用户已登录）
  const getAuthHeaders = () => {
    if (typeof window === 'undefined') return {};

    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        if (parsed.accessToken) {
          return { 'Authorization': `Bearer ${parsed.accessToken}` };
        }
      }
    } catch (error) {
      console.warn('获取用户认证信息失败:', error);
    }

    return {};
  };

  if (!isOpen) return null;

  // 使用 Portal 将弹窗渲染到 body 层级，确保能覆盖所有内容（包括 Header）
  return typeof document !== 'undefined' ? ReactDOM.createPortal(
    <>
      <style>{shakeAnimation}</style>
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 bg-opacity-50 backdrop-blur-sm">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4 overflow-hidden relative border border-gray-200"
             style={{ boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' }}>
          {/* 头部 */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <h2 className="text-xl font-semibold text-[#00bba7]">我要推荐</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes />
            </button>
          </div>

          {/* 间隔线 */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-4"></div>

          {/* 内容 */}
          <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 网址 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  网址 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="toolUrl"
                    value={formData.toolUrl}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    placeholder="请输入推荐工具的网址，如：https://www.baoboxs.com"
                    autoComplete="off"
                    className={`w-full px-3 py-2 pr-16 border rounded-md focus:outline-none focus:ring-1 text-sm transition-all ${
                      formErrors.toolUrl
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-[#00bba7] focus:border-[#00bba7]'
                    } ${shakingFields.has('toolUrl') ? 'shake' : ''}`}
                    maxLength={500}
                  />
                  {/* 验证状态图标和清空按钮 */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {/* 验证中 - 加载图标 */}
                    {urlValidationStatus === 'validating' && (
                      <FaSpinner className="text-xs text-gray-400 animate-spin" />
                    )}
                    {/* 验证成功 - 绿色勾选图标 */}
                    {urlValidationStatus === 'success' && (
                      <FaCheckCircle className="text-xs text-green-500" />
                    )}
                    {/* 验证失败 - 红色感叹号图标 */}
                    {urlValidationStatus === 'error' && (
                      <FaExclamationCircle className="text-xs text-red-500" />
                    )}
                    {/* 清空按钮 */}
                    {formData.toolUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, toolUrl: '' }));
                          setUrlValidationStatus('idle');
                        }}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <FaTimes className="text-xs" />
                      </button>
                    )}
                  </div>
                  {formErrors.toolUrl && (
                    <div className="absolute -bottom-1.6 right-0 text-xs text-red-500 animate-pulse">
                      {formErrors.toolUrl}
                    </div>
                  )}
                </div>
              </div>

              {/* 网站标题 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  网站标题（选填）
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="toolTitle"
                    value={formData.toolTitle}
                    onChange={handleInputChange}
                    placeholder="请输入推荐工具的网站标题"
                    autoComplete="off"
                    className="w-full px-3 py-2 pr-16 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#00bba7] focus:border-[#00bba7] text-sm"
                    maxLength={30}
                  />
                  {formData.toolTitle && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, toolTitle: '' }))}
                      className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  )}
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                    {formData.toolTitle.length}/30
                  </div>
                </div>
              </div>

              {/* 网站icon地址 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  网站icon地址（选填）
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="toolIcon"
                    value={formData.toolIcon}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    placeholder="请输入推荐工具的网站icon地址"
                    autoComplete="off"
                    className={`w-full px-3 py-2 pr-16 border rounded-md focus:outline-none focus:ring-1 text-sm transition-all ${
                      formErrors.toolIcon
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-[#00bba7] focus:border-[#00bba7]'
                    } ${shakingFields.has('toolIcon') ? 'shake' : ''}`}
                    maxLength={500}
                  />
                  {/* 验证状态图标和清空按钮 */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {/* 验证中 - 加载图标 */}
                    {iconValidationStatus === 'validating' && (
                      <FaSpinner className="text-xs text-gray-400 animate-spin" />
                    )}
                    {/* 验证成功 - 绿色勾选图标 */}
                    {iconValidationStatus === 'success' && (
                      <FaCheckCircle className="text-xs text-green-500" />
                    )}
                    {/* 验证失败 - 红色感叹号图标 */}
                    {iconValidationStatus === 'error' && (
                      <FaExclamationCircle className="text-xs text-red-500" />
                    )}
                    {/* 清空按钮 */}
                    {formData.toolIcon && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, toolIcon: '' }));
                          setIconValidationStatus('idle');
                        }}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <FaTimes className="text-xs" />
                      </button>
                    )}
                  </div>
                  {formErrors.toolIcon && (
                    <div className="absolute -bottom-1.6 right-0 text-xs text-red-500 animate-pulse">
                      {formErrors.toolIcon}
                    </div>
                  )}
                </div>
              </div>

              {/* 网站描述 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  网站描述（选填）
                </label>
                <div className="relative">
                  <textarea
                    name="toolDescription"
                    value={formData.toolDescription}
                    onChange={handleInputChange}
                    placeholder="请简单描述一下推荐的工具用途和特点（不超过300字）"
                    rows={4}
                    autoComplete="off"
                    className={`w-full px-3 py-2 pr-8 border rounded-md focus:outline-none focus:ring-1 text-sm resize-none transition-all ${
                      formErrors.toolDescription
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-[#00bba7] focus:border-[#00bba7]'
                    } ${shakingFields.has('toolDescription') ? 'shake' : ''}`}
                    maxLength={300}
                  />
                  {formData.toolDescription && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, toolDescription: '' }))}
                      className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  )}
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                    {formData.toolDescription.length}/300
                  </div>
                  {formErrors.toolDescription && (
                    <div className="absolute -bottom-1.6 right-0 text-xs text-red-500 animate-pulse">
                      {formErrors.toolDescription}
                    </div>
                  )}
                </div>
              </div>

              {/* 提交按钮 */}
              <div className="flex gap-3 pt-4 w-full">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-[#e6f7f5] to-[#d9f2ef] hover:from-[#d9f2ef] hover:to-[#c7ebe7] text-[#00a593] border border-[#00bba7] rounded-lg transition-colors font-medium text-sm"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-[#00bba7] to-[#00a593] hover:from-[#00a593] hover:to-[#009080] text-white rounded-lg transition-all font-medium text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      提交中...
                    </>
                  ) : (
                    '提交推荐'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

    </>
    , document.body) : null;
};

export default SiteRecommendModal;