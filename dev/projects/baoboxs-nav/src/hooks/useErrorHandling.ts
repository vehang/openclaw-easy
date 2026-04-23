import { useCallback } from 'react';
import { NetworkErrorHandler, FriendlyError, createErrorHandler } from '@/utils/errorHandler';

/**
 * 错误处理Hook
 * 提供统一的错误处理功能
 */
export function useErrorHandling(context?: string) {
  const errorHandler = createErrorHandler(context);

  /**
   * 处理异步操作的错误
   * @param operation 可能抛出错误的异步操作
   * @param options 配置选项
   */
  const handleAsyncError = useCallback(async (
    operation: () => Promise<any>,
    options: {
      onError?: (error: FriendlyError) => void;
      onSuccess?: (result: any) => void;
      showToast?: (title: string, message?: string) => void;
      errorTitle?: string;
    } = {}
  ) => {
    try {
      const result = await operation();
      options.onSuccess?.(result);
      return result;
    } catch (error: any) {
      const friendlyError = NetworkErrorHandler.analyzeError(error);

      // 记录错误日志
      NetworkErrorHandler.logError(friendlyError, context);

      // 调用错误回调
      options.onError?.(friendlyError);

      // 显示Toast消息
      if (options.showToast) {
        const title = options.errorTitle || '操作失败';
        options.showToast(title, friendlyError.userMessage);
      }

      throw friendlyError;
    }
  }, [context]);

  /**
   * 处理同步操作的错误
   */
  const handleSyncError = useCallback((
    operation: () => any,
    options: {
      onError?: (error: FriendlyError) => void;
      showToast?: (title: string, message?: string) => void;
      errorTitle?: string;
    } = {}
  ) => {
    try {
      return operation();
    } catch (error: any) {
      const friendlyError = NetworkErrorHandler.analyzeError(error);

      // 记录错误日志
      NetworkErrorHandler.logError(friendlyError, context);

      // 调用错误回调
      options.onError?.(friendlyError);

      // 显示Toast消息
      if (options.showToast) {
        const title = options.errorTitle || '操作失败';
        options.showToast(title, friendlyError.userMessage);
      }

      throw friendlyError;
    }
  }, [context]);

  return {
    handleAsyncError,
    handleSyncError,
    analyzeError: NetworkErrorHandler.analyzeError,
    logError: NetworkErrorHandler.logError
  };
}

/**
 * 简化的错误处理Hook，专门用于API调用
 */
export function useApiErrorHandling(context?: string) {
  const { handleAsyncError } = useErrorHandling(context);

  /**
   * 安全执行API调用
   */
  const safeApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    options: {
      showToast?: (title: string, message?: string) => void;
      successMessage?: string;
      errorTitle?: string;
      onSuccess?: (result: T) => void;
    } = {}
  ): Promise<T | null> => {
    try {
      const result = await apiCall();

      // 成功回调
      if (options.onSuccess) {
        options.onSuccess(result);
      }

      // 显示成功消息
      if (options.showToast && options.successMessage) {
        options.showToast('操作成功', options.successMessage);
      }

      return result;
    } catch (error: any) {
      const friendlyError = NetworkErrorHandler.analyzeError(error);

      // 记录错误日志
      NetworkErrorHandler.logError(friendlyError, context);

      // 显示错误消息
      if (options.showToast) {
        const title = options.errorTitle || '请求失败';
        options.showToast(title, friendlyError.userMessage);
      }

      return null;
    }
  }, [context]);

  return { safeApiCall };
}