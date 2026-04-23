/**
 * 本地存储键名常量
 * 集中管理所有localStorage使用的键名，避免硬编码和拼写错误
 */
export const STORAGE_KEYS = {
  // 用户相关
  USER_DATA: 'userData',
  LAST_TOKEN_REFRESH_TIME: 'lastTokenRefreshTime',
  DEVICE_ID: 'deviceId',

  // 创建一个自定义事件名称，用于登录过期通知
  TOKEN_EXPIRED_EVENT : 'token_expired',
  
  // 缓存相关
  CITY_DATA_CACHE: 'city_data_cache',
  
  // 天气缓存相关（新的统一格式）
  WEATHER_CACHE_PREFIX: 'weather.cache',
  WEATHER_FAILURE_PREFIX: 'weather.failure',
  
  // 其他可能的键名...
  SETTINGS: 'userSettings',
  SEARCH_HISTORY: 'searchHistory',

  URL_PARAM_KEY_ACTION: 'action',
  URL_PARAM_KEY_SOURCE: 'source',

  // 常用工具同步相关
  FREQUENT_TOOLS_SYNC_ENABLED: 'frequentToolsSyncEnabled',
};

/**
 * 缓存清理配置
 * 统一管理需要清理的缓存key，避免硬编码和遗漏
 */
export const CACHE_CLEAR_CONFIG = {
  // 内存缓存需要清理的key
  MEMORY_CACHE_KEYS: [
    'tools_data',          // 首页工具数据
    'city_data',           // 城市数据
    'weather_',            // 天气缓存(旧格式前缀匹配)
    'weather.cache',       // 天气缓存(新格式前缀匹配)
  ],
  
  // localStorage缓存需要清理的key
  LOCAL_CACHE_KEYS: [
    'tools_data',          // 首页工具数据
    'tools_data_fallback', // 首页工具数据降级缓存
    'city_data',           // 城市数据
    'city_data_fallback',  // 城市数据降级缓存
  ],
  
  // localStorage缓存前缀匹配清理
  LOCAL_CACHE_PREFIXES: [
    'app_cache_',          // 默认缓存前缀
    'weather_',            // 天气缓存前缀(旧格式)
    'weather.cache',       // 天气数据缓存前缀(新格式)
    'weather.failure',     // 天气失败记录前缀(新格式)
    'vvhan_failure_',      // VVHan失败记录前缀(旧格式)
  ],
  
  // 用户相关缓存(登录状态变化时需要清理)
  USER_RELATED_CACHE_KEYS: [
    'tools_data',          // 首页工具数据(可能包含用户个性化内容)
    'tools_data_fallback', // 首页工具数据降级缓存
    'weather_',            // 天气缓存前缀(旧格式)
  ],
};

// 用户数据更新事件
export const USER_DATA_UPDATED_EVENT = 'USER_DATA_UPDATED';

// 默认Token刷新间隔（24小时）
export const DEFAULT_TOKEN_REFRESH_INTERVAL = 24 * 60 * 60 * 1000;

export default STORAGE_KEYS;