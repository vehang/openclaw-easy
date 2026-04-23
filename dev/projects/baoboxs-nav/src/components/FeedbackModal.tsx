"use client";

import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import SuccessModal from './SuccessModal';
import { useScrollLock } from '@/hooks/useScrollLock';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FeedbackFormData {
  feedbackType: string;
  title: string;
  content: string;
  contactInfo: string;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<FeedbackFormData>({
    feedbackType: 'SUGGESTION',
    title: '',
    content: '',
    contactInfo: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // 弹窗滚动锁定
  useScrollLock(isOpen);

  const feedbackTypes = [
    { value: 'SUGGESTION', label: '建议与意见' },
    { value: 'BUG', label: 'Bug反馈' },
    { value: 'FEATURE', label: '功能需求' },
    { value: 'TOOL_RECOMMEND', label: '工具推荐' },
    { value: 'OTHER', label: '其他' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      setSubmitError('请填写标题和内容');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      // 构建请求头
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Device-Id': getDeviceId() || ''
      };

      // 添加认证头（如果用户已登录）
      const authHeaders = getAuthHeaders();
      Object.assign(headers, authHeaders);

      const response = await fetch('/api/utility/proxy/feedback/submit', {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.code === 0) {
        setSubmitSuccess(true);
      } else {
        setSubmitError(result.errorMsg || '提交失败，请稍后重试');
      }
    } catch (error) {
      console.error('反馈提交失败:', error);
      setSubmitError('网络错误，请检查网络连接后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      feedbackType: 'SUGGESTION',
      title: '',
      content: '',
      contactInfo: ''
    });
    setSubmitSuccess(false);
    setSubmitError('');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const handleSuccessClose = () => {
    setSubmitSuccess(false);
    onClose();
    resetForm();
  };

  // 获取设备ID
  const getDeviceId = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('deviceId');
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
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 bg-opacity-50 backdrop-blur-sm">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4 overflow-hidden relative border border-gray-200"
             style={{ boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' }}>
          {/* 头部 */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <h2 className="text-xl font-semibold text-[#00bba7]">意见反馈</h2>
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
              {/* 反馈类型 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  反馈类型 <span className="text-red-500">*</span>
                </label>
                <select
                  name="feedbackType"
                  value={formData.feedbackType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#00bba7] focus:border-[#00bba7] text-sm transition-all"
                  required
                  autoComplete="off"
                >
                  {feedbackTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 标题 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  标题 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="请简要描述您的意见或问题"
                    className="w-full px-3 py-2 pr-16 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#00bba7] focus:border-[#00bba7] text-sm transition-all"
                    required
                    maxLength={200}
                    autoComplete="off"
                  />
                  {formData.title && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, title: '' }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  )}
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                    {formData.title.length}/200
                  </div>
                </div>
              </div>

              {/* 内容 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  详细描述 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder="请详细描述您的意见、建议或遇到的问题..."
                    rows={6}
                    className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#00bba7] focus:border-[#00bba7] text-sm resize-none transition-all"
                    required
                    maxLength={2000}
                    autoComplete="off"
                  />
                  {formData.content && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, content: '' }))}
                      className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  )}
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                    {formData.content.length}/2000
                  </div>
                </div>
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
                    placeholder="如需回复，请留下邮箱或微信号"
                    className="w-full px-3 py-2 pr-16 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#00bba7] focus:border-[#00bba7] text-sm transition-all"
                    maxLength={100}
                    autoComplete="off"
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

              {/* 错误信息 */}
              {submitError && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-100">
                  {submitError}
                </div>
              )}

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

      {/* 成功提示弹窗 */}
      <SuccessModal
        isOpen={submitSuccess}
        title="提交成功！"
        message="感谢您的宝贵意见，我们会认真考虑您的建议。"
        icon="paper-plane"
        autoClose={true}
        autoCloseDelay={2000}
        onClose={handleSuccessClose}
      />
    </>
  );
};

export default FeedbackModal; 