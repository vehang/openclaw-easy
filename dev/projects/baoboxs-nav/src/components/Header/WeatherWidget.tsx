import React, { useState, useRef } from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { useWeather, useExtendedWeather } from '@/hooks/useWeather';

const WeatherWidget: React.FC = () => {
  const [showForecast, setShowForecast] = useState(false);
  const { data: weatherData, loading, error, execute } = useWeather();
  const { data: extendedWeather } = useExtendedWeather();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 处理重试
  const handleRetry = () => {
    execute(true); // 强制刷新
  };

  // 显示弹窗
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setShowForecast(true);
  };

  // 延迟隐藏弹窗
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setShowForecast(false);
    }, 300); // 300ms 延迟
  };

  // 弹窗区域鼠标进入时清除延时
  const handleForecastMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // 弹窗区域鼠标离开时隐藏
  const handleForecastMouseLeave = () => {
    setShowForecast(false);
  };

  if (error) {
    return (
      <div className="hidden xl:flex flex-col items-center text-sm text-gray-200">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">天气获取失败</span>
          <button
            onClick={handleRetry}
            className="text-xs text-blue-400 hover:text-blue-300 underline"
            title="点击重试"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="hidden xl:flex flex-col items-center text-sm text-gray-200 relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {loading ? (
        <div className="animate-pulse flex flex-col items-center space-y-1">
          <div className="h-4 w-16 bg-gray-600 rounded"></div>
          <div className="h-3 w-12 bg-gray-600 rounded"></div>
        </div>
      ) : weatherData ? (
        <>
          {/* 天气信息（上） */}
          <div className="flex items-center justify-center whitespace-nowrap">
            {weatherData.icon && (
              <img
                src={weatherData.icon}
                alt={weatherData.condition}
                className="w-6 h-6 mr-1"
                onError={(e) => {
                  // 图标加载失败时隐藏
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <span className="font-medium">{weatherData.temperature}</span>
            {weatherData.airQuality?.name && (
              <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-opacity-80"
                style={{
                  backgroundColor: getAirQualityColorValue(weatherData.airQuality.name),
                  color: '#fff'
                }}>
                {weatherData.airQuality.name}
              </span>
            )}
          </div>

          {/* 城市信息（下） */}
          <div className="flex items-center mt-1 text-xs text-gray-300 whitespace-nowrap">
            <FaMapMarkerAlt className="mr-1 text-xs" />
            <span>{weatherData.city || '未知'}</span>
            {weatherData.fengxiang && (
              <span className="ml-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2.5 2.5 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
                </svg>
                {weatherData.fengxiang}
              </span>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center space-y-1">
          <span className="text-xs text-gray-400">暂无数据</span>
          <button
            onClick={handleRetry}
            className="text-xs text-blue-400 hover:text-blue-300 underline"
          >
            获取
          </button>
        </div>
      )}

      {/* 悬停显示未来三天天气预报 */}
      {showForecast && extendedWeather?.futureWeather && extendedWeather.futureWeather.length > 0 && (
        <div
          className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 min-w-96"
          onMouseEnter={handleForecastMouseEnter}
          onMouseLeave={handleForecastMouseLeave}
        >
          <div className="text-sm font-medium text-gray-800 mb-3">
            {weatherData?.city || ''}未来三天天气
          </div>
          <div className="space-y-2">
            {extendedWeather.futureWeather.slice(0, 3).map((day, index) => (
              <div key={index} className="flex items-center justify-between py-1">
                {/* 左侧：日期和星期 */}
                <div className="flex items-center space-x-2 min-w-20">
                  <div className="text-sm font-medium text-gray-700">
                    {day.date}
                  </div>
                  <div className="text-xs text-gray-500">
                    {day.week}
                  </div>
                </div>

                {/* 中间：天气图标和描述 */}
                <div className="flex items-center space-x-2 flex-1 justify-start">
                  <img
                    src={getWeatherIconUrl(day.weather)}
                    alt={day.weather}
                    className="w-5 h-5"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="text-sm text-gray-700">
                    {day.weather}
                  </div>
                </div>

                {/* 右侧：温度、风向、空气质量 */}
                <div className="flex items-center space-x-2">
                  <div className="text-sm font-medium text-gray-800">
                    {day.temperature}
                  </div>
                  {day.windDirection && (
                    <div className="text-xs text-gray-500 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2.5 2.5 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
                      </svg>
                      {day.windDirection}
                    </div>
                  )}
                  {day.airQuality && (
                    <span
                      className="px-1.5 py-0.5 text-xs rounded text-white"
                      style={{
                        backgroundColor: getAirQualityColorValue(day.airQuality)
                      }}
                    >
                      {day.airQuality}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {extendedWeather.updateTime && (
            <div className="text-xs text-gray-400 mt-3 pt-2 border-t border-gray-100">
              更新时间: {extendedWeather.updateTime}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 根据天气状况获取对应的图标URL
const getWeatherIconUrl = (weather: string): string => {
  const weatherIconMap: Record<string, string> = {
    '晴': 'https://openweathermap.org/img/wn/01d@2x.png',
    '多云': 'https://openweathermap.org/img/wn/02d@2x.png',
    '阴': 'https://openweathermap.org/img/wn/03d@2x.png',
    '阴天': 'https://openweathermap.org/img/wn/03d@2x.png',
    '小雨': 'https://openweathermap.org/img/wn/10d@2x.png',
    '中雨': 'https://openweathermap.org/img/wn/10d@2x.png',
    '大雨': 'https://openweathermap.org/img/wn/10d@2x.png',
    '暴雨': 'https://openweathermap.org/img/wn/10d@2x.png',
    '雷阵雨': 'https://openweathermap.org/img/wn/11d@2x.png',
    '雷雨': 'https://openweathermap.org/img/wn/11d@2x.png',
    '小雪': 'https://openweathermap.org/img/wn/13d@2x.png',
    '中雪': 'https://openweathermap.org/img/wn/13d@2x.png',
    '大雪': 'https://openweathermap.org/img/wn/13d@2x.png',
    '雾': 'https://openweathermap.org/img/wn/50d@2x.png',
    '霾': 'https://openweathermap.org/img/wn/50d@2x.png',
    '沙尘暴': 'https://openweathermap.org/img/wn/50d@2x.png'
  };

  return weatherIconMap[weather] || 'https://openweathermap.org/img/wn/03d@2x.png';
};

// 根据空气质量等级返回对应的颜色值（与原Header保持一致）
const getAirQualityColorValue = (quality: string): string => {
  switch (quality) {
    case '优':
      return '#52c41a'; // 绿色
    case '良':
      return '#faad14'; // 黄色
    case '轻度污染':
      return '#fa8c16'; // 橙色
    case '中度污染':
      return '#f5222d'; // 红色
    case '重度污染':
      return '#8B4513'; // 褐色
    case '严重污染':
      return '#a8071a'; // 深红色
    default:
      return '#1890ff'; // 默认蓝色
  }
};

export default WeatherWidget; 