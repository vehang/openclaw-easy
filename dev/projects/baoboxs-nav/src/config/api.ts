// API配置文件 - 支持运行时动态环境配置
interface ApiConfig {
  baseUrl: string;
  timeout: number;
}

// 环境配置映射表
const configs: Record<string, ApiConfig> = {
  development: {
    // baseUrl: 'http://192.168.1.9:8080',
    baseUrl: 'http://127.0.0.1:8080',
    timeout: 30000
  },
  production: {
    baseUrl: 'https://www.baoboxs.com',
    timeout: 5000
  },
  test: {
    baseUrl: 'http://192.168.1.123:48082',
    timeout: 3000
  }
};

// 动态获取API环境配置的函数
function getApiEnvironment(): string {
  // 优先级：API_ENV > NEXT_PUBLIC_API_ENV > NODE_ENV > 'production'
  
  if (typeof window === 'undefined') {
    // 服务端：支持Docker运行时环境变量
    const apiEnv = process.env.API_ENV || 
                   process.env.NEXT_PUBLIC_API_ENV || 
                   process.env.NODE_ENV;
    
    console.log(`[API Config] 服务端环境检测: API_ENV=${process.env.API_ENV}, NEXT_PUBLIC_API_ENV=${process.env.NEXT_PUBLIC_API_ENV}, NODE_ENV=${process.env.NODE_ENV}`);
    
    return apiEnv === 'development' || apiEnv === 'test' || apiEnv === 'production' 
           ? apiEnv 
           : 'production';
  } else {
    // 客户端：优先使用环境变量，再尝试运行时配置
    const buildTimeEnv = process.env.NEXT_PUBLIC_API_ENV;
    
    // 开发环境下直接使用编译时变量，避免 Hydration 不一致
    if (process.env.NODE_ENV === 'development') {
      const env = buildTimeEnv || 'development';
      console.log(`[API Config] 客户端开发模式使用编译时配置: ${env}`);
      return env in configs ? env : 'development';
    }
    
    // 生产环境下尝试获取运行时配置
    try {
      const nextConfig = require('next/config').default;
      const { publicRuntimeConfig } = nextConfig();
      const runtimeApiEnv = publicRuntimeConfig?.apiEnv;
      
      if (runtimeApiEnv && runtimeApiEnv in configs) {
        console.log(`[API Config] 客户端使用运行时配置: ${runtimeApiEnv}`);
        return runtimeApiEnv;
      }
    } catch (error) {
      console.warn('[API Config] 无法获取运行时配置，使用默认值');
    }
    
    // 回退到编译时的环境变量
    const fallbackEnv = buildTimeEnv || 'production';
    console.log(`[API Config] 客户端使用编译时配置: ${fallbackEnv}`);
    return fallbackEnv in configs ? fallbackEnv : 'production';
  }
}

// 获取当前API配置
function getCurrentApiConfig(): ApiConfig {
  const env = getApiEnvironment();
  const defaultConfig = configs[env];
  
  // 支持通过环境变量动态覆盖 baseUrl
  const customBaseUrl = process.env.API_BASE_URL;
  
  const finalConfig = {
    ...defaultConfig,
    ...(customBaseUrl && { baseUrl: customBaseUrl })
  };
  
  if (customBaseUrl) {
    console.log(`[API Config] 当前环境: ${env}, 使用自定义baseUrl: ${customBaseUrl}, 超时: ${finalConfig.timeout}ms`);
  } else {
    console.log(`[API Config] 当前环境: ${env}, 使用默认配置:`, finalConfig);
  }
  
  return finalConfig;
}

// 获取当前环境信息
function getCurrentEnvironmentInfo() {
  const apiEnv = getApiEnvironment();
  const nodeEnv = (typeof process !== 'undefined' && process.env?.NODE_ENV) || 'production';
  
  return {
    nodeEnv,
    apiEnv,
    isProduction: apiEnv === 'production',
    isDevelopment: apiEnv === 'development',
    isTest: apiEnv === 'test'
  };
}

// 导出动态配置 - 每次调用都会重新计算
export const getApiConfig = getCurrentApiConfig;
export const getEnvironmentInfo = getCurrentEnvironmentInfo;

// 为了向后兼容，导出默认配置实例
export const apiConfig: ApiConfig = getCurrentApiConfig();
export const currentEnvironment = getCurrentEnvironmentInfo();

// 导出配置映射，供其他模块使用
export { configs };

/**
 * 使用说明：
 * 
 * 1. 开发环境：
 *    # 使用默认开发配置
 *    npm run dev
 *    
 *    # 指定开发环境
 *    NEXT_PUBLIC_API_ENV=development npm run dev
 * 
 * 2. 编译时（支持一次编译）：
 *    npm run build
 * 
 * 3. Docker运行时（动态环境配置）：
 *    # 使用默认配置
 *    docker run -e API_ENV=development your-image
 *    
 *    # 自定义后端地址
 *    docker run -e API_ENV=development -e API_BASE_URL=http://custom-api.com your-image
 *    
 *    # 完全自定义
 *    docker run -e API_BASE_URL=http://192.168.1.100:8080 your-image
 * 
 * 4. 本地运行：
 *    # 使用默认配置
 *    API_ENV=development npm start
 *    
 *    # 自定义后端地址
 *    API_ENV=development API_BASE_URL=http://localhost:8080 npm start
 */