'use client';

import React, { useState } from 'react';
import { useWeather, useExtendedWeather, getAirQualityColor } from '@/hooks/useWeather';

interface WeatherWidgetProps {
  city?: string;
  className?: string;
}

export function WeatherWidget({ city, className = '' }: WeatherWidgetProps) {
  const [showForecast, setShowForecast] = useState(false);
  const { data: weather, loading, error } = useWeather(city);
  const { data: extendedWeather } = useExtendedWeather(city);

  if (loading) {
    return (
      <div className={`weather-widget ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className={`weather-widget ${className}`}>
        <div className="text-gray-500 text-sm">天气加载失败</div>
      </div>
    );
  }

  return (
    <div 
      className={`weather-widget relative ${className}`}
      onMouseEnter={() => setShowForecast(true)}
      onMouseLeave={() => setShowForecast(false)}
    >
      {/* 当前天气显示 */}
      <div className="flex items-center space-x-2">
        {weather.icon && (
          <img 
            src={weather.icon} 
            alt={weather.condition}
            className="w-6 h-6"
          />
        )}
        <div>
          <div className="text-sm font-medium">
            {weather.temperature}
          </div>
          <div className="text-xs text-gray-600">
            {weather.condition}
          </div>
        </div>
        {weather.city && (
          <div className="text-xs text-gray-500">
            {weather.city}
          </div>
        )}
      </div>

      {/* 空气质量 */}
      {weather.airQuality?.name && (
        <div className={`text-xs mt-1 ${getAirQualityColor(weather.airQuality.name)}`}>
          空气质量: {weather.airQuality.name}
        </div>
      )}

      {/* 悬停显示未来三天天气 */}
      {showForecast && extendedWeather?.futureWeather && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 min-w-64">
          <div className="text-sm font-medium mb-2">未来天气预报</div>
          <div className="space-y-2">
            {extendedWeather.futureWeather.slice(0, 3).map((day, index) => (
              <div key={index} className="flex justify-between items-center text-xs">
                <div className="font-medium">{day.date} {day.week}</div>
                <div className="flex items-center space-x-2">
                  <span>{day.weather}</span>
                  <span className="text-gray-600">{day.temperature}</span>
                  <span className={`${getAirQualityColor(day.airQuality)}`}>{day.airQuality}</span>
                </div>
              </div>
            ))}
          </div>
          {extendedWeather.updateTime && (
            <div className="text-xs text-gray-400 mt-2 pt-2 border-t">
              更新时间: {extendedWeather.updateTime}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default WeatherWidget;