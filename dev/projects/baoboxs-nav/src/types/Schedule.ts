export interface Schedule {
    id: string;
    title: string;
    description?: string;
    date: string; // YYYY-MM-DD格式
    time: string; // HH:MM格式
    endTime?: string; // HH:MM格式，结束时间
    status: ScheduleStatus;
    priority: SchedulePriority;
    createdAt: string;
    updatedAt: string;
  }
  
  export enum ScheduleStatus {
    PENDING = 'pending',     // 待处理
    IN_PROGRESS = 'in_progress', // 进行中
    COMPLETED = 'completed', // 已完成
    OVERDUE = 'overdue',     // 已超时
    CANCELLED = 'cancelled'   // 已取消
  }
  
  export enum SchedulePriority {
    LOW = 'low',
    MEDIUM = 'medium', 
    HIGH = 'high',
    URGENT = 'urgent'
  }
  
  export interface ScheduleFormData {
    title: string;
    description?: string;
    date: string;
    time: string;
    endTime?: string; // 结束时间，可选
    priority: SchedulePriority;
  }
  
  export interface DaySchedules {
    [date: string]: Schedule[];
  }

  // 状态统计接口
  export interface StatusCounts {
    "0": number; // 待处理
    "1": number; // 进行中
    "2": number; // 已完成
    "3": number; // 已超时
    "4": number; // 已取消
  }

  // 每日日程统计
  export interface DailyScheduleStats {
    scheduleDate: string; // "2025-07-05 00:00:00"
    statusCounts: StatusCounts;
    totalCount: number;
  }

  // 月度日程统计
  export interface MonthScheduleStats {
    yearMonth: string; // "2025-07"
    totalCount: number;
    completedCount: number;
    dailySchedules: DailyScheduleStats[];
  }

  // 通用状态统计
  export interface ScheduleStats {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
    cancelled: number;
  }
  
  // 状态颜色配置
  export const SCHEDULE_STATUS_COLORS = {
    [ScheduleStatus.PENDING]: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-300',
      badge: 'bg-blue-500'
    },
    [ScheduleStatus.IN_PROGRESS]: {
      bg: 'bg-teal-50',
      text: 'text-teal-700',
      border: 'border-teal-300',
      badge: 'bg-teal-500'
    },
    [ScheduleStatus.COMPLETED]: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-300',
      badge: 'bg-green-500'
    },
    [ScheduleStatus.OVERDUE]: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-300',
      badge: 'bg-red-500'
    },
    [ScheduleStatus.CANCELLED]: {
      bg: 'bg-gray-50',
      text: 'text-gray-500',
      border: 'border-gray-200',
      badge: 'bg-gray-400'
    }
  };
  
  // 优先级颜色配置
  export const SCHEDULE_PRIORITY_COLORS = {
    [SchedulePriority.LOW]: 'text-green-600',
    [SchedulePriority.MEDIUM]: 'text-yellow-600',
    [SchedulePriority.HIGH]: 'text-orange-600',
    [SchedulePriority.URGENT]: 'text-red-600'
  };
  
  // 状态中文名称
  export const SCHEDULE_STATUS_LABELS = {
    [ScheduleStatus.PENDING]: '待处理',
    [ScheduleStatus.IN_PROGRESS]: '进行中',
    [ScheduleStatus.COMPLETED]: '已完成',
    [ScheduleStatus.OVERDUE]: '已超时',
    [ScheduleStatus.CANCELLED]: '已取消'
  };
  
  // 优先级中文名称
  export const SCHEDULE_PRIORITY_LABELS = {
    [SchedulePriority.LOW]: '低',
    [SchedulePriority.MEDIUM]: '中',
    [SchedulePriority.HIGH]: '高',
    [SchedulePriority.URGENT]: '急'
  };