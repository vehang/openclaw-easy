import { useAsync } from './useAsync';
import { getWeatherInfo, getExtendedWeatherInfo } from '@/services/weatherService';
import { WeatherInfo } from '@/types/WeatherInfo';

// 扩展的天气信息接口
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

export function useWeather(city?: string) {
  // 直接使用weatherService的缓存机制，避免双重缓存
  return useAsync<WeatherInfo>(
    () => getWeatherInfo(city),
    [city]
  );
}

// 新增：获取扩展天气信息的hook（包含未来几天数据）
export function useExtendedWeather(city?: string) {
  return useAsync<ExtendedWeatherInfo | null>(
    () => getExtendedWeatherInfo(city),
    [city]
  );
}

// 获取空气质量颜色的工具函数
export function getAirQualityColor(quality: string): string {
  const qualityColorMap: Record<string, string> = {
    '优': 'text-green-500',
    '良': 'text-yellow-500',
    '轻度污染': 'text-orange-500',
    '中度污染': 'text-red-500',
    '重度污染': 'text-purple-500',
    '严重污染': 'text-gray-800'
  };
  
  return qualityColorMap[quality] || 'text-gray-500';
}

// 获取空气质量等级颜色
export function getAirQualityLevelColor(level: number): string {
  const levelColorMap: Record<number, string> = {
    1: 'text-green-500',
    2: 'text-yellow-500', 
    3: 'text-orange-500',
    4: 'text-red-500',
    5: 'text-purple-500',
    6: 'text-gray-800'
  };
  
  return levelColorMap[level] || 'text-gray-500';
} 