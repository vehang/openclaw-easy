import { WeatherInfo } from '@/types/WeatherInfo';
import { localStorageUtils } from '@/utils/localStorage';

/**
 * 天气服务 - 使用后台代理接口
 * 
 * 缓存策略：
 * - 使用后台代理接口 /api/utility/proxy/weather/current
 * - 20分钟缓存
 */

// 后台天气API响应接口
interface BackendWeatherResponse {
  code: number;
  errorMsg: string;
  currentTime: number;
  data: {
    city: string;
    today: {
      date: string;
      week: string;
      weather: string;
      temperature: string;
      tempHigh: string;
      tempLow: string;
      windDirection: string;
      windPower: string;
      windDesc: string;
      airQuality: string;
    };
    forecast: Array<{
      date: string;
      week: string;
      weather: string;
      temperature: string;
      tempHigh: string;
      tempLow: string;
      windDirection: string;
      windPower: string;
      windDesc: string;
      airQuality: string;
    }>;
    success: boolean;
  };
}

// 扩展的天气信息接口，包含未来几天数据
interface ExtendedWeatherInfo extends WeatherInfo {
  futureWeather?: Array<{
    date: string;
    week: string;
    weather: string;
    temperature: string;
    tempHigh: string;
    tempLow: string;
    windDirection: string;
    windPower: string;
    windDesc: string;
    airQuality: string;
  }>;
  updateTime?: string;
}

// 天气缓存key常量定义
const WEATHER_CACHE_KEYS = {
  // 天气数据缓存前缀
  CACHE_PREFIX: 'weather.cache',
  // 失败记录前缀
  FAILURE_PREFIX: 'weather.failure',

  // 生成后台代理缓存key
  backendCache: (city?: string) => `weather.cache.backend.${city || 'auto'}`,
  // 生成后台代理失败记录key
  backendFailure: (city?: string) => `weather.failure.backend.${city || 'auto'}`,
} as const;

// 天气服务类
class WeatherService {
  private readonly CACHE_TIME = 20 * 60 * 1000; // 20分钟缓存
  private readonly BASE_RETRY_INTERVAL = 5 * 60 * 1000; // 基础重试间隔5分钟
  private readonly MAX_RETRY_INTERVAL = 30 * 60 * 1000; // 最大重试间隔30分钟
  private readonly DEFAULT_WEATHER: WeatherInfo = {
    temperature: '--°C',
    condition: '未知',
    fengxiang: '',
    icon: '',
    windSpeed: '',
    humidity: '',
    city: '',
    airQuality: {
      aqi: 0,
      level: 0,
      name: '',
      pm25: '',
    }
  };

  // 使用后台代理接口获取天气信息
  public async getWeatherByBackend(city?: string, retryCount: number = 0): Promise<ExtendedWeatherInfo> {
    const cacheKey = WEATHER_CACHE_KEYS.backendCache(city);

    // 检查缓存（20分钟缓存）
    const cached = this.getFromCacheWithCustomTime<ExtendedWeatherInfo>(cacheKey, this.CACHE_TIME);
    if (cached) {
      console.log('使用缓存的天气数据:', cached);
      return cached;
    }

    const maxRetries = 2;
    const timeoutMs = Math.min(10000 + retryCount * 3000, 20000); // 递增超时时间

    try {
      // 使用后台代理接口
      const url = city
        ? `/api/utility/proxy/weather/current?city=${encodeURIComponent(city)}`
        : '/api/utility/proxy/weather/current';

      console.log(`调用后台天气代理API (第${retryCount + 1}次尝试, 超时${timeoutMs}ms):`, url);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorMsg = `后台天气API HTTP错误: ${response.status} ${response.statusText}`;
        if (retryCount < maxRetries && response.status >= 500) {
          console.warn(`${errorMsg}, 将重试...`);
          await this.delay(2000 * (retryCount + 1)); // 递增延迟
          return this.getWeatherByBackend(city, retryCount + 1);
        }
        throw new Error(errorMsg);
      }

      const data: BackendWeatherResponse = await response.json();
      console.log('后台天气API 响应:', data);

      if (data.code !== 0) {
        const errorMsg = `后台天气API业务错误: code=${data.code}, msg=${data.errorMsg}`;
        if (retryCount < maxRetries) {
          console.warn(`${errorMsg}, 将重试...`);
          await this.delay(2000 * (retryCount + 1));
          return this.getWeatherByBackend(city, retryCount + 1);
        }
        throw new Error(errorMsg);
      }

      if (!data.data || !data.data.success) {
        throw new Error('后台天气API返回数据无效');
      }

      const { today, forecast } = data.data;

      const weatherInfo: ExtendedWeatherInfo = {
        temperature: today.temperature,
        condition: today.weather,
        fengxiang: today.windDirection,
        icon: this.getIconUrlForCondition(today.weather),
        windSpeed: today.windDesc,
        humidity: `空气质量: ${today.airQuality}`,
        city: data.data.city,
        airQuality: {
          aqi: 0,
          level: this.getAirQualityLevel(today.airQuality),
          name: today.airQuality,
          pm25: '',
        },
        // 扩展信息
        futureWeather: forecast,
        updateTime: new Date(data.currentTime * 1000).toLocaleString()
      };

      // 验证天气数据完整性：只有成功获取到位置和天气信息时才缓存
      if (this.isWeatherDataValid(weatherInfo)) {
        // 保存到缓存（20分钟）
        this.saveToCache(cacheKey, weatherInfo);
        console.log('✅ 天气数据有效，已缓存:', cacheKey);
      } else {
        console.warn('⚠️ 天气数据不完整（缺少位置或天气信息），不进行缓存，方便后续重试获取最新数据');
      }

      return weatherInfo;

    } catch (error) {
      console.error('后台天气API失败:', error);
      throw error;
    }
  }

  // 主要获取天气信息的方法（使用后台代理接口）
  async getWeatherInfo(city?: string): Promise<WeatherInfo> {
    console.log(`🌤️ 开始获取天气信息，城市: ${city || '自动识别'}`);

    // 1. 先检查是否有有效的缓存数据
    const backendCacheKey = WEATHER_CACHE_KEYS.backendCache(city);
    const backendCached = this.getFromCacheWithCustomTime<ExtendedWeatherInfo>(backendCacheKey, this.CACHE_TIME);
    if (backendCached) {
      console.log('📦 使用缓存的天气数据');
      return backendCached;
    }

    // 2. 缓存不存在或已过期，检查是否可以重试
    const shouldTryBackend = this.shouldTryBackend(city);
    if (shouldTryBackend) {
      try {
        console.log('🚀 调用后台天气代理接口...');
        const weather = await this.getWeatherByBackend(city);
        this.markBackendSuccess(city);
        console.log('✅ 后台天气API调用成功');
        return weather;
      } catch (backendError) {
        console.warn('❌ 后台天气API失败，记录失败时间:', backendError);
        this.markBackendFailure(city);
      }
    } else {
      console.log('⏳ 后台天气API暂时不可用，等待重试间隔结束');
    }

    console.error('❌ 天气API调用失败，返回默认数据');
    return { ...this.DEFAULT_WEATHER, city: city || '未知' };
  }

  // 后台代理接口重试逻辑相关私有方法
  private shouldTryBackend(city?: string): boolean {
    const failureKey = WEATHER_CACHE_KEYS.backendFailure(city);
    const lastFailure = localStorageUtils.getItem(failureKey, null) as { timestamp: number; city: string; failureCount?: number } | null;

    if (!lastFailure) {
      console.log('后台API重试检查: 无失败记录，尝试后台接口');
      return true; // 没有失败记录，尝试后台接口
    }

    const now = Date.now();
    const timeSinceFailure = now - lastFailure.timestamp;
    // 使用指数退避算法计算重试间隔
    const failureCount = lastFailure.failureCount || 1;
    const retryInterval = Math.min(
      this.BASE_RETRY_INTERVAL * Math.pow(2, failureCount - 1),
      this.MAX_RETRY_INTERVAL
    );
    const shouldRetry = timeSinceFailure >= retryInterval;

    console.log(`后台API重试检查: 上次失败时间=${new Date(lastFailure.timestamp).toLocaleString()}, 已过去=${Math.round(timeSinceFailure / 60000)}分钟, 失败次数=${failureCount}, 重试间隔=${Math.round(retryInterval / 60000)}分钟, 是否重试=${shouldRetry}`);

    return shouldRetry;
  }

  private markBackendSuccess(city?: string): void {
    const failureKey = WEATHER_CACHE_KEYS.backendFailure(city);
    // 清除失败记录
    localStorageUtils.removeItem(failureKey);
    console.log(`后台天气API调用成功，清除失败记录 [${failureKey}]`);
  }

  private markBackendFailure(city?: string): void {
    const failureKey = WEATHER_CACHE_KEYS.backendFailure(city);
    const existingFailure = localStorageUtils.getItem(failureKey, null) as { timestamp: number; city: string; failureCount?: number } | null;

    const failureRecord = {
      timestamp: Date.now(),
      city: city || 'auto',
      failureCount: (existingFailure?.failureCount || 0) + 1
    };

    // 记录失败时间和次数
    localStorageUtils.setItem(failureKey, failureRecord);

    const nextRetryInterval = Math.min(
      this.BASE_RETRY_INTERVAL * Math.pow(2, failureRecord.failureCount - 1),
      this.MAX_RETRY_INTERVAL
    );

    console.log(`记录后台天气API失败 [${failureKey}]: 第${failureRecord.failureCount}次失败，${Math.round(nextRetryInterval / (60 * 1000))}分钟后重试`);
  }

  // 延迟工具方法
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 缓存相关私有方法
  private getFromCache<T>(key: string): T | null {
    try {
      const cached = localStorageUtils.getItem(key, null);
      if (!cached) return null;

      const { data, timestamp } = cached;
      const now = Date.now();

      if (now - timestamp < this.CACHE_TIME) {
        console.log(`使用缓存数据 [${key}]: ${Math.round((this.CACHE_TIME - (now - timestamp)) / 60000)}分钟后过期`);
        return data;
      }

      // 缓存过期，删除
      console.log(`缓存已过期，删除 [${key}]`);
      localStorageUtils.removeItem(key);
      return null;
    } catch (error) {
      console.error(`获取缓存失败 [${key}]:`, error);
      return null;
    }
  }

  // 支持自定义缓存时间的缓存获取方法
  private getFromCacheWithCustomTime<T>(key: string, cacheTime: number): T | null {
    try {
      const cached = localStorageUtils.getItem(key, null);
      if (!cached) return null;

      const { data, timestamp } = cached;
      const now = Date.now();

      if (now - timestamp < cacheTime) {
        console.log(`使用缓存数据 [${key}]: ${Math.round((cacheTime - (now - timestamp)) / 60000)}分钟后过期`);
        return data;
      }

      // 缓存过期，删除
      console.log(`缓存已过期，删除 [${key}]`);
      localStorageUtils.removeItem(key);
      return null;
    } catch (error) {
      console.error(`获取缓存失败 [${key}]:`, error);
      return null;
    }
  }

  private saveToCache<T>(key: string, data: T): void {
    try {
      localStorageUtils.setItem(key, {
        data,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error(`保存缓存失败 [${key}]:`, error);
    }
  }

  // 验证天气数据是否有效（包含位置和天气信息）
  private isWeatherDataValid(weather: ExtendedWeatherInfo): boolean {
    // 检查城市名称是否存在且不为空
    const hasCity = !!weather.city && weather.city.trim().length > 0;

    // 检查温度信息是否有效（不是占位符 '--' 或 '--°C'）
    const hasTemperature = !!weather.temperature &&
      !weather.temperature.includes('--');

    // 检查天气状况是否有效
    const hasCondition = !!weather.condition &&
      weather.condition.trim().length > 0 &&
      weather.condition !== '未知';

    const isValid = hasCity && hasTemperature && hasCondition;

    if (!isValid) {
      console.warn('天气数据验证失败:', {
        hasCity,
        city: weather.city,
        hasTemperature,
        temperature: weather.temperature,
        hasCondition,
        condition: weather.condition
      });
    }

    return isValid;
  }

  // 获取空气质量等级
  private getAirQualityLevel(quality: string): number {
    const qualityLevelMap: Record<string, number> = {
      '优': 1,
      '良': 2,
      '轻度污染': 3,
      '中度污染': 4,
      '重度污染': 5,
      '严重污染': 6
    };
    return qualityLevelMap[quality] || 0;
  }

  // 清理旧格式的缓存key（迁移工具）
  cleanupOldCacheKeys(): void {
    if (typeof window === 'undefined') return;

    // 清理旧的天气缓存key
    const keysToRemove = [
      'weather.cache.apii.auto',
      'weather.cache.vvhan.auto',
      'weather.cache.backup',
      'weather.failure.apii.auto',
      'weather.failure.vvhan.auto'
    ];

    keysToRemove.forEach(key => {
      localStorageUtils.removeItem(key);
    });

    console.log('清理旧的天气缓存key完成');
  }

  // 根据天气状况获取图标URL
  private getIconUrlForCondition(condition: string): string {
    const conditionMap: Record<string, string> = {
      '晴': 'https://openweathermap.org/img/wn/01d@2x.png',
      '多云': 'https://openweathermap.org/img/wn/02d@2x.png',
      '阴': 'https://openweathermap.org/img/wn/03d@2x.png',
      '阴天': 'https://openweathermap.org/img/wn/03d@2x.png',
      '小雨': 'https://openweathermap.org/img/wn/10d@2x.png',
      '中雨': 'https://openweathermap.org/img/wn/10d@2x.png',
      '大雨': 'https://openweathermap.org/img/wn/10d@2x.png',
      '暴雨': 'https://openweathermap.org/img/wn/10d@2x.png',
      '雷阵雨': 'https://openweathermap.org/img/wn/11d@2x.png',
      '小雪': 'https://openweathermap.org/img/wn/13d@2x.png',
      '中雪': 'https://openweathermap.org/img/wn/13d@2x.png',
      '大雪': 'https://openweathermap.org/img/wn/13d@2x.png',
      '雾': 'https://openweathermap.org/img/wn/50d@2x.png',
      '霾': 'https://openweathermap.org/img/wn/50d@2x.png'
    };

    return conditionMap[condition] || 'https://openweathermap.org/img/wn/03d@2x.png';
  }


}

// 导出天气服务单例
export const weatherService = new WeatherService();

// 导出便捷方法
export const getWeatherInfo = (city?: string) => weatherService.getWeatherInfo(city);

// 导出获取扩展天气信息的方法（包含未来几天数据）
export const getExtendedWeatherInfo = async (city?: string): Promise<ExtendedWeatherInfo | null> => {
  try {
    // 使用后台代理接口获取扩展数据
    const shouldTryBackend = (weatherService as any).shouldTryBackend(city);
    if (shouldTryBackend) {
      try {
        const extendedWeather = await weatherService.getWeatherByBackend(city);
        (weatherService as any).markBackendSuccess(city);
        return extendedWeather;
      } catch (error) {
        console.warn('获取扩展天气信息失败:', error);
        (weatherService as any).markBackendFailure(city);
      }
    }

    // 如果后台接口不可用，检查缓存
    const backendCacheKey = WEATHER_CACHE_KEYS.backendCache(city);
    const cached = (weatherService as any).getFromCacheWithCustomTime(backendCacheKey, (weatherService as any).CACHE_TIME) as ExtendedWeatherInfo | null;
    if (cached) {
      return cached;
    }

    return null;
  } catch (error) {
    console.error('获取扩展天气信息失败:', error);
    return null;
  }
};

// 导出类型定义
export type { ExtendedWeatherInfo };

// 导出缓存key常量供其他模块使用
export const WEATHER_CACHE_KEYS_EXPORT = WEATHER_CACHE_KEYS;

// 在服务初始化时清理旧缓存key（仅在浏览器环境中执行）
if (typeof window !== 'undefined') {
  // 延迟执行，避免影响初始化性能
  setTimeout(() => {
    weatherService.cleanupOldCacheKeys();
  }, 1000);
} 