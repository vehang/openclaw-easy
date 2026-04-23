import { Schedule, ScheduleFormData, ScheduleStatus, SchedulePriority, MonthScheduleStats } from '@/types/Schedule';
import { STORAGE_KEYS } from '@/constants/storage';

// API响应接口
interface ApiResponse<T> {
  code: number;
  errorMsg: string;
  currentTime: number;
  data: T;
}

// 日程日DTO接口 - 根据实际后端返回调整
interface ScheduleDayDto {
  scheduleDate: string;
  statusCounts: { [key: string]: number };
  totalCount: number;
  items: ScheduleItemDto[];
}

// 日程明细DTO接口
interface ScheduleItemDto {
  id: number;
  userId: number;
  dayId: number;
  title: string;
  content?: string;
  status: number;
  priority: number;
  startTime: string;
  endTime?: string;
  createTime: string;
  updateTime: string;
}

// 月度日程DTO接口 - 根据实际后端返回调整
interface ScheduleMonthDto {
  yearMonth: string;
  totalCount: number;
  completedCount: number;
  dailySchedules: {
    scheduleDate: string;
    statusCounts: { [key: string]: number };
    totalCount: number;
  }[];
}

// 请求接口 - 与数据库字段保持一致
interface AddScheduleItemRequest {
  title: string;
  content?: string;
  priority: number;
  startTime: string;
  endTime?: string;
}

interface UpdateScheduleItemRequest {
  id: number;
  title: string;
  content?: string;
  priority: number;
  startTime: string;
  endTime?: string;
}

interface DeleteScheduleItemRequest {
  id: number;
}

interface UpdateStatusRequest {
  id: number;
  status: number;
}

interface QueryDayScheduleRequest {
  date: string;
}

interface QueryMonthScheduleRequest {
  year: number;
  month: number;
}

// 状态映射
const STATUS_MAP: Record<number, ScheduleStatus> = {
  0: ScheduleStatus.PENDING,
  1: ScheduleStatus.IN_PROGRESS,
  2: ScheduleStatus.COMPLETED,
  3: ScheduleStatus.OVERDUE,
  4: ScheduleStatus.CANCELLED
};

const PRIORITY_MAP: Record<number, SchedulePriority> = {
  0: SchedulePriority.LOW,
  1: SchedulePriority.MEDIUM,
  2: SchedulePriority.HIGH,
  3: SchedulePriority.URGENT
};

// 格式化日期时间为 yyyy-MM-dd HH:mm:ss
function formatDateTime(date: string, time: string): string {
  return `${date} ${time}:00`;
}

// 从ISO格式转换为 yyyy-MM-dd HH:mm:ss
function formatToDateTimeString(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 转换后端数据为前端格式
function convertScheduleItem(dto: ScheduleItemDto): Schedule {
  const startDateTime = new Date(dto.startTime);
  const date = startDateTime.toLocaleDateString('en-CA');
  const time = startDateTime.toTimeString().slice(0, 5);
  
  // 处理结束时间
  let endTime: string | undefined;
  if (dto.endTime) {
    const endDateTime = new Date(dto.endTime);
    endTime = endDateTime.toTimeString().slice(0, 5);
  }
  
  return {
    id: dto.id.toString(),
    title: dto.title,
    description: dto.content,
    date,
    time,
    endTime,
    status: STATUS_MAP[dto.status as keyof typeof STATUS_MAP] || 'pending',
    priority: PRIORITY_MAP[dto.priority as keyof typeof PRIORITY_MAP] || 'medium',
    createdAt: dto.createTime,
    updatedAt: dto.updateTime
  };
}

// 转换前端数据为后端格式
function convertToBackendFormat(data: ScheduleFormData): AddScheduleItemRequest {
  const priorityNumber = Object.entries(PRIORITY_MAP).find(([_, value]) => value === data.priority)?.[0] || '1';
  
  // 构建开始时间，格式为 yyyy-MM-dd HH:mm:ss
  const startTime = formatDateTime(data.date, data.time);
  
  // 构建结束时间
  let endTime: string | undefined;
  if (data.endTime) {
    endTime = formatDateTime(data.date, data.endTime);
  } else {
    // 如果没有设置结束时间，默认开始时间+1小时
    const startDateTime = new Date(startTime);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 默认1小时
    endTime = formatToDateTimeString(endDateTime.toISOString());
  }
  
  return {
    title: data.title,
    content: data.description,
    priority: parseInt(priorityNumber),
    startTime,
    endTime
  };
}

// 获取认证headers
function getAuthHeaders(): HeadersInit {
  let token: string | null = null;
  
  // 从localStorage获取用户数据
  if (typeof window !== 'undefined') {
    const userDataStr = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        token = userData.accessToken;
      } catch (error) {
        console.error('解析用户数据失败:', error);
      }
    }
  }
  
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
}

// 日程API服务
export const scheduleApi = {
  // 添加日程明细
  async addScheduleItem(data: ScheduleFormData): Promise<Schedule> {
    const requestData = convertToBackendFormat(data);
    
    const response = await fetch('/api/utility/proxy/schedule/item/add', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(requestData),
    });

    const result: ApiResponse<ScheduleItemDto> = await response.json();
    
    if (result.code !== 0) {
      throw new Error(result.errorMsg || '添加日程失败');
    }

    return convertScheduleItem(result.data);
  },

  // 更新日程明细
  async updateScheduleItem(id: string, data: ScheduleFormData): Promise<Schedule> {
    const priorityNumber = Object.entries(PRIORITY_MAP).find(([_, value]) => value === data.priority)?.[0] || '1';
    
    // 构建开始时间，格式为 yyyy-MM-dd HH:mm:ss
    const startTime = formatDateTime(data.date, data.time);
    
    // 构建结束时间
    let endTime: string | undefined;
    if (data.endTime) {
      endTime = formatDateTime(data.date, data.endTime);
    } else {
      // 如果没有设置结束时间，默认开始时间+1小时
      const startDateTime = new Date(startTime);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 默认1小时
      endTime = formatToDateTimeString(endDateTime.toISOString());
    }
    
    const requestData: UpdateScheduleItemRequest = {
      id: parseInt(id),
      title: data.title,
      content: data.description,
      priority: parseInt(priorityNumber),
      startTime,
      endTime
    };
    
    const response = await fetch('/api/utility/proxy/schedule/item/update', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(requestData),
    });

    const result: ApiResponse<ScheduleItemDto> = await response.json();
    
    if (result.code !== 0) {
      throw new Error(result.errorMsg || '更新日程失败');
    }

    return convertScheduleItem(result.data);
  },

  // 删除日程明细
  async deleteScheduleItem(id: string): Promise<void> {
    const requestData: DeleteScheduleItemRequest = {
      id: parseInt(id)
    };
    
    const response = await fetch('/api/utility/proxy/schedule/item/delete', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(requestData),
    });

    const result: ApiResponse<void> = await response.json();
    
    if (result.code !== 0) {
      throw new Error(result.errorMsg || '删除日程失败');
    }
  },

  // 更新日程状态
  async updateScheduleStatus(id: string, status: ScheduleStatus): Promise<void> {
    const statusCode = Object.entries(STATUS_MAP).find(([_, value]) => value === status)?.[0] || '0';
    
    const requestData: UpdateStatusRequest = {
      id: parseInt(id),
      status: parseInt(statusCode)
    };
    
    const response = await fetch('/api/utility/proxy/schedule/item/status', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(requestData),
    });

    const result: ApiResponse<void> = await response.json();
    
    if (result.code !== 0) {
      throw new Error(result.errorMsg || '更新状态失败');
    }
  },

  // 获取指定日期的日程信息
  async getDaySchedule(date: string): Promise<{ items: Schedule[] }> {
    const requestData: QueryDayScheduleRequest = {
      date
    };
    
    const response = await fetch('/api/utility/proxy/schedule/day', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(requestData),
    });

    const result: ApiResponse<ScheduleDayDto> = await response.json();
    
    if (result.code !== 0) {
      throw new Error(result.errorMsg || '获取日程信息失败');
    }

    return {
      items: result.data.items ? result.data.items.map(convertScheduleItem) : []
    };
  },

  // 获取指定月份的日程概览
  async getMonthSchedule(year: number, month: number): Promise<MonthScheduleStats> {
    const requestData: QueryMonthScheduleRequest = {
      year,
      month
    };
    
    const response = await fetch('/api/utility/proxy/schedule/month', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(requestData),
    });

    const result: ApiResponse<ScheduleMonthDto> = await response.json();
    
    if (result.code !== 0) {
      throw new Error(result.errorMsg || '获取月度日程失败');
    }

    return {
      yearMonth: result.data.yearMonth,
      totalCount: result.data.totalCount,
      completedCount: result.data.completedCount,
      dailySchedules: result.data.dailySchedules.map(day => ({
        scheduleDate: day.scheduleDate,
        statusCounts: {
          "0": day.statusCounts["0"] || 0,
          "1": day.statusCounts["1"] || 0,
          "2": day.statusCounts["2"] || 0,
          "3": day.statusCounts["3"] || 0,
          "4": day.statusCounts["4"] || 0
        },
        totalCount: day.totalCount
      }))
    };
  }
}; 