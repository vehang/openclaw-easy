import { NextRequest, NextResponse } from 'next/server';
import { clearServerCache } from '@/utils/serverCache';

/**
 * 缓存清理API端点
 * 用于在登录状态变化时清理服务端缓存
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pattern, reason } = body;
    
    console.log(`🧹 收到缓存清理请求，原因: ${reason}, 模式: ${pattern || '全部'}`);
    
    // 清理服务端缓存
    clearServerCache(pattern);
    
    return NextResponse.json({
      code: 0,
      errorMsg: '',
      currentTime: Date.now(),
      data: {
        message: '缓存清理成功',
        pattern: pattern || '全部',
        reason
      }
    });
  } catch (error) {
    console.error('缓存清理失败:', error);
    
    return NextResponse.json({
      code: -1,
      errorMsg: '缓存清理失败',
      currentTime: Date.now(),
      data: null
    }, { status: 500 });
  }
}

// 支持GET请求用于测试
export async function GET() {
  return NextResponse.json({
    code: 0,
    errorMsg: '',
    currentTime: Date.now(),
    data: {
      message: '缓存清理API可用',
      endpoints: {
        'POST /api/utility/cache-clear': '清理缓存',
        'payload': 'pattern?: string, reason: string'
      }
    }
  });
} 