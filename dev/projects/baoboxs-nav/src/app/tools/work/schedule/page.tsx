'use client';

import React, { useState, useEffect } from 'react';
import { FaPlus, FaCalendarAlt, FaList, FaChartBar, FaChevronRight, FaArrowLeft, FaClock, FaPlay, FaCheck, FaExclamationTriangle, FaTimes, FaTasks, FaHourglassHalf, FaCheckCircle, FaExclamationCircle, FaBan, FaInfo } from 'react-icons/fa';
import Link from 'next/link';
import { useSchedule } from '@/hooks/useSchedule';
import { Schedule, ScheduleFormData, ScheduleStatus } from '@/types/Schedule';
import Calendar from '@/components/Schedule/Calendar';
import ScheduleList from '@/components/Schedule/ScheduleList';
import ScheduleEditor from '@/components/Schedule/ScheduleEditor';
import Loading from '@/components/ui/Loading';
import OverlayLoading from '@/components/ui/OverlayLoading';
import ConfirmModal from '@/components/ConfirmModal';
import ToastContainer from '@/components/ui/ToastContainer';
import LoginModal from '@/components/LoginModal';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';

const SchedulePage: React.FC = () => {
  const {
    schedules,
    monthStats,
    loading,
    refreshing,
    setRefreshing,
    error: scheduleError,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    updateScheduleStatus,
    completeSchedule,
    getSchedulesByDate,
    getTodaySchedules,
    getScheduleDates,
    getStatusCounts,
    changeMonth,
    refreshDaySchedules
  } = useSchedule();

  const { isAuthenticated } = useAuth();
  const { toasts, showSuccess, showError, showWarning, showInfo, removeToast } = useToast();

  const [selectedDate, setSelectedDate] = useState(() => 
    new Date().toLocaleDateString('en-CA')
  );
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // 获取选中日期的日程
  const selectedDateSchedules = getSchedulesByDate(selectedDate);
  
  // 获取今天的日程
  const todaySchedules = getTodaySchedules();
  
  // 获取有日程的日期列表
  const scheduleDates = getScheduleDates();
  
  // 获取统计信息
  const todayStats = getStatusCounts(selectedDate);
  const totalStats = getStatusCounts();

  // 处理添加日程
  const handleAddSchedule = () => {
    if (!isAuthenticated) {
      showError('登录提示', '请先登录后再使用日程功能');
      setShowLoginModal(true);
      return;
    }
    setEditingSchedule(null);
    setIsEditorOpen(true);
  };

  // 处理编辑日程
  const handleEditSchedule = (schedule: Schedule) => {
    if (!isAuthenticated) {
      showError('登录提示', '请先登录后再使用日程功能');
      setShowLoginModal(true);
      return;
    }
    setEditingSchedule(schedule);
    setIsEditorOpen(true);
  };

  // 处理保存日程
  const handleSaveSchedule = async (data: ScheduleFormData) => {
    try {
      // 立即显示loading
      setRefreshing(true);
      
      if (editingSchedule) {
        // 更新现有日程
        await updateSchedule(editingSchedule.id, data);
        showSuccess('更新成功', '日程已成功更新');
      } else {
        // 添加新日程
        await addSchedule(data);
        showSuccess('添加成功', '日程已成功添加');
      }
      setIsEditorOpen(false);
      // 注意：不需要手动刷新，因为hook中的方法已经处理了数据刷新
    } catch (error) {
      console.error('保存日程失败:', error);
      if (error instanceof Error) {
        showError('保存失败', error.message);
      } else {
        showError('保存失败', '保存日程失败，请重试');
      }
    } finally {
      // 确保loading状态被清除
      setRefreshing(false);
    }
  };

  // 处理删除日程
  const handleDeleteSchedule = (id: string) => {
    setScheduleToDelete(id);
    setShowDeleteConfirm(true);
  };

  // 确认删除日程
  const confirmDeleteSchedule = async () => {
    if (!scheduleToDelete) return;
    
    // 立即关闭确认框
    setShowDeleteConfirm(false);
    setScheduleToDelete(null);
    
    try {
      // 立即显示loading
      setRefreshing(true);
      await deleteSchedule(scheduleToDelete);
      showSuccess('删除成功', '日程已成功删除');
      // 注意：不需要手动刷新，因为hook中的方法已经处理了数据刷新
    } catch (error) {
      console.error('删除日程失败:', error);
      if (error instanceof Error) {
        showError('删除失败', error.message);
      } else {
        showError('删除失败', '删除日程失败，请重试');
      }
    } finally {
      // 确保loading状态被清除
      setRefreshing(false);
    }
  };

  // 处理日期选择
  const handleDateSelect = async (date: string) => {
    setSelectedDate(date);
    // 如果该日期没有日程数据，则加载
    if (!schedules[date] || schedules[date].length === 0) {
      // 检查该日期在month数据中是否有日程
      const hasScheduleInMonth = monthStats?.dailySchedules.some(
        day => day.scheduleDate.split(' ')[0] === date
      );
      
      if (hasScheduleInMonth) {
        await refreshDaySchedules(date);
      }
    }
  };

  // 处理月份切换
  const handleMonthChange = (year: number, month: number) => {
    changeMonth(year, month);
  };

  // 处理登录弹窗关闭
  const handleLoginModalClose = (reason?: 'manual' | 'success') => {
    setShowLoginModal(false);
    if (reason === 'success') {
      showSuccess('登录成功', '欢迎回来！现在可以使用日程功能了');
    }
  };

  // 显示schedule hook中的错误
  useEffect(() => {
    if (scheduleError) {
      showError('加载失败', scheduleError);
    }
  }, [scheduleError, showError]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center">
        <Loading 
          title="正在加载日程数据" 
          subtitle="为您准备最实用的日程管理..." 
          variant="complex"
          size="lg"
        />
      </div>
    );
  }

  return (
    <div className="h-auto bg-gray-50 relative">
      {/* 遮罩层loading */}
      <OverlayLoading 
        isVisible={refreshing} 
        message="正在更新日程数据..."
      />
      {/* 头部 */}
      <div className="bg-white shadow-sm border-b border-gray-200 mt-3">
        <div className="container mx-auto px-4 py-6">
          {/* 面包屑导航 */}
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <Link href="/tools" className="hover:text-teal-600">
              工具
            </Link>
            <FaChevronRight className="w-3 h-3" />
            <Link href="/tools/work" className="hover:text-teal-600">
              工作工具
            </Link>
            <FaChevronRight className="w-3 h-3" />
            <span className="text-gray-800">日程安排</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-800 flex items-center space-x-2">
                <FaCalendarAlt className="w-4 h-4 sm:w-5 sm:h-5 text-teal-500" />
                <span>日程管理</span>
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">管理您的日程安排和任务</p>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* 返回按钮 */}
              <Link
                href="/tools/work"
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">返回</span>
              </Link>

              {/* 视图切换 */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-3 py-2 text-sm rounded-md transition-colors flex items-center space-x-1 ${
                    viewMode === 'calendar'
                      ? 'bg-white text-teal-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <FaCalendarAlt className="w-4 h-4" />
                  <span className="hidden sm:inline">日历</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 text-sm rounded-md transition-colors flex items-center space-x-1 ${
                    viewMode === 'list'
                      ? 'bg-white text-teal-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <FaList className="w-4 h-4" />
                  <span className="hidden sm:inline">列表</span>
                </button>
              </div>
              


              {/* 添加按钮 */}
              <button
                onClick={handleAddSchedule}
                className="bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition-colors flex items-center space-x-2"
              >
                <FaPlus className="w-4 h-4" />
                <span className="hidden sm:inline">添加日程</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">

        
        {/* 统计卡片 */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          {/* 总日程卡片 */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg shadow-sm border border-orange-200 p-3 hover:shadow-md transition-all duration-300">
            {/* 科技风背景元素 */}
            <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity">
              <div className="absolute top-2 left-2 w-1 h-1 bg-orange-400 rounded-full"></div>
              <div className="absolute top-4 right-3 w-0.5 h-0.5 bg-orange-400 rounded-full"></div>
              <div className="absolute bottom-3 left-4 w-0.5 h-0.5 bg-orange-400 rounded-full"></div>
              <div className="absolute bottom-2 right-2 w-1 h-1 bg-orange-400 rounded-full"></div>
              <div className="absolute top-1/2 left-1 w-0.5 h-0.5 bg-orange-400 rounded-full"></div>
              <div className="absolute top-1/3 right-1 w-0.5 h-0.5 bg-orange-400 rounded-full"></div>
            </div>
            {/* 装饰性线条 */}
            <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-orange-200 to-amber-300 rounded-bl-lg opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 bg-gradient-to-tr from-orange-100 to-transparent rounded-tr-lg opacity-10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 bg-gradient-to-br from-orange-500 to-amber-600 rounded-md shadow-sm">
                    <FaTasks className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-orange-700">{totalStats.total}</div>
                    <div className="hidden md:block text-xs text-orange-600">日程总数</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-orange-500 font-medium">总计</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 待处理卡片 */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-200 p-3 hover:shadow-md transition-all duration-300">
            {/* 科技风背景元素 */}
            <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity">
              <div className="absolute top-2 left-2 w-1 h-1 bg-blue-400 rounded-full"></div>
              <div className="absolute top-4 right-3 w-0.5 h-0.5 bg-blue-400 rounded-full"></div>
              <div className="absolute bottom-3 left-4 w-0.5 h-0.5 bg-blue-400 rounded-full"></div>
              <div className="absolute bottom-2 right-2 w-1 h-1 bg-blue-400 rounded-full"></div>
              <div className="absolute top-1/2 left-1 w-0.5 h-0.5 bg-blue-400 rounded-full"></div>
              <div className="absolute top-1/3 right-1 w-0.5 h-0.5 bg-blue-400 rounded-full"></div>
            </div>
            {/* 装饰性线条 */}
            <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-blue-200 to-indigo-300 rounded-bl-lg opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 bg-gradient-to-tr from-blue-100 to-transparent rounded-tr-lg opacity-10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md shadow-sm">
                    <FaHourglassHalf className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-700">{totalStats.pending}</div>
                    <div className="hidden md:block text-xs text-blue-600">等待处理</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-blue-500 font-medium">待办</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 进行中卡片 */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg shadow-sm border border-teal-200 p-3 hover:shadow-md transition-all duration-300">
            {/* 科技风背景元素 */}
            <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity">
              <div className="absolute top-2 left-2 w-1 h-1 bg-teal-400 rounded-full"></div>
              <div className="absolute top-4 right-3 w-0.5 h-0.5 bg-teal-400 rounded-full"></div>
              <div className="absolute bottom-3 left-4 w-0.5 h-0.5 bg-teal-400 rounded-full"></div>
              <div className="absolute bottom-2 right-2 w-1 h-1 bg-teal-400 rounded-full"></div>
              <div className="absolute top-1/2 left-1 w-0.5 h-0.5 bg-teal-400 rounded-full"></div>
              <div className="absolute top-1/3 right-1 w-0.5 h-0.5 bg-teal-400 rounded-full"></div>
            </div>
            {/* 装饰性线条 */}
            <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-teal-200 to-cyan-300 rounded-bl-lg opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 bg-gradient-to-tr from-teal-100 to-transparent rounded-tr-lg opacity-10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-md shadow-sm">
                    <FaPlay className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-teal-700">{totalStats.inProgress}</div>
                    <div className="hidden md:block text-xs text-teal-600">正在执行</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-teal-500 font-medium">进行</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 已完成卡片 */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-sm border border-green-200 p-3 hover:shadow-md transition-all duration-300">
            {/* 科技风背景元素 */}
            <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity">
              <div className="absolute top-2 left-2 w-1 h-1 bg-green-400 rounded-full"></div>
              <div className="absolute top-4 right-3 w-0.5 h-0.5 bg-green-400 rounded-full"></div>
              <div className="absolute bottom-3 left-4 w-0.5 h-0.5 bg-green-400 rounded-full"></div>
              <div className="absolute bottom-2 right-2 w-1 h-1 bg-green-400 rounded-full"></div>
              <div className="absolute top-1/2 left-1 w-0.5 h-0.5 bg-green-400 rounded-full"></div>
              <div className="absolute top-1/3 right-1 w-0.5 h-0.5 bg-green-400 rounded-full"></div>
            </div>
            {/* 装饰性线条 */}
            <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-green-200 to-emerald-300 rounded-bl-lg opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 bg-gradient-to-tr from-green-100 to-transparent rounded-tr-lg opacity-10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-md shadow-sm">
                    <FaCheckCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-700">{totalStats.completed}</div>
                    <div className="hidden md:block text-xs text-green-600">已完成</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-green-500 font-medium">完成</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 已超时卡片 */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-red-50 to-rose-50 rounded-lg shadow-sm border border-red-200 p-3 hover:shadow-md transition-all duration-300">
            {/* 科技风背景元素 */}
            <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity">
              <div className="absolute top-2 left-2 w-1 h-1 bg-red-400 rounded-full"></div>
              <div className="absolute top-4 right-3 w-0.5 h-0.5 bg-red-400 rounded-full"></div>
              <div className="absolute bottom-3 left-4 w-0.5 h-0.5 bg-red-400 rounded-full"></div>
              <div className="absolute bottom-2 right-2 w-1 h-1 bg-red-400 rounded-full"></div>
              <div className="absolute top-1/2 left-1 w-0.5 h-0.5 bg-red-400 rounded-full"></div>
              <div className="absolute top-1/3 right-1 w-0.5 h-0.5 bg-red-400 rounded-full"></div>
            </div>
            {/* 装饰性线条 */}
            <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-red-200 to-rose-300 rounded-bl-lg opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 bg-gradient-to-tr from-red-100 to-transparent rounded-tr-lg opacity-10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 bg-gradient-to-br from-red-500 to-rose-600 rounded-md shadow-sm">
                    <FaExclamationCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-red-700">{totalStats.overdue}</div>
                    <div className="hidden md:block text-xs text-red-600">已超时</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-red-500 font-medium">超时</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 已取消卡片 */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg shadow-sm border border-slate-200 p-3 hover:shadow-md transition-all duration-300">
            {/* 科技风背景元素 */}
            <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity">
              <div className="absolute top-2 left-2 w-1 h-1 bg-slate-400 rounded-full"></div>
              <div className="absolute top-4 right-3 w-0.5 h-0.5 bg-slate-400 rounded-full"></div>
              <div className="absolute bottom-3 left-4 w-0.5 h-0.5 bg-slate-400 rounded-full"></div>
              <div className="absolute bottom-2 right-2 w-1 h-1 bg-slate-400 rounded-full"></div>
              <div className="absolute top-1/2 left-1 w-0.5 h-0.5 bg-slate-400 rounded-full"></div>
              <div className="absolute top-1/3 right-1 w-0.5 h-0.5 bg-slate-400 rounded-full"></div>
            </div>
            {/* 装饰性线条 */}
            <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-slate-200 to-slate-300 rounded-bl-lg opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 bg-gradient-to-tr from-slate-100 to-transparent rounded-tr-lg opacity-10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 bg-gradient-to-br from-slate-500 to-slate-600 rounded-md shadow-sm">
                    <FaBan className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-slate-800">{totalStats.cancelled}</div>
                    <div className="hidden md:block text-xs text-slate-600">已取消</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 font-medium">取消</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 主内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：日历或者当天日程 */}
          <div className="lg:col-span-1">
            {viewMode === 'calendar' ? (
              <Calendar
                monthStats={monthStats}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                onMonthChange={handleMonthChange}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">今天的日程</h3>
                {todaySchedules.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FaCalendarAlt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>今天暂无日程</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todaySchedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-800">{schedule.title}</p>
                            <p className="text-sm text-gray-600">{schedule.time}</p>
                          </div>
                          <button
                            onClick={() => completeSchedule(schedule.id)}
                            className="text-green-600 hover:bg-green-50 p-1 rounded"
                          >
                            完成
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 右侧：日程列表 */}
          <div className="lg:col-span-2">
            <ScheduleList
              schedules={selectedDateSchedules}
              selectedDate={selectedDate}
              onEdit={handleEditSchedule}
              onDelete={handleDeleteSchedule}
              onStatusChange={async (id: string, status: ScheduleStatus) => {
                try {
                  setRefreshing(true);
                  await updateScheduleStatus(id, status);
                } finally {
                  setRefreshing(false);
                }
              }}
              onComplete={async (id: string) => {
                try {
                  setRefreshing(true);
                  await completeSchedule(id);
                } finally {
                  setRefreshing(false);
                }
              }}
              onAddSchedule={handleAddSchedule}
            />
          </div>
        </div>
      </div>

      {/* 日程编辑器 */}
      <ScheduleEditor
        isOpen={isEditorOpen}
        schedule={editingSchedule}
        defaultDate={selectedDate}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveSchedule}
      />

      {/* 删除确认模态框 */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="删除日程"
        message="确定要删除这个日程吗？删除后将无法恢复。"
        confirmText="删除"
        cancelText="取消"
        type="danger"
        onConfirm={confirmDeleteSchedule}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setScheduleToDelete(null);
        }}
      />

      {/* Toast通知容器 */}
      <ToastContainer
        toasts={toasts}
        onRemoveToast={removeToast}
      />

      {/* 登录弹窗 */}
      {showLoginModal && (
        <LoginModal onClose={handleLoginModalClose} />
      )}
    </div>
  );
};

export default SchedulePage;