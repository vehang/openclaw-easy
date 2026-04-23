'use client';

import React, { useState, useMemo } from 'react';
import { FaEdit, FaTrash, FaCheck, FaClock, FaExclamationTriangle, FaFlag, FaPlay, FaPause, FaExclamationCircle, FaMinusCircle, FaCircle, FaPlus, FaCalendarAlt, FaCalendarPlus, FaInbox } from 'react-icons/fa';
import { 
  Schedule, 
  ScheduleStatus, 
  SchedulePriority,
  SCHEDULE_STATUS_COLORS, 
  SCHEDULE_STATUS_LABELS,
  SCHEDULE_PRIORITY_LABELS,
  SCHEDULE_PRIORITY_COLORS
} from '@/types/Schedule';

interface ScheduleListProps {
  schedules: Schedule[];
  selectedDate: string;
  onEdit: (schedule: Schedule) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: ScheduleStatus) => void;
  onComplete: (id: string) => void;
  onAddSchedule?: () => void;
}

const ScheduleList: React.FC<ScheduleListProps> = ({
  schedules,
  selectedDate,
  onEdit,
  onDelete,
  onStatusChange,
  onComplete,
  onAddSchedule
}) => {
  const [filterStatus, setFilterStatus] = useState<ScheduleStatus | 'all'>('all');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // 状态优先级映射（数字越小优先级越高）
  const statusPriority = {
    [ScheduleStatus.OVERDUE]: 1,      // 超时 - 最高优先级
    [ScheduleStatus.IN_PROGRESS]: 2,  // 进行中
    [ScheduleStatus.PENDING]: 3,      // 待处理
    [ScheduleStatus.COMPLETED]: 4,    // 已完成
    [ScheduleStatus.CANCELLED]: 5     // 已取消 - 最低优先级
  };

  // 优先级映射（数字越小优先级越高）
  const priorityOrder = {
    [SchedulePriority.URGENT]: 1,   // 紧急 - 最高优先级
    [SchedulePriority.HIGH]: 2,     // 高
    [SchedulePriority.MEDIUM]: 3,   // 中
    [SchedulePriority.LOW]: 4       // 低 - 最低优先级
  };

  // 排序函数
  const sortSchedules = (schedules: Schedule[]): Schedule[] => {
    return [...schedules].sort((a, b) => {
      // 第一维度：状态优先级
      const statusDiff = statusPriority[a.status] - statusPriority[b.status];
      if (statusDiff !== 0) {
        return statusDiff;
      }

      // 第二维度：紧急程度（相同状态下，越紧急越靠前）
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      // 第三维度：结束时间（相同紧急状态下，结束时间越早越靠前）
      const aEndTime = a.endTime || a.time;
      const bEndTime = b.endTime || b.time;
      return aEndTime.localeCompare(bEndTime);
    });
  };

  // 过滤并排序日程
  const filteredAndSortedSchedules = useMemo(() => {
    const filtered = schedules.filter(schedule => 
      filterStatus === 'all' || schedule.status === filterStatus
    );
    return sortSchedules(filtered);
  }, [schedules, filterStatus]);

  // 获取状态图标
  const getStatusIcon = (status: ScheduleStatus) => {
    switch (status) {
      case ScheduleStatus.PENDING:
        return <FaClock className="w-3 h-3 text-blue-500" />;
      case ScheduleStatus.IN_PROGRESS:
        return <FaPlay className="w-3 h-3 text-teal-500" />;
      case ScheduleStatus.COMPLETED:
        return <FaCheck className="w-3 h-3 text-green-500" />;
      case ScheduleStatus.OVERDUE:
        return <FaExclamationTriangle className="w-3 h-3 text-red-500" />;
      case ScheduleStatus.CANCELLED:
        return <FaPause className="w-3 h-3 text-gray-500" />;
      default:
        return <FaClock className="w-3 h-3" />;
    }
  };

  // 获取优先级图标
  const getPriorityIcon = (priority: SchedulePriority) => {
    switch (priority) {
      case SchedulePriority.URGENT:
        return <FaExclamationTriangle className="w-3 h-3 text-red-500" />;
      case SchedulePriority.HIGH:
        return <FaExclamationCircle className="w-3 h-3 text-orange-500" />;
      case SchedulePriority.MEDIUM:
        return <FaMinusCircle className="w-3 h-3 text-yellow-500" />;
      case SchedulePriority.LOW:
        return <FaCircle className="w-3 h-3 text-green-500" />;
      default:
        return <FaFlag className="w-3 h-3 text-gray-500" />;
    }
  };

  // 获取优先级文字颜色
  const getPriorityTextColor = (priority: SchedulePriority) => {
    switch (priority) {
      case SchedulePriority.URGENT:
        return 'text-red-600';
      case SchedulePriority.HIGH:
        return 'text-orange-600';
      case SchedulePriority.MEDIUM:
        return 'text-yellow-600';
      case SchedulePriority.LOW:
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  // 格式化日期显示
  const formatDate = (date: string) => {
    const today = new Date().toLocaleDateString('en-CA');
    if (date === today) return '今天';
    
    const dateObj = new Date(date);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[dateObj.getDay()];
    
    return `${dateObj.getMonth() + 1}月${dateObj.getDate()}日 ${weekday}`;
  };

  // 格式化时间显示
  const formatTimeRange = (schedule: Schedule) => {
    if (schedule.endTime) {
      return `${schedule.time} - ${schedule.endTime}`;
    }
    return schedule.time;
  };

  // 格式化截止时间显示（小屏幕用）
  const formatEndTime = (schedule: Schedule) => {
    return schedule.endTime || schedule.time;
  };

  // 统计各状态数量
  const statusCounts = {
    all: schedules.length,
    [ScheduleStatus.PENDING]: schedules.filter(s => s.status === ScheduleStatus.PENDING).length,
    [ScheduleStatus.IN_PROGRESS]: schedules.filter(s => s.status === ScheduleStatus.IN_PROGRESS).length,
    [ScheduleStatus.COMPLETED]: schedules.filter(s => s.status === ScheduleStatus.COMPLETED).length,
    [ScheduleStatus.OVERDUE]: schedules.filter(s => s.status === ScheduleStatus.OVERDUE).length,
    [ScheduleStatus.CANCELLED]: schedules.filter(s => s.status === ScheduleStatus.CANCELLED).length,
  };

  // 处理状态变更
  const handleStatusChange = async (id: string, status: ScheduleStatus) => {
    try {
      setUpdatingStatus(id);
      await onStatusChange(id, status);
    } catch (error) {
      console.error('更新状态失败:', error);
      alert('更新状态失败，请重试');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // 处理完成操作
  const handleComplete = async (id: string) => {
    try {
      setUpdatingStatus(id);
      await onComplete(id);
    } catch (error) {
      console.error('完成日程失败:', error);
      alert('完成日程失败，请重试');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // 获取快捷操作按钮
  const getQuickActionButtons = (schedule: Schedule) => {
    const buttons = [];

    // 待处理 -> 进行中
    if (schedule.status === ScheduleStatus.PENDING) {
      buttons.push(
        <button
          key="start"
          onClick={() => handleStatusChange(schedule.id, ScheduleStatus.IN_PROGRESS)}
          disabled={updatingStatus === schedule.id}
          className="p-1.5 text-teal-600 hover:bg-teal-50 rounded transition-colors disabled:opacity-50"
          title="开始进行"
        >
          <FaPlay className="w-3 h-3" />
        </button>
      );
    }

    // 进行中 -> 完成
    if (schedule.status === ScheduleStatus.IN_PROGRESS) {
      buttons.push(
        <button
          key="complete"
          onClick={() => handleComplete(schedule.id)}
          disabled={updatingStatus === schedule.id}
          className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
          title="完成"
        >
          <FaCheck className="w-3 h-3" />
        </button>
      );
    }

    // 超时 -> 完成 或 取消
    if (schedule.status === ScheduleStatus.OVERDUE) {
      buttons.push(
        <button
          key="complete"
          onClick={() => handleComplete(schedule.id)}
          disabled={updatingStatus === schedule.id}
          className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
          title="完成"
        >
          <FaCheck className="w-3 h-3" />
        </button>
      );
      buttons.push(
        <button
          key="cancel"
          onClick={() => handleStatusChange(schedule.id, ScheduleStatus.CANCELLED)}
          disabled={updatingStatus === schedule.id}
          className="p-1.5 text-gray-600 hover:bg-gray-50 rounded transition-colors disabled:opacity-50"
          title="取消"
        >
          <FaPause className="w-3 h-3" />
        </button>
      );
    }

    // 已取消 -> 完成 或 进行中
    if (schedule.status === ScheduleStatus.CANCELLED) {
      buttons.push(
        <button
          key="complete"
          onClick={() => handleComplete(schedule.id)}
          disabled={updatingStatus === schedule.id}
          className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
          title="完成"
        >
          <FaCheck className="w-3 h-3" />
        </button>
      );
      buttons.push(
        <button
          key="start"
          onClick={() => handleStatusChange(schedule.id, ScheduleStatus.IN_PROGRESS)}
          disabled={updatingStatus === schedule.id}
          className="p-1.5 text-teal-600 hover:bg-teal-50 rounded transition-colors disabled:opacity-50"
          title="开始进行"
        >
          <FaPlay className="w-3 h-3" />
        </button>
      );
    }

    // 待处理/进行中 -> 取消
    if (schedule.status === ScheduleStatus.PENDING || schedule.status === ScheduleStatus.IN_PROGRESS) {
      buttons.push(
        <button
          key="cancel"
          onClick={() => handleStatusChange(schedule.id, ScheduleStatus.CANCELLED)}
          disabled={updatingStatus === schedule.id}
          className="p-1.5 text-gray-600 hover:bg-gray-50 rounded transition-colors disabled:opacity-50"
          title="取消"
        >
          <FaPause className="w-3 h-3" />
        </button>
      );
    }

    return buttons;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* 头部 */}
      <div className="p-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {formatDate(selectedDate)} 的日程
        </h3>
        
        {/* 状态过滤器 */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-2 py-1 text-xs rounded-full transition-colors ${
              filterStatus === 'all'
                ? 'bg-teal-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            全部 ({statusCounts.all})
          </button>
          
          {Object.values(ScheduleStatus).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-2 py-1 text-xs rounded-full transition-colors flex items-center space-x-1 ${
                filterStatus === status
                  ? 'bg-teal-500 text-white'
                  : status === ScheduleStatus.PENDING
                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    : status === ScheduleStatus.IN_PROGRESS
                      ? 'bg-teal-100 text-teal-600 hover:bg-teal-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>{SCHEDULE_STATUS_LABELS[status]}</span>
              <span>({statusCounts[status]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* 日程列表 */}
      <div className="p-3">
        {filteredAndSortedSchedules.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <FaCalendarPlus className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm mb-4">暂无日程安排</p>
            {onAddSchedule && (
              <button
                onClick={onAddSchedule}
                className="bg-teal-500 text-white px-3 py-1 rounded-md hover:bg-teal-600 transition-colors flex items-center space-x-1.5 mx-auto text-sm"
              >
                <FaPlus className="w-3 h-3" />
                <span>添加日程</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAndSortedSchedules.map((schedule) => {
              const statusColors = SCHEDULE_STATUS_COLORS[schedule.status];
              const isUpdating = updatingStatus === schedule.id;
              
              return (
                <div
                  key={schedule.id}
                  className={`p-3 rounded-lg border-l-3 ${statusColors.bg} ${statusColors.border} transition-all duration-200 hover:shadow-sm ${
                    isUpdating ? 'opacity-75' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {/* 左侧：日程信息 */}
                    <div className="flex-1 min-w-0">
                      {/* 第一行：状态tag + 紧急程度 + 时间 + 标题 */}
                      <div className="flex items-center space-x-2 mb-1">
                        {/* 状态tag */}
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(schedule.status)}
                          <span className={`text-xs px-1.5 py-0.5 rounded-full text-white ${statusColors.badge} hidden sm:inline`}>
                            {SCHEDULE_STATUS_LABELS[schedule.status]}
                          </span>
                        </div>
                        
                        {/* 紧急程度 */}
                        <div className="flex items-center space-x-1">
                          {getPriorityIcon(schedule.priority)}
                          <span className={`text-xs ${getPriorityTextColor(schedule.priority)} hidden sm:inline`}>
                            {SCHEDULE_PRIORITY_LABELS[schedule.priority]}
                          </span>
                        </div>
                        
                        {/* 时间 */}
                        <span className="text-xs font-medium text-gray-600">
                          <span className="hidden sm:inline">{formatTimeRange(schedule)}</span>
                          <span className="sm:hidden">{schedule.time}</span>
                        </span>
                        
                        {/* 标题 */}
                        <h4 className={`font-medium text-sm truncate ${statusColors.text}`}>
                          {schedule.title}
                        </h4>
                      </div>
                      
                      {/* 第二行：描述（如果有） */}
                      {schedule.description && (
                        <p className="text-xs text-gray-600 truncate">
                          {schedule.description}
                        </p>
                      )}
                    </div>

                    {/* 右侧：操作按钮 */}
                    <div className="flex items-center space-x-1 ml-3 flex-shrink-0">
                      {/* 快捷操作按钮 */}
                      {getQuickActionButtons(schedule)}
                      
                      {/* 编辑按钮 */}
                      <button
                        onClick={() => onEdit(schedule)}
                        disabled={isUpdating}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                        title="编辑"
                      >
                        <FaEdit className="w-3 h-3" />
                      </button>
                      
                      {/* 删除按钮 */}
                      <button
                        onClick={() => onDelete(schedule.id)}
                        disabled={isUpdating}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        title="删除"
                      >
                        <FaTrash className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleList;