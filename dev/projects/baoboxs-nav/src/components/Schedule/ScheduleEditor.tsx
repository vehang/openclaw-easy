'use client';

import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaPlus } from 'react-icons/fa';
import { 
  Schedule, 
  ScheduleFormData, 
  SchedulePriority,
  SCHEDULE_PRIORITY_LABELS 
} from '@/types/Schedule';

interface ScheduleEditorProps {
  isOpen: boolean;
  schedule?: Schedule | null;
  defaultDate?: string;
  onClose: () => void;
  onSave: (data: ScheduleFormData) => void;
}

const ScheduleEditor: React.FC<ScheduleEditorProps> = ({
  isOpen,
  schedule,
  defaultDate,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<ScheduleFormData>({
    title: '',
    description: '',
    date: defaultDate || new Date().toLocaleDateString('en-CA'),
    time: '',
    endTime: '',
    priority: SchedulePriority.MEDIUM
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [endTimeManuallySet, setEndTimeManuallySet] = useState(false);

  // 获取当前时间（用于默认时间）
  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // 计算结束时间（开始时间+1小时）
  const calculateEndTime = (startTime: string) => {
    if (!startTime) return '';
    
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 加1小时
    const endHours = endDate.getHours().toString().padStart(2, '0');
    const endMinutes = endDate.getMinutes().toString().padStart(2, '0');
    
    return `${endHours}:${endMinutes}`;
  };

  // 验证时间逻辑
  const validateTimeLogic = (startTime: string, endTime: string | undefined): string | null => {
    if (!startTime || !endTime) return null;
    
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const startTotal = startHours * 60 + startMinutes;
    const endTotal = endHours * 60 + endMinutes;
    
    if (endTotal <= startTotal) {
      return '结束时间必须晚于开始时间';
    }
    
    return null;
  };

  // 当编辑的日程改变时，更新表单数据
  useEffect(() => {
    if (schedule) {
      // 编辑模式：回填原数据
      setFormData({
        title: schedule.title,
        description: schedule.description || '',
        date: schedule.date,
        time: schedule.time,
        endTime: schedule.endTime || calculateEndTime(schedule.time),
        priority: schedule.priority
      });
      setEndTimeManuallySet(!!schedule.endTime);
    } else {
      // 新增模式：设置默认值
      const currentTime = getCurrentTime();
      const endTime = calculateEndTime(currentTime);
      setFormData({
        title: '',
        description: '',
        date: defaultDate || new Date().toLocaleDateString('en-CA'),
        time: currentTime,
        endTime: endTime,
        priority: SchedulePriority.MEDIUM
      });
      setEndTimeManuallySet(false);
    }
  }, [schedule, defaultDate]);

  // 当开始时间改变时，自动设置结束时间（如果用户没有手动设置过）
  useEffect(() => {
    if (!endTimeManuallySet && formData.time) {
      const newEndTime = calculateEndTime(formData.time);
      setFormData(prev => ({
        ...prev,
        endTime: newEndTime
      }));
    }
  }, [formData.time, endTimeManuallySet]);

  // 重置表单
  const resetForm = () => {
    const currentTime = getCurrentTime();
    const endTime = calculateEndTime(currentTime);
    setFormData({
      title: '',
      description: '',
      date: defaultDate || new Date().toLocaleDateString('en-CA'),
      time: currentTime,
      endTime: endTime,
      priority: SchedulePriority.MEDIUM
    });
    setErrors({});
    setEndTimeManuallySet(false);
  };

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '请输入日程标题';
    }

    if (!formData.date) {
      newErrors.date = '请选择日期';
    }

    if (!formData.time) {
      newErrors.time = '请选择开始时间';
    }

    if (!formData.endTime) {
      newErrors.endTime = '请选择结束时间';
    }

    // 验证时间逻辑
    const timeError = validateTimeLogic(formData.time, formData.endTime);
    if (timeError) {
      newErrors.endTime = timeError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
      resetForm();
      onClose();
    }
  };

  // 处理关闭
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // 处理开始时间变化
  const handleStartTimeChange = (time: string) => {
    setFormData(prev => ({ ...prev, time }));
  };

  // 处理结束时间变化
  const handleEndTimeChange = (endTime: string) => {
    setEndTimeManuallySet(true);
    setFormData(prev => ({ ...prev, endTime }));
  };

  // 设置当前时间
  const setCurrentTime = () => {
    const currentTime = getCurrentTime();
    const endTime = calculateEndTime(currentTime);
    setFormData(prev => ({
      ...prev,
      time: currentTime,
      endTime: endTime
    }));
    setEndTimeManuallySet(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            {schedule ? '编辑日程' : '添加日程'}
          </h3>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* 标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="请输入日程标题"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="请输入日程描述（可选）"
            />
          </div>

          {/* 日期 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.date ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date}</p>
              )}
            </div>

          {/* 时间 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                开始时间 <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-2">
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    errors.time ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={setCurrentTime}
                  className="px-2 py-2 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                  title="设为当前时间"
                >
                  现在
                </button>
              </div>
              {errors.time && (
                <p className="mt-1 text-sm text-red-600">{errors.time}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                结束时间 <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.endTime ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.endTime && (
                <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>
              )}
            </div>
          </div>

          {/* 优先级 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              优先级
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as SchedulePriority }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {Object.values(SchedulePriority).map(priority => (
                <option key={priority} value={priority}>
                  {SCHEDULE_PRIORITY_LABELS[priority]}
                </option>
              ))}
            </select>
          </div>

          {/* 按钮 */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors flex items-center space-x-2"
            >
              {schedule ? <FaSave className="w-4 h-4" /> : <FaPlus className="w-4 h-4" />}
              <span>{schedule ? '保存' : '添加'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleEditor;