"use client";

import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
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

interface SiteFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolId: number;
  toolShortUrl?: string;
  onShowSuccess?: (title: string, message?: string) => void;
  onShowError?: (title: string, message?: string) => void;
  defaultFeedbackType?: string; // 预设的反馈类型，用于自动选中
}

interface SiteFeedbackFormData {
  toolId: number;
  toolShortUrl?: string;
  feedbackType: string;
  specificIssues: string[];
  description: string;
  contactInfo: string;
  pageUrl: string;
}

interface FormErrors {
  description?: string;
  pageUrl?: string;
}

const SiteFeedbackModal: React.FC<SiteFeedbackModalProps> = ({
  isOpen,
  onClose,
  toolId,
  toolShortUrl,
  onShowSuccess,
  onShowError,
  defaultFeedbackType
}) => {
  const [formData, setFormData] = useState<SiteFeedbackFormData>({
    toolId,
    toolShortUrl,
    feedbackType: '1', // 使用数字代码
    specificIssues: [],
    description: '',
    contactInfo: '',
    pageUrl: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [shakingFields, setShakingFields] = useState<Set<string>>(new Set());
  const { handleAsyncError } = useErrorHandling('站点反馈提交');

  // 弹窗滚动锁定
  useScrollLock(isOpen);

  // 弹窗打开时，自动填入当前页面地址和预设反馈类型
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      setFormData(prev => ({
        ...prev,
        pageUrl: window.location.href,
        ...(defaultFeedbackType ? { feedbackType: defaultFeedbackType } : { feedbackType: '1' })
      }));
    }
  }, [isOpen, defaultFeedbackType]);

  const feedbackTypes = [
    {
      value: '1',
      label: '网页无法访问',
      issues: [
        '页面404错误',
        '域名过期',
        '服务器无响应',
        '连接超时',
        'SSL证书问题',
        '访问权限限制'
      ]
    },
    {
      value: '2',
      label: '违法内容',
      issues: [
        '涉黄赌毒内容',
        '暴力恐怖内容',
        '政治敏感内容',
        '诈骗信息',
        '违禁品交易'
      ]
    },
    {
      value: '3',
      label: '违规内容',
      issues: [
        '虚假信息',
        '垃圾广告',
        '侵权内容',
        '恶意弹窗',
        '诱导分享',
        '收集隐私信息'
      ]
    },
    {
      value: '4',
      label: '垃圾信息',
      issues: [
        '大量广告',
        '弹窗广告',
        '诱导下载',
        '强制注册',
        '内容质量低下'
      ]
    },
    {
      value: '5',
      label: '恶意软件',
      issues: [
        '病毒木马',
        '恶意脚本',
        '强制安装软件',
        '劫持浏览器'
      ]
    },
    {
      value: '6',
      label: '钓鱼网站',
      issues: [
        '仿冒官方网站',
        '窃取账号密码',
        '虚假支付页面'
      ]
    },
    {
      value: '7',
      label: '版权问题',
      issues: [
        '侵犯软件版权',
        '盗版影视内容',
        '音乐侵权',
        '文字作品侵权'
      ]
    },
    {
      value: '9',
      label: '内容纠错',
      issues: [
        '描述不准确',
        '内容过时',
        '信息错误',
        '翻译问题',
        '格式问题'
      ]
    },
    {
      value: '8',
      label: '其他问题',
      issues: []
    }
  ];

  const currentFeedbackType = feedbackTypes.find(type => type.value === formData.feedbackType);

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

  // 表单验证
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.description.trim()) {
      errors.description = '请填写详细描述';
      triggerShake('description');
    }

    // 页面地址验证（如果填写了，必须是有效URL）
    if (formData.pageUrl.trim()) {
      try {
        new URL(formData.pageUrl.trim());
      } catch (error) {
        errors.pageUrl = '请输入有效的URL';
        triggerShake('pageUrl');
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // 清空具体问题列表
    if (name === 'feedbackType') {
      setFormData(prev => ({ ...prev, specificIssues: [] }));
    }

    // 清除该字段的错误状态
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // 只对页面地址进行实时验证
    if (name === 'pageUrl' && value.trim()) {
      try {
        new URL(value.trim());
        // 验证通过，清除错误
        if (formErrors.pageUrl) {
          setFormErrors(prev => ({ ...prev, pageUrl: undefined }));
        }
      } catch (error) {
        // 验证失败，显示错误
        setFormErrors(prev => ({ ...prev, pageUrl: '请输入有效的URL' }));
        triggerShake('pageUrl');
      }
    }
  };

  const handleIssueToggle = (issue: string) => {
    setFormData(prev => ({
      ...prev,
      specificIssues: prev.specificIssues.includes(issue)
        ? prev.specificIssues.filter(i => i !== issue)
        : [...prev.specificIssues, issue]
    }));
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

        console.log('提交站点反馈:', formData);

        const response = await fetch('/api/utility/proxy/feedback/site/submit', {
          method: 'POST',
          headers,
          body: JSON.stringify(formData)
        });

        const result = await response.json();
        console.log('站点反馈提交结果:', result);

        if (result.code === 0) {
          onShowSuccess?.('提交成功', '感谢您的反馈，我们会及时处理相关问题。');
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
      toolId,
      toolShortUrl,
      feedbackType: defaultFeedbackType || '1',
      specificIssues: [],
      description: '',
      contactInfo: '',
      pageUrl: ''
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

  return (
    <>
      <style>{shakeAnimation}</style>
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 bg-opacity-50 backdrop-blur-sm">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4 overflow-hidden relative border border-gray-200"
             style={{ boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' }}>
          {/* 头部 */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <h2 className="text-xl font-semibold text-[#2a8a84]">站点反馈</h2>
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
              {/* 反馈类型和具体问题 - 同行布局 */}
              <div className="flex gap-6">
                {/* 反馈类型 */}
                <div className="flex-shrink-0 w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    反馈类型 <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="feedbackType"
                    value={formData.feedbackType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#00bba7] focus:border-[#00bba7] text-sm"
                    required
                  >
                    {feedbackTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 具体问题 */}
                {currentFeedbackType && currentFeedbackType.issues.length > 0 && (
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      具体问题（可多选）
                    </label>
                    <div className="flex flex-wrap gap-2 h-12 overflow-hidden items-center p-1">
                      {currentFeedbackType.issues.slice(0, 6).map(issue => (
                        <label
                          key={issue}
                          className="flex items-center space-x-1.5 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={formData.specificIssues.includes(issue)}
                            onChange={() => handleIssueToggle(issue)}
                            className="w-3.5 h-3.5 text-[#00bba7] border-gray-300 rounded focus:ring-1 focus:ring-[#00bba7] accent-[#00bba7]"
                          />
                          <span className="text-xs text-gray-700 group-hover:text-gray-900 whitespace-nowrap">{issue}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 详细描述 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  详细描述 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="请详细描述您遇到的问题..."
                    rows={3}
                    className={`w-full px-3 py-2 pr-8 border rounded-md focus:outline-none focus:ring-1 text-sm resize-none transition-all ${
                      formErrors.description
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-[#00bba7] focus:border-[#00bba7]'
                    } ${shakingFields.has('description') ? 'shake' : ''}`}
                    maxLength={2000}
                  />
                  {/* 清空按钮 */}
                  {formData.description && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, description: '' }))}
                      className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  )}
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                    {formData.description.length}/2000
                  </div>
                  {formErrors.description && (
                    <div className="absolute -bottom-1.6 right-0 text-xs text-red-500 animate-pulse">
                      {formErrors.description}
                    </div>
                  )}
                </div>
              </div>

              {/* 页面地址 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  问题页面地址（可选）
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="pageUrl"
                    value={formData.pageUrl}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    placeholder="请输入具体的问题页面地址，如：https://example.com/problem-page"
                    className={`w-full px-3 py-2 pr-8 border rounded-md focus:outline-none focus:ring-1 text-sm transition-all ${
                      formErrors.pageUrl
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-[#00bba7] focus:border-[#00bba7]'
                    } ${shakingFields.has('pageUrl') ? 'shake' : ''}`}
                    maxLength={500}
                  />
                  {formData.pageUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, pageUrl: '' }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  )}
                  {formErrors.pageUrl && (
                    <div className="absolute -bottom-1.6 right-0 text-xs text-red-500 animate-pulse">
                      {formErrors.pageUrl}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  帮助我们定位具体的问题页面（可选填）
                </p>
              </div>

              {/* 联系方式 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  联系方式（可选）
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="contactInfo"
                    value={formData.contactInfo}
                    onChange={handleInputChange}
                    placeholder="请留下您的邮箱或微信号，必要时方便我们联系您"
                    className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#00bba7] focus:border-[#00bba7] text-sm"
                    maxLength={100}
                  />
                  {formData.contactInfo && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, contactInfo: '' }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <FaTimes className="text-xs" />
                    </button>
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
                    '提交反馈'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

    </>
  );
};

export default SiteFeedbackModal;