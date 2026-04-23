'use client';

import React, { useState, useEffect } from 'react';
import { FiSettings, FiCheck, FiEdit3, FiTrash2, FiPlus, FiEye, FiEyeOff, FiAlertTriangle } from 'react-icons/fi';
import { bindUserInfo, getUserBindingList, updateUserBinding, deleteUserBinding } from '@/services/urlCheckApi';
import Loading from '@/components/ui/Loading';

interface TokenBinding {
  bindId: number;
  bindType: number;
  bindTypeDescription: string;
  bindStatus: number;
  statusDescription: string;
  bindName?: string;
  maskedValue: string;
  createTime: string;
  updateTime: string;
  verifiedTime?: string;
  success: boolean;
  message: string;
  extInfo?: string;
}

export const TokenBinding: React.FC = () => {
  const [bindings, setBindings] = useState<TokenBinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 表单状态
  const [tokenValue, setTokenValue] = useState('');
  const [tokenName, setTokenName] = useState('');
  const [remark, setRemark] = useState('');
  const [showToken, setShowToken] = useState(false);

  // 加载绑定列表
  const loadBindings = async () => {
    try {
      setLoading(true);
      const response = await getUserBindingList(4); // 4 = 爱语飞飞Token
      
      if (response.code === 0 && response.data) {
        setBindings(response.data);
      } else {
        setError(response.errorMsg || '加载失败');
      }
    } catch (error) {
      console.error('加载Token绑定列表失败:', error);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBindings();
  }, []);

  // 清除消息
  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  // 重置表单
  const resetForm = () => {
    setTokenValue('');
    setTokenName('');
    setRemark('');
    setShowToken(false);
    setEditingId(null);
    setShowAddForm(false);
  };

  // 添加Token
  const handleAdd = async () => {
    if (!tokenValue.trim()) {
      setError('请输入Token值');
      return;
    }

    if (tokenValue.length < 10) {
      setError('Token长度至少需要10个字符');
      return;
    }

    // 检查是否已有绑定
    if (bindings.length > 0) {
      setError('每个账户只能绑定一个爱语飞飞Token，请先删除现有Token');
      return;
    }

    try {
      clearMessages();
      const response = await bindUserInfo(4, tokenValue, tokenName, remark);
      
      if (response.code === 0) {
        setSuccess('Token绑定成功');
        resetForm();
        loadBindings();
      } else {
        setError(response.errorMsg || '绑定失败');
      }
    } catch (error) {
      console.error('Token绑定失败:', error);
      setError('网络错误，请稍后重试');
    }
  };

  // 编辑Token
  const handleEdit = (binding: TokenBinding) => {
    setEditingId(binding.bindId);
    setTokenName(binding.bindName || '');
    setRemark(binding.extInfo || '');
    setTokenValue(''); // 不显示原Token值
    setShowAddForm(true);
  };

  // 更新Token
  const handleUpdate = async () => {
    if (!editingId) return;

    try {
      clearMessages();
      const response = await updateUserBinding(
        editingId,
        tokenValue || undefined, // 只有输入了新值才更新
        tokenName,
        remark
      );
      
      if (response.code === 0) {
        setSuccess('Token更新成功');
        resetForm();
        loadBindings();
      } else {
        setError(response.errorMsg || '更新失败');
      }
    } catch (error) {
      console.error('Token更新失败:', error);
      setError('网络错误，请稍后重试');
    }
  };

  // 删除Token
  const handleDelete = async (bindId: number) => {
    if (!confirm('确定要删除这个Token绑定吗？删除后将无法使用定时检测功能。')) {
      return;
    }

    try {
      clearMessages();
      const response = await deleteUserBinding(bindId);
      
      if (response.code === 0) {
        setSuccess('Token删除成功');
        loadBindings();
      } else {
        setError(response.errorMsg || '删除失败');
      }
    } catch (error) {
      console.error('Token删除失败:', error);
      setError('网络错误，请稍后重试');
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: return 'text-green-600 bg-green-50';
      case 0: return 'text-yellow-600 bg-yellow-50';
      case 2: return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <Loading 
            title="正在加载Token绑定数据" 
            subtitle="获取您的Token绑定信息..." 
            variant="complex"
            size="md"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FiSettings className="w-6 h-6 text-teal-600" />
            <h2 className="text-xl font-semibold text-gray-900">爱语飞飞Token管理</h2>
          </div>
          {bindings.length === 0 && (
            <>
              <a
                href="https://iyuu.cn/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 text-sm text-teal-600 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-md font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                获取Token
              </a>
            </>
          )}
        </div>

        {/* 错误和成功消息 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2">
              <FiAlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center gap-2">
              <FiCheck className="w-5 h-5 text-green-500" />
              <span className="text-green-700 text-sm">{success}</span>
            </div>
          </div>
        )}

        {/* 添加/编辑表单 */}
        {showAddForm && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingId ? '编辑Token' : '添加新Token'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token值 {editingId && <span className="text-gray-500">(留空则不修改)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={tokenValue}
                    onChange={(e) => setTokenValue(e.target.value)}
                    placeholder="请输入爱语飞飞Token"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showToken ? (
                      <FiEyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <FiEye className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token名称（可选）
                </label>
                <input
                  type="text"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  placeholder="为这个Token起个名字，便于识别"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  备注（可选）
                </label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="添加一些备注信息"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={editingId ? handleUpdate : handleAdd}
                  className="px-4 py-2 bg-teal-500 text-white font-medium rounded-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                >
                  {editingId ? '更新' : '保存'}
                </button>
                <button
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Token列表 */}
        <div className="space-y-4">
          {bindings.length === 0 ? (
            <div className="text-center py-8">
              <FiSettings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无Token绑定</h3>
              <p className="text-gray-600 mb-4">
                添加爱语飞飞Token后，即可使用定时URL检测功能
                <a
                  href="https://iyuu.cn/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-teal-600 hover:text-teal-800 underline"
                >
                  获取Token
                </a>
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-teal-500 text-white font-medium rounded-md hover:bg-teal-600"
              >
                绑定Token
              </button>
            </div>
          ) : (
            bindings.map((binding) => (
              <div key={binding.bindId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-gray-900">
                        {binding.bindName || '未命名Token'}
                      </h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(binding.bindStatus)}`}>
                        {binding.statusDescription}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Token: {binding.maskedValue}
                    </p>
                    <p className="text-sm text-gray-500">
                      创建时间: {new Date(binding.createTime).toLocaleString()}
                    </p>
                    {binding.extInfo && (
                      <p className="text-sm text-gray-600 mt-2">
                        备注: {binding.extInfo}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(binding)}
                      className="p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors"
                      title="编辑"
                    >
                      <FiEdit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(binding.bindId)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="删除"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 说明信息 */}
        <div className="mt-6 p-4 bg-teal-50 rounded-lg">
          <h4 className="font-medium text-teal-900 mb-2">关于爱语飞飞Token</h4>
          <ul className="text-sm text-teal-800 space-y-1">
            <li>• 爱语飞飞Token用于通知检测结果</li>
            <li>• 此页面，爱语飞飞Token仅用于通知使用</li>
            <li>• token仅支持一个，如变更请及时更换</li>
            <li>• 绑定Token后可以使用定时检测和批量检测功能</li>
            <li>• Token信息会被安全加密存储，仅显示脱敏后的部分内容</li>
          </ul>
        </div>
      </div>
    </div>
  );
}; 