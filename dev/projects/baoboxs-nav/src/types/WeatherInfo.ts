// 定义天气信息的统一接口
export interface AirQuality {
  aqi?: number;
  level?: number;
  name?: string;
  pm25?: string;
  pm10?: string;
}

export interface WeatherInfo {
  temperature: string;
  fengxiang: string;
  condition: string;
  icon: string;
  windSpeed: string;
  humidity: string;
  city?: string;
  airQuality?: AirQuality;
}