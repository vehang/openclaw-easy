import { useState, useEffect, useCallback } from 'react';
import { 
  Schedule, 
  ScheduleFormData, 
  ScheduleStatus, 
  SchedulePriority,
  DaySchedules,
  MonthScheduleStats,
  DailyScheduleStats,
  ScheduleStats,
  StatusCounts
} from '@/types/Schedule';
import { scheduleApi } from '@/services/scheduleApi';
import { useAuth } from '@/contexts/AuthContext';

export function useSchedule() {
  const [schedules, setSchedules] = useState<DaySchedules>({});
  const [monthStats, setMonthStats] = useState<MonthScheduleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  const { isAuthenticated } = useAuth();

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

  // 加载月度日程数据
  const loadMonthSchedules = useCallback(async (year: number, month: number, isRefresh = false) => {
    if (!isAuthenticated) {
      setError('请先登录后再使用日程功能');
      if (!isRefresh) {
        setLoading(false);
      }
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const monthData = await scheduleApi.getMonthSchedule(year, month);
      setMonthStats(monthData);
      
      // 将月度统计数据转换为日期索引格式，初始化有日程的日期
      const dateSchedules: DaySchedules = {};
      monthData.dailySchedules.forEach(dayStats => {
        const dateKey = dayStats.scheduleDate.split(' ')[0]; // 提取日期部分 "2025-07-05"
        dateSchedules[dateKey] = []; // 初始化空数组，实际日程数据需要单独加载
      });
      
      setSchedules(prev => ({ ...prev, ...dateSchedules }));

      // 加载当天的日程明细数据
      const today = new Date().toLocaleDateString('en-CA');
      if (monthData.dailySchedules.some(day => day.scheduleDate.split(' ')[0] === today)) {
        try {
          const todaySchedules = await scheduleApi.getDaySchedule(today);
          setSchedules(prev => ({
            ...prev,
            [today]: todaySchedules.items
          }));
        } catch (error) {
          console.error('加载当天日程失败:', error);
          // 不抛出错误，因为month数据已经加载成功
        }
      }
    } catch (error) {
      console.error('加载月度日程失败:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('加载日程失败');
      }
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [isAuthenticated]);

  // 加载指定日期的日程
  const loadDaySchedules = useCallback(async (date: string) => {
    if (!isAuthenticated) {
      setError('请先登录后再使用日程功能');
      return;
    }

    try {
      setError(null);
      const daySchedules = await scheduleApi.getDaySchedule(date);
      setSchedules(prev => ({
        ...prev,
        [date]: daySchedules.items
      }));
    } catch (error) {
      console.error('加载日程失败:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('加载日程失败');
      }
    }
  }, [isAuthenticated]);

  // 初始化加载当前月数据
  useEffect(() => {
    if (isAuthenticated) {
      loadMonthSchedules(currentMonth.year, currentMonth.month);
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]); // 只在认证状态变化时重新加载，月份变化由changeMonth处理

  // 添加日程
  const addSchedule = useCallback(async (data: ScheduleFormData): Promise<string> => {
    if (!isAuthenticated) {
      throw new Error('请先登录后再使用日程功能');
    }

    try {
      const newSchedule = await scheduleApi.addScheduleItem(data);
      
      setSchedules(prev => {
        const newSchedules = { ...prev };
    if (!newSchedules[data.date]) {
      newSchedules[data.date] = [];
    }
    newSchedules[data.date].push(newSchedule);
        newSchedules[data.date] = sortSchedules(newSchedules[data.date]);
        return newSchedules;
      });

      // 刷新月度数据以更新统计（不设置refreshing状态，由外部控制）
      const monthData = await scheduleApi.getMonthSchedule(currentMonth.year, currentMonth.month);
      setMonthStats(monthData);
    
      return newSchedule.id;
    } catch (error) {
      console.error('添加日程失败:', error);
      throw error;
    }
  }, [isAuthenticated, currentMonth.year, currentMonth.month, loadMonthSchedules]);

  // 更新日程
  const updateSchedule = useCallback(async (id: string, updates: Partial<Schedule>) => {
    if (!isAuthenticated) {
      throw new Error('请先登录后再使用日程功能');
    }

    try {
      const schedule = Object.values(schedules)
        .flat()
        .find(s => s.id === id);
      
      if (!schedule) {
        throw new Error('日程不存在');
      }

      const updateData: ScheduleFormData = {
        title: updates.title || schedule.title,
        description: updates.description || schedule.description,
        date: updates.date || schedule.date,
        time: updates.time || schedule.time,
        endTime: updates.endTime || schedule.endTime,
        priority: updates.priority || schedule.priority
      };

      const updatedSchedule = await scheduleApi.updateScheduleItem(id, updateData);
      
      setSchedules(prev => {
        const newSchedules = { ...prev };
        
        // 从原日期移除
        Object.keys(newSchedules).forEach(date => {
          newSchedules[date] = newSchedules[date].filter(s => s.id !== id);
          if (newSchedules[date].length === 0) {
            delete newSchedules[date];
          }
        });
        
        // 添加到新日期
        const targetDate = updatedSchedule.date;
        if (!newSchedules[targetDate]) {
          newSchedules[targetDate] = [];
          }
        newSchedules[targetDate].push(updatedSchedule);
        newSchedules[targetDate] = sortSchedules(newSchedules[targetDate]);
        
        return newSchedules;
      });

      // 刷新月度数据以更新统计（不设置refreshing状态，由外部控制）
      const monthData = await scheduleApi.getMonthSchedule(currentMonth.year, currentMonth.month);
      setMonthStats(monthData);
    } catch (error) {
      console.error('更新日程失败:', error);
      throw error;
    }
  }, [schedules, isAuthenticated, currentMonth.year, currentMonth.month]);

  // 删除日程
  const deleteSchedule = useCallback(async (id: string) => {
    if (!isAuthenticated) {
      throw new Error('请先登录后再使用日程功能');
    }

    try {
      await scheduleApi.deleteScheduleItem(id);
      
      setSchedules(prev => {
        const newSchedules = { ...prev };
    Object.keys(newSchedules).forEach(date => {
      newSchedules[date] = newSchedules[date].filter(s => s.id !== id);
        if (newSchedules[date].length === 0) {
          delete newSchedules[date];
        }
    });
        return newSchedules;
      });

      // 刷新月度数据以更新统计（不设置refreshing状态，由外部控制）
      const monthData = await scheduleApi.getMonthSchedule(currentMonth.year, currentMonth.month);
      setMonthStats(monthData);
    } catch (error) {
      console.error('删除日程失败:', error);
      throw error;
    }
  }, [isAuthenticated, currentMonth.year, currentMonth.month]);

  // 更新日程状态
  const updateScheduleStatus = useCallback(async (id: string, status: ScheduleStatus) => {
    if (!isAuthenticated) {
      throw new Error('请先登录后再使用日程功能');
    }

    try {
      await scheduleApi.updateScheduleStatus(id, status);
      
      setSchedules(prev => {
        const newSchedules = { ...prev };
        Object.keys(newSchedules).forEach(date => {
          newSchedules[date] = newSchedules[date].map(s => 
            s.id === id ? { ...s, status, updatedAt: new Date().toISOString() } : s
          );
          // 重新排序
          newSchedules[date] = sortSchedules(newSchedules[date]);
        });
        return newSchedules;
      });

      // 刷新月度数据以更新统计（不设置refreshing状态，由外部控制）
      const monthData = await scheduleApi.getMonthSchedule(currentMonth.year, currentMonth.month);
      setMonthStats(monthData);
    } catch (error) {
      console.error('更新状态失败:', error);
      throw error;
    }
  }, [isAuthenticated, currentMonth.year, currentMonth.month]);

  // 一键完成日程
  const completeSchedule = useCallback(async (id: string) => {
    await updateScheduleStatus(id, ScheduleStatus.COMPLETED);
  }, [updateScheduleStatus]);

  // 获取指定日期的日程
  const getSchedulesByDate = useCallback((date: string): Schedule[] => {
    return schedules[date] || [];
  }, [schedules]);

  // 获取今天的日程
  const getTodaySchedules = useCallback((): Schedule[] => {
    const today = new Date().toLocaleDateString('en-CA');
    return getSchedulesByDate(today);
  }, [getSchedulesByDate]);

  // 获取有日程的日期列表（从月度统计数据中获取）
  const getScheduleDates = useCallback((): string[] => {
    if (!monthStats) return [];
    return monthStats.dailySchedules.map(day => day.scheduleDate.split(' ')[0]);
  }, [monthStats]);

  // 获取状态统计（从月度统计数据中计算）
  const getStatusCounts = useCallback((date?: string): ScheduleStats => {
    if (date) {
      // 获取指定日期的统计
      const dayStats = monthStats?.dailySchedules.find(
        day => day.scheduleDate.split(' ')[0] === date
      );
      
      if (dayStats) {
        return {
          total: dayStats.totalCount,
          pending: dayStats.statusCounts["0"] || 0,
          inProgress: dayStats.statusCounts["1"] || 0,
          completed: dayStats.statusCounts["2"] || 0,
          overdue: dayStats.statusCounts["3"] || 0,
          cancelled: dayStats.statusCounts["4"] || 0
        };
      }
      return { total: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0, cancelled: 0 };
    }
    
    // 获取月度汇总统计
    if (monthStats) {
    return {
        total: monthStats.totalCount,
        pending: monthStats.dailySchedules.reduce((sum, day) => sum + (day.statusCounts["0"] || 0), 0),
        inProgress: monthStats.dailySchedules.reduce((sum, day) => sum + (day.statusCounts["1"] || 0), 0),
        completed: monthStats.completedCount,
        overdue: monthStats.dailySchedules.reduce((sum, day) => sum + (day.statusCounts["3"] || 0), 0),
        cancelled: monthStats.dailySchedules.reduce((sum, day) => sum + (day.statusCounts["4"] || 0), 0)
      };
    }
    
    return { total: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0, cancelled: 0 };
  }, [monthStats]);

  // 切换月份
  const changeMonth = useCallback((year: number, month: number) => {
    // 立即加载新月份的数据，使用refreshing状态
    loadMonthSchedules(year, month, true);
    // 更新当前月份状态
    setCurrentMonth({ year, month });
  }, [loadMonthSchedules]);

  // 刷新指定日期的日程
  const refreshDaySchedules = useCallback(async (date: string) => {
    setRefreshing(true);
    try {
      await loadDaySchedules(date);
    } finally {
      setRefreshing(false);
    }
  }, [loadDaySchedules]);

  return {
    schedules,
    monthStats,
    loading,
    refreshing,
    setRefreshing,
    error,
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
  };
}