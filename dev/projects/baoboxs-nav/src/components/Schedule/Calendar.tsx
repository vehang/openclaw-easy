'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { MonthScheduleStats } from '@/types/Schedule';

interface CalendarProps {
  monthStats: MonthScheduleStats | null;
  selectedDate: string;
  onDateSelect: (date: string) => void;
  onMonthChange?: (year: number, month: number) => void;
}

const Calendar: React.FC<CalendarProps> = ({ 
  monthStats, 
  selectedDate, 
  onDateSelect,
  onMonthChange
}) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const today = new Date().toLocaleDateString('en-CA'); // 使用 YYYY-MM-DD 格式的本地日期

  // 同步当前月份与monthStats
  useEffect(() => {
    if (monthStats) {
      const [year, month] = monthStats.yearMonth.split('-').map(Number);
      const newMonth = new Date(year, month - 1, 1);
      setCurrentMonth(newMonth);
    }
  }, [monthStats]);

  // 获取有日程的日期列表
  const scheduleDates = useMemo(() => {
    if (!monthStats) return [];
    return monthStats.dailySchedules.map(day => day.scheduleDate.split(' ')[0]);
  }, [monthStats]);

  // 获取月份信息
  const monthInfo = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // 本月第一天
    const firstDay = new Date(year, month, 1);
    // 本月最后一天
    const lastDay = new Date(year, month + 1, 0);
    // 本月第一天是星期几（0=周日）
    const firstDayOfWeek = firstDay.getDay();
    // 本月天数
    const daysInMonth = lastDay.getDate();
    
    // 上月的日期填充
    const prevMonth = new Date(year, month - 1, 0);
    const daysInPrevMonth = prevMonth.getDate();
    
    const days = [];
    
    // 添加上月的日期（灰色显示）
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const date = new Date(year, month - 1, day);
      days.push({
        date: date.toLocaleDateString('en-CA'), // 使用本地日期格式
        day,
        isCurrentMonth: false,
        isPrev: true
      });
    }
    
    // 添加本月的日期
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        date: date.toLocaleDateString('en-CA'), // 使用本地日期格式
        day,
        isCurrentMonth: true,
        isPrev: false
      });
    }
    
    // 添加下月的日期填充（如果需要）
    const remainingDays = 42 - days.length; // 6行 x 7天
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date: date.toLocaleDateString('en-CA'), // 使用本地日期格式
        day,
        isCurrentMonth: false,
        isPrev: false
      });
    }
    
    return {
      year,
      month,
      monthName: firstDay.toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: 'long' 
      }),
      days
    };
  }, [currentMonth]);

  // 上一个月
  const goToPrevMonth = useCallback(() => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    setCurrentMonth(newMonth);
    // 直接调用onMonthChange，不依赖useEffect
    if (onMonthChange) {
      onMonthChange(newMonth.getFullYear(), newMonth.getMonth() + 1);
    }
  }, [currentMonth, onMonthChange]);

  // 下一个月
  const goToNextMonth = useCallback(() => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    setCurrentMonth(newMonth);
    // 直接调用onMonthChange，不依赖useEffect
    if (onMonthChange) {
      onMonthChange(newMonth.getFullYear(), newMonth.getMonth() + 1);
    }
  }, [currentMonth, onMonthChange]);

  // 回到今天
  const goToToday = useCallback(() => {
    const today = new Date();
    const newMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    setCurrentMonth(newMonth);
    onDateSelect(today.toLocaleDateString('en-CA')); // 使用本地日期格式
    // 直接调用onMonthChange，不依赖useEffect
    if (onMonthChange) {
      onMonthChange(today.getFullYear(), today.getMonth() + 1);
    }
  }, [onDateSelect, onMonthChange]);

  // 获取日期的样式类
  const getDayClasses = (dayInfo: any) => {
    const baseClasses = 'w-10 h-10 flex items-center justify-center text-sm cursor-pointer rounded-lg transition-all duration-200';
    const { date, isCurrentMonth } = dayInfo;
    
    // 基础样式
    let classes = baseClasses;
    
    if (!isCurrentMonth) {
      // 非当前月的日期
      classes += ' text-gray-300 hover:bg-gray-100';
    } else {
      // 当前月的日期
      if (date === today) {
        // 今天
        classes += ' bg-teal-500 text-white font-semibold';
      } else if (date === selectedDate) {
        // 选中的日期
        classes += ' bg-teal-100 text-teal-700 font-semibold border-2 border-teal-500';
      } else if (date < today) {
        // 过去的日期
        classes += ' text-gray-600 hover:bg-gray-100';
      } else {
        // 未来的日期
        classes += ' text-gray-800 hover:bg-gray-100';
      }
    }
    
    // 有日程的日期添加标记
    if (scheduleDates.includes(date)) {
      classes += ' relative';
    }
    
    return classes;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* 头部 - 月份导航 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPrevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FaChevronLeft className="text-gray-600" />
        </button>
        
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-800">
            {monthInfo.monthName}
          </h2>
        </div>
        
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FaChevronRight className="text-gray-600" />
        </button>
      </div>

      {/* 回到今天按钮 */}
      <div className="flex justify-center mb-4">
        <button
          onClick={goToToday}
          className="px-3 py-1 text-sm bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors"
        >
          今天
        </button>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 mb-2">
        {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* 日期网格 */}
      <div className="grid grid-cols-7 gap-1">
        {monthInfo.days.map((dayInfo, index) => (
          <div
            key={`${dayInfo.date}-${index}`}
            className={getDayClasses(dayInfo)}
            onClick={() => {
              // 如果点击的是上个月或下个月的日期，自动切换到对应月份
              if (!dayInfo.isCurrentMonth) {
                const clickedDate = new Date(dayInfo.date);
                const newMonth = new Date(clickedDate.getFullYear(), clickedDate.getMonth(), 1);
                setCurrentMonth(newMonth);
                if (onMonthChange) {
                  onMonthChange(newMonth.getFullYear(), newMonth.getMonth() + 1);
                }
              }
              onDateSelect(dayInfo.date);
            }}
          >
            <span>{dayInfo.day}</span>
            {/* 有日程的标记点 */}
            {scheduleDates.includes(dayInfo.date) && (
              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
            )}
          </div>
        ))}
      </div>

      {/* 图例 */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
            <span>今天</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-teal-100 border border-teal-500 rounded-full"></div>
            <span>选中</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-100 rounded-full relative">
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-teal-500 rounded-full"></div>
            </div>
            <span>有日程</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;