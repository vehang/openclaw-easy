/**
 * 网络错误处理工具类
 * 统一处理各种网络请求错误，提供友好的错误消息
 */

export type ErrorType = 'network' | 'timeout' | 'server' | 'auth' | 'business' | 'unknown';

export interface FriendlyError {
  type: ErrorType;
  userMessage: string;
  technicalMessage: string;
  originalError?: Error;
}

export class NetworkErrorHandler {

  /**
   * 分析错误类型并生成友好的错误消息
   */
  static analyzeError(error: any): FriendlyError {
    // 如果是字符串错误
    if (typeof error === 'string') {
      return this.analyzeStringError(error);
    }

    // 如果是Error对象
    if (error instanceof Error) {
      return this.analyzeErrorObject(error);
    }

    // 如果是其他类型的错误
    return {
      type: 'unknown',
      userMessage: '发生了未知错误，请稍后重试',
      technicalMessage: String(error),
      originalError: error
    };
  }

  /**
   * 分析字符串类型的错误
   */
  private static analyzeStringError(error: string): FriendlyError {
    const lowerError = error.toLowerCase();

    // 网络连接错误
    if (lowerError.includes('fetch failed') ||
        lowerError.includes('networkerror') ||
        lowerError.includes('network error') ||
        lowerError.includes('failed to fetch')) {
      return {
        type: 'network',
        userMessage: '请求失败，请稍后重试',
        technicalMessage: error
      };
    }

    // 超时错误
    if (lowerError.includes('timeout') ||
        lowerError.includes('超时')) {
      return {
        type: 'timeout',
        userMessage: '请求超时，请稍后重试',
        technicalMessage: error
      };
    }

    // HTTP状态错误
    if (lowerError.includes('http错误') ||
        lowerError.includes('http error')) {
      return {
        type: 'server',
        userMessage: '服务暂时不可用，请稍后重试',
        technicalMessage: error
      };
    }

    // 默认处理
    return {
      type: 'unknown',
      userMessage: '请求失败，请稍后重试',
      technicalMessage: error
    };
  }

  /**
   * 分析Error对象
   */
  private static analyzeErrorObject(error: Error): FriendlyError {
    const message = error.message.toLowerCase();

    // 网络相关错误
    if (message.includes('fetch failed') ||
        message.includes('networkerror') ||
        message.includes('network error') ||
        message.includes('failed to fetch') ||
        error.name === 'TypeError') {
      return {
        type: 'network',
        userMessage: '请求失败，请稍后重试',
        technicalMessage: error.message,
        originalError: error
      };
    }

    // 超时错误
    if (message.includes('timeout') ||
        message.includes('超时') ||
        error.name === 'AbortError') {
      return {
        type: 'timeout',
        userMessage: '请求超时，请稍后重试',
        technicalMessage: error.message,
        originalError: error
      };
    }

    // 认证错误
    if (message.includes('登录已过期') ||
        message.includes('登录过期') ||
        message.includes('token') ||
        message.includes('auth') ||
        message.includes('unauthorized')) {
      return {
        type: 'auth',
        userMessage: '登录已过期，请重新登录',
        technicalMessage: error.message,
        originalError: error
      };
    }

    // 服务器错误
    if (message.includes('http错误') ||
        message.includes('http error') ||
        message.includes('server') ||
        message.includes('服务器')) {
      return {
        type: 'server',
        userMessage: '服务暂时不可用，请稍后重试',
        technicalMessage: error.message,
        originalError: error
      };
    }

    // 业务逻辑错误
    if (message.includes('业务处理失败') ||
        message.includes('业务失败') ||
        message.includes('操作失败')) {
      return {
        type: 'business',
        userMessage: '操作失败，请稍后重试',
        technicalMessage: error.message,
        originalError: error
      };
    }

    // 默认未知错误
    return {
      type: 'unknown',
      userMessage: '请求失败，请稍后重试',
      technicalMessage: error.message,
      originalError: error
    };
  }

  /**
   * 获取错误对应的Toast颜色类型
   */
  static getToastType(errorType: ErrorType): 'error' | 'warning' | 'info' {
    switch (errorType) {
      case 'network':
      case 'server':
        return 'error';
      case 'timeout':
        return 'warning';
      case 'auth':
        return 'warning';
      case 'business':
        return 'error';
      default:
        return 'error';
    }
  }

  /**
   * 记录错误日志（用于调试和监控）
   */
  static logError(error: FriendlyError, context?: string) {
    const logData = {
      timestamp: new Date().toISOString(),
      context,
      type: error.type,
      userMessage: error.userMessage,
      technicalMessage: error.technicalMessage,
      stack: error.originalError?.stack
    };

    // 在开发环境下输出详细日志
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 网络错误 [${error.type.toUpperCase()}]`);
      console.error('用户消息:', error.userMessage);
      console.error('技术消息:', error.technicalMessage);
      if (context) console.error('上下文:', context);
      if (error.originalError) console.error('原始错误:', error.originalError);
      console.groupEnd();
    } else {
      // 生产环境下只记录基本信息
      console.error(`网络错误 [${error.type}]: ${error.userMessage}`);
    }
  }
}

/**
 * 创建统一的错误处理函数
 * @param context 错误上下文，用于日志记录
 * @returns 错误处理函数
 */
export function createErrorHandler(context?: string) {
  return (error: any, showToast?: (title: string, message?: string) => void) => {
    const friendlyError = NetworkErrorHandler.analyzeError(error);
    NetworkErrorHandler.logError(friendlyError, context);

    // 如果提供了showToast函数，显示友好错误消息
    if (showToast) {
      const toastType = NetworkErrorHandler.getToastType(friendlyError.type);
      showToast('操作失败', friendlyError.userMessage);
    }

    return friendlyError;
  };
}

/**
 * 全局错误处理器
 */
export const globalErrorHandler = createErrorHandler('全局网络请求');