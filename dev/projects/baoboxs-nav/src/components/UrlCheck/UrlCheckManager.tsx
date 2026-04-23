'use client';

import React, { useState, useEffect } from 'react';
import { FiShield, FiPlus, FiSearch, FiEdit3, FiTrash2, FiPause, FiPlay, FiRefreshCw, FiCheck, FiX, FiClock, FiAlertTriangle, FiBell } from 'react-icons/fi';
import { getUrlCheckList, addUrlCheck, updateUrlCheck, deleteUrlCheck } from '@/services/urlCheckApi';
import Loading from '@/components/ui/Loading';

interface UrlCheckItem {
  checkId: number;
  originalUrl: string;
  normalizedUrl: string;
  checkIntervalMinutes: number;
  isActive: boolean;
  nextCheckTime: string;
  tencentStatus: number;
  tencentLastCheckTime?: string;
  wechatStatus: number;
  wechatLastCheckTime?: string;
  notificationStatus: number;
  lastNotifyTime?: string;
  tencentCheckEnabled: boolean;
  wechatCheckEnabled: boolean;
  createTime: string;
  updateTime: string;
}

// 状态值映射
const getStatusInfo = (status: number, type: 'tencent' | 'wechat' | 'notification') => {
  if (type === 'notification') {
    switch (status) {
      case 0:
        return { color: 'bg-gray-500', text: '无需通知' };
      case 1:
        return { color: 'bg-yellow-500', text: '待发送' };
      case 2:
        return { color: 'bg-green-500', text: '已发送' };
      case 3:
        return { color: 'bg-red-500', text: '发送失败' };
      default:
        return { color: 'bg-gray-500', text: '未知状态' };
    }
  } else {
    switch (status) {
      case 0:
        return { color: 'bg-gray-500', text: '未知' };
      case 1:
        return { color: 'bg-green-500', text: '安全' };
      case 2:
        return { color: 'bg-red-500', text: '被拦截' };
      case 3:
        return { color: 'bg-yellow-500', text: '检测错误' };
      default:
        return { color: 'bg-gray-500', text: '未知状态' };
    }
  }
};

export const UrlCheckManager: React.FC = () => {
  const [items, setItems] = useState<UrlCheckItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // 分页和筛选
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [filteredItems, setFilteredItems] = useState<UrlCheckItem[]>([]);
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);

  // 表单状态
  const [formUrl, setFormUrl] = useState('');
  const [formInterval, setFormInterval] = useState(1440); // 默认24小时
  const [formActive, setFormActive] = useState(true);
  const [formTencentEnabled, setFormTencentEnabled] = useState(true);
  const [formWechatEnabled, setFormWechatEnabled] = useState(true);

  // 加载检测列表
  const loadUrlChecks = async (page: number) => {
    try {
      setLoading(true);
      const response = await getUrlCheckList(activeFilter, searchKeyword, page, 10);
      
      if (response.code === 0 && response.data) {
        const transformedItems = response.data.items.map((item: any) => ({
          ...item,
          tencentStatus: Number(item.tencentStatus || 0),
          wechatStatus: Number(item.wechatStatus || 0),
          notificationStatus: Number(item.notificationStatus || 0)
        })) as UrlCheckItem[];
        
        setItems(transformedItems);
        setTotal(response.data.total || 0);
        setCurrentPage(page);
      } else {
        setError(response.errorMsg || '加载失败');
      }
    } catch (error) {
      console.error('加载URL检测列表失败:', error);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 前端搜索和筛选
  useEffect(() => {
    let filtered = items;
    
    // 状态筛选
    if (activeFilter !== undefined) {
      filtered = filtered.filter(item => item.isActive === activeFilter);
    }
    
    // 搜索筛选
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(item => 
        item.originalUrl.toLowerCase().includes(keyword) ||
        item.normalizedUrl.toLowerCase().includes(keyword)
      );
    }
    
    setFilteredItems(filtered);
  }, [items, activeFilter, searchKeyword]);

  // 处理搜索输入延时
  const handleSearchChange = (value: string) => {
    if (searchTimer) {
      clearTimeout(searchTimer);
    }
    
    const timer = setTimeout(() => {
      setSearchKeyword(value);
    }, 300); // 300ms延时
    
    setSearchTimer(timer);
  };

  useEffect(() => {
    loadUrlChecks(1);
  }, [activeFilter]);

  useEffect(() => {
    return () => {
      if (searchTimer) {
        clearTimeout(searchTimer);
      }
    };
  }, [searchTimer]);

  // 清除消息
  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  // 重置表单
  const resetForm = () => {
    setFormUrl('');
    setFormInterval(1440);
    setFormActive(true);
    setFormTencentEnabled(true);
    setFormWechatEnabled(true);
    setEditingId(null);
    setShowAddForm(false);
  };

  // 添加URL检测
  const handleAdd = async () => {
    if (!formUrl.trim()) {
      setError('请输入URL地址');
      return;
    }

    // 验证至少启用一个检测方式
    if (!formTencentEnabled && !formWechatEnabled) {
      setError('至少需要启用一种检测方式');
      return;
    }

    try {
      clearMessages();
      const response = await addUrlCheck(formUrl, formInterval, formActive, formTencentEnabled, formWechatEnabled);
      
      if (response.code === 0) {
        setSuccess('URL检测添加成功');
        resetForm();
        loadUrlChecks(currentPage);
      } else {
        setError(response.errorMsg || '添加失败');
      }
    } catch (error) {
      console.error('添加URL检测失败:', error);
      setError('网络错误，请稍后重试');
    }
  };

  // 编辑URL检测
  const handleEdit = (item: UrlCheckItem) => {
    setEditingId(item.checkId);
    setFormUrl(item.originalUrl);
    setFormInterval(item.checkIntervalMinutes);
    setFormActive(item.isActive);
    setFormTencentEnabled(item.tencentCheckEnabled);
    setFormWechatEnabled(item.wechatCheckEnabled);
    setShowAddForm(true);
  };

  // 更新URL检测
  const handleUpdate = async () => {
    if (!editingId) return;

    // 验证至少启用一个检测方式
    if (!formTencentEnabled && !formWechatEnabled) {
      setError('至少需要启用一种检测方式');
      return;
    }

    try {
      clearMessages();
      const response = await updateUrlCheck(editingId, formInterval, formActive, formTencentEnabled, formWechatEnabled);
      
      if (response.code === 0) {
        setSuccess('URL检测更新成功');
        resetForm();
        loadUrlChecks(currentPage);
      } else {
        setError(response.errorMsg || '更新失败');
      }
    } catch (error) {
      console.error('更新URL检测失败:', error);
      setError('网络错误，请稍后重试');
    }
  };

  // 删除URL检测
  const handleDelete = async (checkId: number) => {
    if (!confirm('确定要删除这个URL检测吗？')) {
      return;
    }

    try {
      clearMessages();
      const response = await deleteUrlCheck(checkId);
      
      if (response.code === 0) {
        setSuccess('URL检测删除成功');
        loadUrlChecks(currentPage);
      } else {
        setError(response.errorMsg || '删除失败');
      }
    } catch (error) {
      console.error('删除URL检测失败:', error);
      setError('网络错误，请稍后重试');
    }
  };

  // 切换激活状态
  const toggleActive = async (item: UrlCheckItem) => {
    try {
      clearMessages();
      const response = await updateUrlCheck(item.checkId, undefined, !item.isActive);
      
      if (response.code === 0) {
        setSuccess(`URL检测${!item.isActive ? '启用' : '暂停'}成功`);
        loadUrlChecks(currentPage);
      } else {
        setError(response.errorMsg || '操作失败');
      }
    } catch (error) {
      console.error('切换状态失败:', error);
      setError('网络错误，请稍后重试');
    }
  };

  const getStatusIcon = (status?: number) => {
    if (status === undefined) return <FiClock className="w-4 h-4 text-gray-500" />;
    
    switch (status) {
      case 1: return <FiCheck className="w-4 h-4 text-green-500" />;
      case 0: return <FiX className="w-4 h-4 text-red-500" />;
      default: return <FiAlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status?: number) => {
    if (status === undefined) return 'text-gray-600 bg-gray-50';
    
    switch (status) {
      case 1: return 'text-green-600 bg-green-50';
      case 0: return 'text-red-600 bg-red-50';
      default: return 'text-yellow-600 bg-yellow-50';
    }
  };

  // 格式化相对时间
  const formatRelativeTime = (timeString: string) => {
    const time = new Date(timeString);
    const now = new Date();
    const diffMs = time.getTime() - now.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    
    if (Math.abs(diffMinutes) < 60) {
      if (diffMinutes > 0) return `${diffMinutes}分钟后`;
      return `${Math.abs(diffMinutes)}分钟前`;
    } else if (Math.abs(diffHours) < 24) {
      if (diffHours > 0) return `${diffHours}小时后`;
      return `${Math.abs(diffHours)}小时前`;
    } else if (Math.abs(diffDays) < 7) {
      if (diffDays > 0) return `${diffDays}天后`;
      return `${Math.abs(diffDays)}天前`;
    } else {
      return time.toLocaleString('zh-CN', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const intervalOptions = [
    { value: 10, label: '10分钟' },
    { value: 30, label: '30分钟' },
    { value: 60, label: '1小时' },
    { value: 180, label: '3小时' },
    { value: 360, label: '6小时' },
    { value: 720, label: '12小时' },
    { value: 1440, label: '24小时' },
    { value: 10087, label: '7天' },
  ];

  if (loading && items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <Loading 
            title="正在加载检测管理数据" 
            subtitle="获取您的URL检测任务列表..." 
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
            <FiShield className="w-6 h-6 text-teal-600" />
            <h2 className="text-xl font-semibold text-gray-900">URL检测管理</h2>
            <span className="text-sm text-gray-500">({filteredItems.length} / {total} 条记录)</span>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-teal-500 text-white font-medium rounded-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 flex items-center gap-2"
          >
            <FiPlus className="w-4 h-4" />
            <span className="hidden sm:inline">添加检测</span>
          </button>
        </div>

        {/* 搜索和筛选 */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索URL..."
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={activeFilter === undefined ? 'all' : activeFilter ? 'active' : 'inactive'}
              onChange={(e) => {
                const value = e.target.value;
                setActiveFilter(value === 'all' ? undefined : value === 'active');
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">全部状态</option>
              <option value="active">启用中</option>
              <option value="inactive">已暂停</option>
            </select>
            <button
              onClick={() => loadUrlChecks(currentPage)}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              title="刷新"
            >
              <FiRefreshCw className="w-4 h-4" />
            </button>
          </div>
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
              {editingId ? '编辑URL检测' : '添加URL检测'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL地址
                </label>
                <input
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="请输入要检测的URL"
                  disabled={!!editingId} // 编辑时不允许修改URL
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  检测间隔
                </label>
                <select
                  value={formInterval}
                  onChange={(e) => setFormInterval(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {intervalOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm font-medium text-gray-700">启用检测</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  检测通道
                </label>
                <div className="space-y-3">
                  {/* 横向排列的检测开关 */}
                  <div className="flex flex-wrap gap-6 ml-5">
                    <div className="flex items-center">
                      <input
                        id="tencent-check"
                        type="checkbox"
                        checked={formTencentEnabled}
                        onChange={(e) => setFormTencentEnabled(e.target.checked)}
                        className="form-checkbox h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded cursor-pointer transition-colors duration-200"
                      />
                      <label htmlFor="tencent-check" className="ml-2 text-sm font-medium text-gray-700 cursor-pointer">
                        启用腾讯安全检测
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="wechat-check"
                        type="checkbox"
                        checked={formWechatEnabled}
                        onChange={(e) => setFormWechatEnabled(e.target.checked)}
                        className="form-checkbox h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded cursor-pointer transition-colors duration-200"
                      />
                      <label htmlFor="wechat-check" className="ml-2 text-sm font-medium text-gray-700 cursor-pointer">
                        启用微信安全检测
                      </label>
                    </div>
                  </div>
                  
                  {/* 说明文字 */}
                  <p className="text-xs text-gray-500">
                    至少需要启用一种检测方式。关闭的通道将不会执行检测，也不会发送相关通知。
                  </p>
                  
                  {/* 警告提示 */}
                  {!formTencentEnabled && !formWechatEnabled && (
                    <div className="flex items-center gap-1 text-red-600 text-xs bg-red-50 p-2 rounded">
                      <FiAlertTriangle className="w-3 h-3 flex-shrink-0" />
                      <span>至少需要启用一种检测方式</span>
                    </div>
                  )}
                </div>
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

        {/* URL检测列表 */}
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8">
              {items.length === 0 ? (
                <>
                  <FiShield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">暂无URL检测</h3>
                  <p className="text-gray-600 mb-4">
                    添加URL到检测列表后，系统会定时检测其可用性
                  </p>
                                <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-teal-500 text-white font-medium rounded-md hover:bg-teal-600"
              >
                    添加第一个URL
                  </button>
                </>
              ) : (
                <>
                  <FiSearch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">无匹配结果</h3>
                  <p className="text-gray-600 mb-4">
                    没有找到符合搜索条件的URL检测记录
                  </p>
                  <button
                    onClick={() => handleSearchChange('')}
                    className="px-4 py-2 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700"
                  >
                    清除搜索
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              {filteredItems.map((item) => (
                <div key={item.checkId} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex flex-wrap gap-4">
                    {/* URL和基本信息 */}
                    <div className="flex-1 min-w-[300px]">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900 truncate">
                          {item.originalUrl}
                        </h4>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          item.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'
                        }`}>
                          {item.isActive ? '运行中' : '已暂停'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        标准化URL: {item.normalizedUrl}
                      </p>
                    </div>

                    {/* 检测状态 */}
                    <div className="flex flex-wrap gap-4 items-center">
                      {/* 腾讯安全检测状态 */}
                      <div className="min-w-[120px]">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-sm font-medium text-gray-700">腾讯安全</span>
                          <span className={`px-1 py-0.5 text-xs rounded ${
                            item.tencentCheckEnabled 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {item.tencentCheckEnabled ? '开启' : '关闭'}
                          </span>
                        </div>
                        {item.tencentCheckEnabled ? (
                          <div className="flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${getStatusInfo(item.tencentStatus, 'tencent').color}`}></span>
                            <span className="text-sm text-gray-600">{getStatusInfo(item.tencentStatus, 'tencent').text}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                            <span className="text-sm text-gray-500">已关闭</span>
                          </div>
                        )}
                        {item.tencentCheckEnabled && item.tencentLastCheckTime && (
                          <div className="text-xs text-gray-500 mt-1">
                            检测时间: {new Date(item.tencentLastCheckTime).toLocaleString()}
                          </div>
                        )}
                      </div>

                      {/* 微信安全检测状态 */}
                      <div className="min-w-[120px]">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-sm font-medium text-gray-700">微信安全</span>
                          <span className={`px-1 py-0.5 text-xs rounded ${
                            item.wechatCheckEnabled 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {item.wechatCheckEnabled ? '开启' : '关闭'}
                          </span>
                        </div>
                        {item.wechatCheckEnabled ? (
                          <div className="flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${getStatusInfo(item.wechatStatus, 'wechat').color}`}></span>
                            <span className="text-sm text-gray-600">{getStatusInfo(item.wechatStatus, 'wechat').text}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                            <span className="text-sm text-gray-500">已关闭</span>
                          </div>
                        )}
                        {item.wechatCheckEnabled && item.wechatLastCheckTime && (
                          <div className="text-xs text-gray-500 mt-1">
                            检测时间: {new Date(item.wechatLastCheckTime).toLocaleString()}
                          </div>
                        )}
                      </div>

                      {/* 时间和通知信息 */}
                      <div className="min-w-[200px]">
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center gap-1 mb-1">
                            <FiRefreshCw className="w-3 h-3" />
                            <span>下次检测: {new Date(item.nextCheckTime).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FiBell className="w-3 h-3" />
                            <div className="flex items-center gap-1">
                              <span className={`w-2 h-2 rounded-full ${getStatusInfo(item.notificationStatus, 'notification').color}`}></span>
                              <span>{getStatusInfo(item.notificationStatus, 'notification').text}</span>
                            </div>
                          </div>
                          {item.lastNotifyTime && (
                            <div className="flex items-center gap-1">
                              <FiClock className="w-3 h-3" />
                              <span>通知时间: {new Date(item.lastNotifyTime).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleActive(item)}
                          className={`p-2 rounded-md transition-colors ${
                            item.isActive
                              ? 'text-yellow-600 hover:bg-yellow-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={item.isActive ? '暂停检测' : '恢复检测'}
                        >
                          {item.isActive ? <FiPause className="w-4 h-4" /> : <FiPlay className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors"
                          title="编辑"
                        >
                          <FiEdit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.checkId)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="删除"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* 分页和状态信息 */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  显示 {filteredItems.length} / {total} 条记录
                  {searchKeyword && <span className="text-teal-600">（搜索结果）</span>}
                </div>
                {totalPages > 1 && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadUrlChecks(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      上一页
                    </button>
                    <span className="px-3 py-2 text-sm text-gray-600">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => loadUrlChecks(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      下一页
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* 说明信息 */}
        <div className="mt-6 p-4 bg-teal-50 rounded-lg">
          <h4 className="font-medium text-teal-900 mb-2">使用说明</h4>
          <ul className="text-sm text-teal-800 space-y-1">
            <li>• 添加URL后，系统会按设定的间隔自动检测其可用性</li>
            <li>• 检测基于腾讯安全和微信平台，可单独控制每个检测通道的开关</li>
            <li>• 关闭的检测通道不会执行检测，也不会发送相关通知</li>
            <li>• 至少需要启用一种检测方式，系统会在发现拦截时发送通知</li>
            <li>• 可以随时暂停或恢复某个URL的检测，也可以修改检测通道设置</li>
            <li>• 需要绑定爱语飞飞Token且具有VIP权限才能使用此功能</li>
            <li>• 建议检测间隔不要设置得过短，以免对API造成压力</li>
          </ul>
        </div>
      </div>
    </div>
  );
}; 