'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '@/components/Layout';
import { fetchUserCollections, fetchUserGroups, addGroup, editGroup, deleteGroup, editCollection, deleteCollection, sortCollections, sortGroups, isLoggedIn } from '@/services/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LoginModal from '@/components/LoginModal';
import EditCollectionModal from '@/components/EditCollectionModal';
import ConfirmModal from '@/components/ConfirmModal';
import ToastContainer from '@/components/ui/ToastContainer';
import Loading from '@/components/ui/Loading';
import OverlayLoading from '@/components/ui/OverlayLoading';
import { useToast } from '@/hooks/useToast';
import { CollectionCard, GroupTabBar, GroupModal } from './components';
import { GroupItem, CollectionItem } from './types';

export default function FavoritesPage() {
  const router = useRouter();
  const { toasts, showSuccess, showError, removeToast } = useToast();

  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loginIn, setLoginIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);

  // 分组相关状态
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [groupsLoading, setGroupsLoading] = useState(false);

  // 分组文本显示控制状态
  const [showGroupText, setShowGroupText] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem('favorites.groupTab.showText');
        if (saved !== null) {
          return saved === '1' || saved === 'true';
        }
        const isMobileViewport = (window.matchMedia && window.matchMedia('(max-width: 640px)').matches) || window.innerWidth <= 640;
        return !isMobileViewport;
      } catch (_) {
        return true;
      }
    }
    return true;
  });
  const GROUP_TEXT_STORAGE_KEY = 'favorites.groupTab.showText';

  // 分组管理相关状态
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupItem | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<GroupItem | null>(null);
  const [groupModalType, setGroupModalType] = useState<'add' | 'edit'>('add');

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [userManuallyClosedLogin, setUserManuallyClosedLogin] = useState(false);

  // 编辑模式相关状态
  const [isEditMode, setIsEditMode] = useState(false);
  const [isGroupEditMode, setIsGroupEditMode] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<CollectionItem | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // 确认删除弹窗状态
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deletingCollection, setDeletingCollection] = useState<CollectionItem | null>(null);

  // 排序相关状态
  const [sortLoading, setSortLoading] = useState(false);

  // 操作loading状态
  const [operationLoading, setOperationLoading] = useState(false);
  const [operationType, setOperationType] = useState<'edit' | 'delete' | 'sort' | null>(null);

  // 处理跳转到微信收藏教程页面
  const handleStartAddFavorites = () => {
    if (typeof window !== 'undefined') {
      window.open('/favorites/wechat-collection', '_blank', 'noopener,noreferrer');
    } else {
      router.push('/favorites/wechat-collection');
    }
  };

  // 处理分组编辑切换
  const handleGroupEditToggle = () => {
    const newEditMode = !isGroupEditMode;
    setIsGroupEditMode(newEditMode);

    if (newEditMode && !showGroupText) {
      setShowGroupText(true);
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('favorites.groupTab.showText', '1');
        }
      } catch (e) {
        // ignore storage errors
      }
    }
  };

  // 加载分组列表
  const loadGroups = useCallback(async () => {
    try {
      setGroupsLoading(true);
      const response = await fetchUserGroups();

      if (response.code === 0) {
        setGroups(response.data || []);
      } else if (response.code === 9996) {
        throw { code: 9996, message: '登录已过期' };
      } else {
        console.error('获取分组失败:', response.errorMsg);
      }
    } catch (error: any) {
      console.error('加载分组失败:', error);
      if (error.code !== 9996) {
        console.warn('获取分组失败，将使用默认分组');
      }
    } finally {
      setGroupsLoading(false);
    }
  }, []);

  // 确保组件在客户端才开始执行关键逻辑
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 小屏强制折叠；大屏恢复为缓存或默认展开
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(max-width: 640px)');
    const applyByViewport = () => {
      if (mql.matches) {
        setShowGroupText(false);
      } else {
        try {
          const saved = window.localStorage.getItem(GROUP_TEXT_STORAGE_KEY);
          if (saved !== null) {
            setShowGroupText(saved === '1' || saved === 'true');
          } else {
            setShowGroupText(true);
          }
        } catch (_) {
          setShowGroupText(true);
        }
      }
    };
    applyByViewport();
    mql.addEventListener?.('change', applyByViewport);
    return () => {
      mql.removeEventListener?.('change', applyByViewport);
    };
  }, []);

  // 加载收藏数据
  const loadCollections = useCallback(async (pageNum: number, groupId?: number | null) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      }
      setLoadingMore(true);
      setError(null);

      const response = await fetchUserCollections(pageNum, 100, groupId ?? undefined);

      if (response.code === 0) {
        const newData = response.data.records || [];

        if (pageNum === 1) {
          setCollections(newData);
        } else {
          setCollections(prev => [...prev, ...newData]);
        }

        setHasMore(newData.length === 100);
      } else if (response.code === 9996) {
        throw { code: 9996, message: '登录已过期' };
      } else {
        throw new Error(response.errorMsg || '获取收藏数据失败');
      }
    } catch (error: any) {
      console.error('加载收藏失败:', error);

      if (error.code === 9996) {
        setLoginIn(false);
        if (!userManuallyClosedLogin) {
          setShowLoginModal(true);
        }
        setError('登录已过期，请重新登录');
      } else {
        setError(error.message || '获取收藏数据失败，请稍后再试');
      }

      throw error;
    } finally {
      if (pageNum === 1) {
        setLoading(false);
      }
      setLoadingMore(false);
    }
  }, [userManuallyClosedLogin]);

  // 处理分组选择
  const handleGroupSelect = useCallback((groupId: number | null) => {
    setSelectedGroupId(groupId);
    setPage(1);
    setCollections([]);
    setHasMore(true);
    setError(null);
    loadCollections(1, groupId);
  }, [loadCollections]);

  // 处理新增分组
  const handleAddGroup = useCallback(() => {
    setGroupModalType('add');
    setEditingGroup(null);
    setShowAddGroupModal(true);
  }, []);

  // 处理编辑分组
  const handleEditGroup = useCallback((group: GroupItem) => {
    setGroupModalType('edit');
    setEditingGroup(group);
    setShowEditGroupModal(true);
  }, []);

  // 处理删除分组
  const handleDeleteGroup = useCallback((group: GroupItem) => {
    setDeletingGroup(group);
    setShowDeleteGroupModal(true);
  }, []);

  // 切换分组文本显示
  const handleToggleGroupText = useCallback(() => {
    setShowGroupText(prev => {
      const next = !prev;
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(GROUP_TEXT_STORAGE_KEY, next ? '1' : '0');
        }
      } catch (e) {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  // 处理分组上移
  const handleGroupMoveUp = useCallback(async (group: GroupItem) => {
    const currentIndex = groups.findIndex(g => g.id === group.id);
    if (currentIndex <= 0) return;

    try {
      setOperationLoading(true);
      setOperationType('sort');

      const newGroups = [...groups];
      [newGroups[currentIndex], newGroups[currentIndex - 1]] =
      [newGroups[currentIndex - 1], newGroups[currentIndex]];

      setGroups(newGroups);

      const response = await sortGroups(group.id, 'up');
      if (response.code === 0) {
        showSuccess('排序已保存', '分组顺序已成功更新');
      } else {
        setGroups(groups);
        showError('保存排序失败', response.errorMsg || '保存排序失败');
      }
    } catch (error: any) {
      console.error('分组排序失败:', error);
      setGroups(groups);
      showError('排序失败', '排序失败：' + (error.message || '网络错误'));
    } finally {
      setOperationLoading(false);
      setOperationType(null);
    }
  }, [groups, showSuccess, showError]);

  // 处理分组下移
  const handleGroupMoveDown = useCallback(async (group: GroupItem) => {
    const currentIndex = groups.findIndex(g => g.id === group.id);
    if (currentIndex >= groups.length - 1) return;

    try {
      setOperationLoading(true);
      setOperationType('sort');

      const newGroups = [...groups];
      [newGroups[currentIndex], newGroups[currentIndex + 1]] =
      [newGroups[currentIndex + 1], newGroups[currentIndex]];

      setGroups(newGroups);

      const response = await sortGroups(group.id, 'down');
      if (response.code === 0) {
        showSuccess('排序已保存', '分组顺序已成功更新');
      } else {
        setGroups(groups);
        showError('保存排序失败', response.errorMsg || '保存排序失败');
      }
    } catch (error: any) {
      console.error('分组排序失败:', error);
      setGroups(groups);
      showError('排序失败', '排序失败：' + (error.message || '网络错误'));
    } finally {
      setOperationLoading(false);
      setOperationType(null);
    }
  }, [groups, showSuccess, showError]);

  // 保存分组
  const handleSaveGroup = async (groupName: string, description?: string, groupIcon?: string) => {
    try {
      setOperationLoading(true);
      setOperationType('edit');

      let response;
      if (groupModalType === 'add') {
        response = await addGroup(groupName, description, groupIcon);
      } else if (editingGroup) {
        response = await editGroup(editingGroup.id, groupName, description, groupIcon);
      } else {
        throw new Error('编辑分组时缺少分组ID');
      }

      if (response && response.code === 0) {
        showSuccess('保存成功', groupModalType === 'add' ? '分组已成功创建' : '分组信息已更新');
        setShowAddGroupModal(false);
        setShowEditGroupModal(false);
        setEditingGroup(null);
        await loadGroups();
      } else {
        showError('保存失败', response?.errorMsg || '保存失败');
      }
    } catch (error: any) {
      console.error('保存分组失败:', error);
      showError('保存失败', '保存失败：' + (error.message || '网络错误'));
    } finally {
      setOperationLoading(false);
      setOperationType(null);
    }
  };

  // 确认删除分组
  const confirmDeleteGroup = async () => {
    if (!deletingGroup) return;

    try {
      setOperationLoading(true);
      setOperationType('delete');

      const response = await deleteGroup(deletingGroup.id);
      if (response.code === 0) {
        showSuccess('删除成功', '分组已成功删除');
        setShowDeleteGroupModal(false);
        setDeletingGroup(null);
        await loadGroups();
        if (selectedGroupId === deletingGroup.id) {
          setSelectedGroupId(null);
          loadCollections(1, null);
        }
      } else {
        showError('删除失败', response.errorMsg || '删除失败');
      }
    } catch (error: any) {
      console.error('删除分组失败:', error);
      showError('删除失败', '删除失败：' + (error.message || '网络错误'));
    } finally {
      setOperationLoading(false);
      setOperationType(null);
    }
  };

  // 处理编辑收藏
  const handleEditCollection = (collection: CollectionItem) => {
    setEditingCollection(collection);
    setShowEditModal(true);
  };

  // 处理删除收藏
  const handleDeleteCollection = (collection: CollectionItem) => {
    setDeletingCollection(collection);
    setShowConfirmModal(true);
  };

  // 确认删除收藏
  const confirmDeleteCollection = async () => {
    if (!deletingCollection) return;

    setOperationLoading(true);
    setOperationType('delete');
    try {
      const response = await deleteCollection(deletingCollection.bindId);
      if (response.code === 0) {
        setCollections(prev => prev.filter(item => item.bindId !== deletingCollection.bindId));
        showSuccess('删除成功', '收藏已成功删除');
        setShowConfirmModal(false);
        setDeletingCollection(null);
      } else {
        showError('删除失败', response.errorMsg || '删除失败');
        setShowConfirmModal(false);
      }
    } catch (error: any) {
      console.error('删除收藏失败:', error);
      showError('删除失败', '删除失败：' + (error.message || '网络错误'));
      setShowConfirmModal(false);
    } finally {
      setOperationLoading(false);
      setOperationType(null);
    }
  };

  // 保存编辑的收藏
  const handleSaveEdit = async (bindId: number, customTitle: string, customDesc: string, groupId?: number | null) => {
    setEditLoading(true);
    setOperationLoading(true);
    setOperationType('edit');
    try {
      const response = await editCollection(bindId, customTitle, customDesc, groupId);
      if (response.code === 0) {
        setCollections(prev => prev.map(item =>
          item.bindId === bindId
            ? { ...item, customTitle, customDesc, groupId: groupId || undefined }
            : item
        ));
        setShowEditModal(false);
        setEditingCollection(null);
        showSuccess('修改成功', '收藏信息已成功更新');
      } else {
        showError('保存失败', response.errorMsg || '保存失败');
      }
    } catch (error: any) {
      console.error('保存编辑失败:', error);
      showError('保存失败', '保存失败：' + (error.message || '网络错误'));
    } finally {
      setEditLoading(false);
      setOperationLoading(false);
      setOperationType(null);
    }
  };

  // 初始登录检查和加载
  const initializeCollections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const hasValidToken = await isLoggedIn();

      if (!hasValidToken) {
        setLoginIn(false);
        setLoading(false);
        if (!userManuallyClosedLogin) {
          setShowLoginModal(true);
        }
        setError('用户未登录');
        return;
      }

      try {
        await Promise.all([
          loadGroups(),
          loadCollections(1, selectedGroupId)
        ]);
        setLoginIn(true);
        setUserManuallyClosedLogin(false);
      } catch (error: any) {
        if (error.code === 9996 || error.message?.includes('未登录') || error.message?.includes('登录')) {
          setLoginIn(false);
          if (!userManuallyClosedLogin) {
            setShowLoginModal(true);
          }
          setError('登录已过期，请重新登录');
        } else {
          setLoginIn(true);
          setError(error.message || '初始化失败，请稍后再试');
        }
      }
    } catch (error) {
      console.error('初始化收藏失败:', error);
      setError('初始化失败，请稍后再试');
      setLoading(false);
    }
  }, [loadGroups, loadCollections, selectedGroupId, userManuallyClosedLogin]);

  // 初始加载
  useEffect(() => {
    if (isClient && isInitialLoad.current) {
      initializeCollections();
      isInitialLoad.current = false;
    }
  }, [isClient, initializeCollections]);

  // 监听登录成功事件
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleLoginSuccess = () => {
      setPage(1);
      setCollections([]);
      setHasMore(true);
      setError(null);
      setSelectedGroupId(null);
      initializeCollections();
    };

    window.addEventListener('LOGIN_SUCCESS_RELOAD_DATA', handleLoginSuccess);

    return () => {
      window.removeEventListener('LOGIN_SUCCESS_RELOAD_DATA', handleLoginSuccess);
    };
  }, [initializeCollections]);

  // 设置无限滚动
  useEffect(() => {
    if (!isClient) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasMore) {
          setPage(prevPage => prevPage + 1);
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isClient]);

  // 重新设置观察目标
  useEffect(() => {
    if (observerRef.current && loadMoreRef.current && hasMore && !loading) {
      observerRef.current.disconnect();
      observerRef.current.observe(loadMoreRef.current);
    }
  }, [hasMore, loading, collections.length]);

  // 页码变化时加载更多数据
  useEffect(() => {
    if (page > 1) {
      loadCollections(page, selectedGroupId).catch(error => {
        // 处理分页加载时的错误
      });
    }
  }, [page, selectedGroupId, loadCollections]);

  // 处理向上移动
  const handleMoveUp = async (item: CollectionItem) => {
    const currentIndex = collections.findIndex(c => c.bindId === item.bindId);
    if (currentIndex <= 0) return;

    setSortLoading(true);
    setOperationLoading(true);
    setOperationType('sort');
    try {
      const newCollections = [...collections];
      [newCollections[currentIndex], newCollections[currentIndex - 1]] =
      [newCollections[currentIndex - 1], newCollections[currentIndex]];

      setCollections(newCollections);

      const sortedBindIds = newCollections.map(c => c.bindId);

      const response = await sortCollections(sortedBindIds);
      if (response.code === 0) {
        showSuccess('排序已保存', '收藏顺序已成功更新');
      } else {
        setCollections(collections);
        showError('保存排序失败', response.errorMsg || '保存排序失败');
      }
    } catch (error: any) {
      console.error('排序失败:', error);
      setCollections(collections);
      showError('排序失败', '排序失败：' + (error.message || '网络错误'));
    } finally {
      setSortLoading(false);
      setOperationLoading(false);
      setOperationType(null);
    }
  };

  // 处理向下移动
  const handleMoveDown = async (item: CollectionItem) => {
    const currentIndex = collections.findIndex(c => c.bindId === item.bindId);
    if (currentIndex >= collections.length - 1) return;

    setSortLoading(true);
    setOperationLoading(true);
    setOperationType('sort');
    try {
      const newCollections = [...collections];
      [newCollections[currentIndex], newCollections[currentIndex + 1]] =
      [newCollections[currentIndex + 1], newCollections[currentIndex]];

      setCollections(newCollections);

      const sortedBindIds = newCollections.map(c => c.bindId);

      const response = await sortCollections(sortedBindIds);
      if (response.code === 0) {
        showSuccess('排序已保存', '收藏顺序已成功更新');
      } else {
        setCollections(collections);
        showError('保存排序失败', response.errorMsg || '保存排序失败');
      }
    } catch (error: any) {
      console.error('排序失败:', error);
      setCollections(collections);
      showError('排序失败', '排序失败：' + (error.message || '网络错误'));
    } finally {
      setSortLoading(false);
      setOperationLoading(false);
      setOperationType(null);
    }
  };

  return (
    <>
    {/* 登录弹窗 */}
    {showLoginModal && (
      <LoginModal onClose={(reason) => {
        setShowLoginModal(false);
        if (reason === 'success') {
          initializeCollections();
          setUserManuallyClosedLogin(false);
        } else if (reason === 'manual') {
          setUserManuallyClosedLogin(true);
        }
      }} />
    )}
    <Layout categories={[]} isLoading={false} useSidebarMargin={false}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
          <div className="px-4 sm:px-6 lg:px-8 py-0 sm:py-1">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="text-teal-600 w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  <span>我的收藏</span>
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-2">
                  这里是通过【<span
                    className="relative cursor-pointer text-[#00bba7] hover:text-[#00a593]"
                    onMouseEnter={() => setShowQRCode(true)}
                    onMouseLeave={() => setShowQRCode(false)}
                  >公众号
                    {showQRCode && (
                      <span className="absolute z-50 block top-full left-1/2 transform -translate-x-1/2 w-32 p-2 bg-white rounded-lg shadow-xl border border-gray-100 mt-2">
                        <div className="flex flex-col items-center">
                          <img src="/icons/qrcode.jpg" alt="公众号二维码" className="w-28 h-28" />
                          <p className="mt-1 text-xs text-gray-600">微信扫码，快速收藏</p>
                        </div>
                        <div className="absolute top-[-6px] left-1/2 transform -translate-x-1/2 w-3 h-3 rotate-45 bg-white border-r border-b border-gray-100"></div>
                      </span>
                    )}
                  </span>】或【<Link href="/favorites/wechat-collection" className="text-[#00bba7] hover:text-[#00a593] hover:underline">插件</Link>】快速收藏的站点，如何快速收藏喜欢的站点？<Link href="/favorites/wechat-collection" className="text-[#00bba7] hover:text-[#00a593] hover:underline">点击查看教程</Link>。
                </p>
              </div>

              {/* 编辑按钮 */}
              {loginIn && (
                <button
                  onClick={() => {
                    setIsEditMode(!isEditMode);
                  }}
                  className={`flex items-center justify-center rounded-lg transition-colors px-3 sm:px-4 py-2 text-sm font-medium ${
                    isEditMode
                      ? 'bg-teal-400 hover:bg-teal-500 text-white'
                      : 'bg-teal-500 hover:bg-teal-600 text-white'
                  }`}
                >
                  {isEditMode ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  )}
                  <span className="hidden sm:inline">
                    {isEditMode ? '完成编辑' : '编辑收藏'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="flex-1 flex overflow-hidden bg-gray-50">
          {/* 左侧分组TabBar */}
          {loginIn && (
            <GroupTabBar
              groups={groups}
              selectedGroupId={selectedGroupId}
              onGroupSelect={handleGroupSelect}
              loading={groupsLoading}
              isEditMode={isGroupEditMode}
              onAddGroup={handleAddGroup}
              onEditGroup={handleEditGroup}
              onDeleteGroup={handleDeleteGroup}
              showText={showGroupText}
              onToggleText={handleToggleGroupText}
              onToggleGroupEdit={handleGroupEditToggle}
              onMoveUp={handleGroupMoveUp}
              onMoveDown={handleGroupMoveDown}
            />
          )}

          {/* 右侧收藏内容区域 */}
          <div className="flex-1 overflow-y-auto ultra-thin-scrollbar">
            <div className="px-4 sm:px-6 lg:px-8 py-2 sm:py-6">
            <div>
              {loading ? (
                <div className="py-16 flex flex-col items-center justify-center">
                  <Loading title="正在加载收藏数据" subtitle="随时随地都能用上您的宝贝收藏..." />
                </div>
              ) : ( error && loginIn ) ? (
                <div className="py-12">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 text-red-500 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">数据加载失败</h3>
                    <p className="text-gray-600 text-center mb-6">抱歉，无法加载数据，请稍后重试...</p>
                    <button
                      onClick={() => loadCollections(1)}
                      className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                    >
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        重新加载
                      </div>
                    </button>
                  </div>
                </div>
              ):( error && !loginIn ) ? (
                <div className="py-12">
                <div className="flex flex-col items-center justify-center">
                  <button
                    onClick={() => {
                      setUserManuallyClosedLogin(false);
                      setShowLoginModal(true);
                    }}
                    className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                  >
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      点击登录
                    </div>
                  </button>
                  <p className="text-gray-600 text-center mb-6">登录同步最新收藏列表</p>
                </div>
              </div>
              ) : collections.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
                    {collections.map((item, index) => (
                      <CollectionCard
                        key={item.urlId}
                        item={item}
                        isEditMode={isEditMode}
                        onEdit={handleEditCollection}
                        onDelete={handleDeleteCollection}
                        onMoveUp={isEditMode ? handleMoveUp : undefined}
                        onMoveDown={isEditMode ? handleMoveDown : undefined}
                        canMoveUp={isEditMode && index > 0 && !sortLoading}
                        canMoveDown={isEditMode && index < collections.length - 1 && !sortLoading}
                      />
                    ))}
                  </div>

                  {/* 加载更多指示器 */}
                  <div ref={loadMoreRef} className="py-4 text-center">
                    {loadingMore ? (
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#00bba7]"></div>
                        <span className="ml-2 text-gray-500">加载中...</span>
                      </div>
                    ) : hasMore ? (
                      <p className="text-gray-400">向下滚动加载更多</p>
                    ) : (
                      <p className="text-gray-400">没有更多数据了</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-gray-50 p-20 rounded-lg text-center">
                  <p className="text-gray-500">当前分组还没有任何收藏</p>
                  <p className="text-gray-500">您可以通过添加收藏或收藏分组进行管理</p>
                  <button
                    onClick={handleStartAddFavorites}
                    className="mt-4 px-4 py-2 bg-[#00bba7] text-white rounded-md hover:bg-[#00a593] transition-colors"
                  >
                    开始添加收藏
                  </button>
                </div>
              )}
            </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>

    {/* 编辑收藏模态框 */}
    {showEditModal && editingCollection && (
      <EditCollectionModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingCollection(null);
        }}
        collection={editingCollection}
        groups={groups}
        onSave={handleSaveEdit}
        isLoading={editLoading}
        onRemoveFromList={(bindId) => {
          if (selectedGroupId !== null) {
            setCollections(prev => prev.filter(item => item.bindId !== bindId));
          }
        }}
      />
    )}

    {/* 确认删除模态框 */}
    <ConfirmModal
      isOpen={showConfirmModal}
      title="确认删除"
      message={`确定要删除收藏"${deletingCollection?.customTitle || deletingCollection?.title}"吗？删除后无法恢复。`}
      confirmText="删除"
      cancelText="取消"
      onConfirm={confirmDeleteCollection}
      onCancel={() => {
        setShowConfirmModal(false);
        setDeletingCollection(null);
      }}
      type="danger"
    />

    {/* 操作Loading覆盖层 */}
    <OverlayLoading
      isVisible={operationLoading}
      message={operationType === 'edit' ? '正在保存修改...' :
               operationType === 'delete' ? '正在删除收藏...' :
               operationType === 'sort' ? '正在保存排序...' : '正在处理...'}
    />

    {/* 分组管理模态框 */}
    {(showAddGroupModal || showEditGroupModal) && (
      <GroupModal
        isOpen={showAddGroupModal || showEditGroupModal}
        onClose={() => {
          setShowAddGroupModal(false);
          setShowEditGroupModal(false);
          setEditingGroup(null);
        }}
        group={editingGroup}
        type={groupModalType}
        onSave={handleSaveGroup}
        isLoading={operationLoading && operationType === 'edit'}
      />
    )}

    {/* 删除分组确认模态框 */}
    <ConfirmModal
      isOpen={showDeleteGroupModal}
      title="确认删除分组"
      message={`确定要删除分组"${deletingGroup?.groupName}"吗？删除后该分组下的收藏将移至"未分组"。`}
      confirmText={operationLoading && operationType === 'delete' ? '删除中...' : '删除'}
      cancelText="取消"
      onConfirm={confirmDeleteGroup}
      onCancel={() => {
        setShowDeleteGroupModal(false);
        setDeletingGroup(null);
      }}
      type="danger"
      isLoading={operationLoading && operationType === 'delete'}
    />

    {/* Toast通知容器 */}
    <ToastContainer
      toasts={toasts}
      onRemoveToast={removeToast}
    />
    </>
  );
}