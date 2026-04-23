import { NextResponse } from 'next/server';

// 安全的环境变量获取函数
function getNodeEnv(): string {
  if (typeof process === 'undefined' || !process.env) {
    return 'production';
  }
  return process.env.NODE_ENV || 'production';
}

function getAppVersion(): string {
  if (typeof process === 'undefined' || !process.env) {
    return '1.0.0';
  }
  return process.env.npm_package_version || '1.0.0';
}

export async function GET() {
  try {
    // 这里可以添加更多的健康检查逻辑
    // 比如检查数据库连接、外部服务等
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: typeof process !== 'undefined' ? process.uptime() : 0,
      environment: getNodeEnv(),
      version: getAppVersion(),
    };

    return NextResponse.json(healthData, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      }, 
      { status: 500 }
    );
  }
} 