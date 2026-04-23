import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDevice } from '@/hooks/useDevice';
import { useFrequentToolsSyncContext } from '@/contexts/FrequentToolsSyncContext';
import {
  getLocalData,
  saveLocalData,
  markLocalDataChanged,
  markLocalDataSynced,
  incrementFrequentToolVisit,
  getCloudCacheData,
  saveCloudCacheData,
  clearCloudCacheData,
  STORAGE_KEY_V2,
  STORAGE_KEY,
  STORAGE_KEY_CLOUD_CACHE
} from '@/utils/frequentToolsManager';
import { getDeviceId } from '@/utils/device';
import { syncFrequentTools, getDeviceFrequentTools, getUserAggregatedFrequentTools, updateServerToolCount, recoverFrequentTools } from '@/services/api';

export interface UseFrequentToolsSyncOptions {
  autoSync?: boolean;
  syncInterval?: number; // 自动同步间隔（毫秒）
}

export interface FrequentToolsStats {
  totalTools: number;
  totalUsage: number;
  topTool: any;
  averageUsage: number;
}

export const useFrequentToolsSync = (options: UseFrequentToolsSyncOptions = {}) => {
  const { autoSync = true, syncInterval = 30000 } = options;
  const { isAuthenticated } = useAuth();
  const { deviceId } = useDevice();
  const { isSyncEnabled, setLastSyncTime: updateContextLastSyncTime } = useFrequentToolsSyncContext();

  const [syncing, setSyncing] = useState(false);
  const [recovering, setRecovering] = useState(false); // 新增：恢复状态
  const [manualSyncing, setManualSyncing] = useState(false); // 新增：手动同步状态
  const [lastSyncTimeInternal, setLastSyncTimeInternal] = useState<number | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [aggregatedTools, setAggregatedTools] = useState<any[]>([]);
  const lastRecoveryTimeRef = useRef<number>(0); // 记录最后恢复时间，防止重复恢复
  const manualSyncRef = useRef<boolean>(false); // 防止手动同步重复调用
  const lastManualSyncTimeRef = useRef<number>(0); // 记录最后手动同步时间，防止连续调用

  // 使用 ref 保存最新的状态值，避免闭包问题
  const isAuthenticatedRef = useRef(isAuthenticated);
  const isSyncEnabledRef = useRef(isSyncEnabled);

  // 更新 ref
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
    isSyncEnabledRef.current = isSyncEnabled;
  }, [isAuthenticated, isSyncEnabled]);

  // 检查是否需要恢复数据
  const shouldRecoverData = useCallback(() => {
    console.log('🔍 shouldRecoverData 被调用');

    // 防止并发恢复
    if (recovering) {
      console.log('恢复正在进行中，跳过检查');
      return false;
    }

    // 防止频繁恢复：距离上次恢复少于5分钟，跳过
    const now = Date.now();
    if (now - lastRecoveryTimeRef.current < 5 * 60 * 1000) {
      console.log(`距离上次恢复时间不足5分钟（${Math.round((now - lastRecoveryTimeRef.current) / 1000)}秒），跳过恢复`);
      return false;
    }

    // 直接从 localStorage 读取用户数据判断是否已登录，避免 React 状态更新延迟问题
    let actuallyLoggedIn = isAuthenticatedRef.current;
    if (!actuallyLoggedIn && typeof window !== 'undefined') {
      try {
        const userDataStr = localStorage.getItem('userData');
        if (userDataStr && userDataStr !== 'null') {
          const userData = JSON.parse(userDataStr);
          actuallyLoggedIn = !!(userData.accessToken && (userData.username || userData.userName));
        }
      } catch (error) {
        // 忽略解析错误
      }
    }

    console.log('🔍 认证状态:', {
      React状态: isAuthenticated,
      localStorage状态: actuallyLoggedIn,
      deviceId
    });

    if (!actuallyLoggedIn || !deviceId) {
      console.log('用户未登录或设备ID不存在，不需要恢复');
      return false;
    }

    try {
      // 检查是否存在 v3 缓存，如果没有再检查 v2 缓存
      let stored = localStorage.getItem(STORAGE_KEY);
      let isV2Data = false;

      if (!stored) {
        // 如果没有 v3 数据，检查 v2 数据
        stored = localStorage.getItem(STORAGE_KEY_V2);
        isV2Data = true;
      }

      console.log('🔍 缓存检查:', { hasCache: !!stored, isV2Data });

      // 需求1：当前端没有缓存数据，就优先调用recover-frequent-tools
      if (!stored) {
        console.log('🔍 没有缓存，需要恢复');
        return true;
      }

      // 如果有缓存，解析数据检查lastSyncTime
      let parsedData;
      try {
        parsedData = JSON.parse(stored);
      } catch (parseError) {
        console.log('🔍 缓存数据格式错误，需要恢复');
        return true;
      }

      // 获取lastSyncTime，直接从解析的数据中获取
      let lastSyncTime;
      if (parsedData && typeof parsedData === 'object' && 'lastSyncTime' in parsedData) {
        lastSyncTime = parsedData.lastSyncTime;
      } else {
        // 如果是新结构，直接使用
        const localData = getLocalData();
        lastSyncTime = localData.lastSyncTime;
      }

      console.log('🔍 lastSyncTime 检查:', {
        lastSyncTime,
        lastSyncTimeType: typeof lastSyncTime,
        parsedDataType: Array.isArray(parsedData) ? 'array' : (typeof parsedData === 'object' ? 'object' : 'other')
      });

      // 需求2：frequent-tools-visits-v2里面缓存的数据如果 lastSyncTime 为 null/undefined/≤0，就优先调用recover-frequent-tools
      const needsRecover = lastSyncTime === null || // lastSyncTime 为 null
                          lastSyncTime === undefined || // lastSyncTime 为 undefined
                          typeof lastSyncTime !== 'number' || // lastSyncTime 不是数字
                          lastSyncTime <= 0; // lastSyncTime 小于等于0

      console.log('🔍 恢复条件检查:', {
        hasCache: !!stored,
        lastSyncTime,
        lastSyncTimeType: typeof lastSyncTime,
        needsRecover,
        reason: needsRecover ? '需要恢复：lastSyncTime无效' : '不需要恢复：已有有效lastSyncTime'
      });

      return needsRecover;
    } catch (error) {
      console.error('❌ 检查数据恢复状态失败:', error);
      return false;
    }
  }, [deviceId, recovering]);

  // 检查是否需要同步数据
  const shouldSyncData = useCallback(() => {
    console.log('🔍 shouldSyncData 被调用');

    // 首先检查同步开关是否开启
    if (!isSyncEnabled) {
      console.log('🔍 同步开关已关闭，跳过同步');
      return false;
    }

    if (!isAuthenticated || !deviceId) {
      console.log('用户未登录或设备ID不存在，不需要同步');
      return false;
    }

    try {
      const localData = getLocalData();
      console.log('🔍 本地数据状态:', {
        hasChanges: localData.hasChanges,
        toolsCount: localData.tools?.length || 0,
        lastSyncTime: localData.lastSyncTime,
        lastUpdateTime: localData.lastUpdateTime,
        syncEnabled: isSyncEnabled
      });

      // 如果本地数据有变化，需要同步
      if (localData.hasChanges === true) {
        console.log('🔍 本地数据有变化，需要同步');
        return true;
      }

      // 如果本地没有工具数据，也需要同步（可能需要从服务器获取）
      if (!localData.tools || localData.tools.length === 0) {
        console.log('🔍 本地没有工具数据，需要同步');
        return true;
      }

      console.log('🔍 本地数据无变化，不需要同步');
      return false;
    } catch (error) {
      console.error('❌ 检查数据同步状态失败:', error);
      return false;
    }
  }, [isAuthenticated, deviceId, isSyncEnabled]);

  // 智能恢复设备数据（新增方法）
  const smartRecoverDeviceData = useCallback(async () => {
    console.log('--- 开始调用recover-frequent-tools ---');

    // 直接从 localStorage 读取用户数据判断是否已登录，避免 React 状态更新延迟问题
    let actuallyLoggedIn = isAuthenticatedRef.current;
    if (!actuallyLoggedIn && typeof window !== 'undefined') {
      try {
        const userDataStr = localStorage.getItem('userData');
        if (userDataStr && userDataStr !== 'null') {
          const userData = JSON.parse(userDataStr);
          actuallyLoggedIn = !!(userData.accessToken && (userData.username || userData.userName));
        }
      } catch (error) {
        // 忽略解析错误
      }
    }

    if (!actuallyLoggedIn || !deviceId) {
      console.log('用户未登录或设备ID不存在，跳过恢复');
      return false;
    }

    // 防止并发恢复
    if (recovering) {
      console.log('恢复正在进行中，跳过重复调用');
      return false;
    }

    try {
      setRecovering(true);

      const localData = getLocalData();
      const isFirstTimeUse = !localData.tools || localData.tools.length === 0;

      console.log('正在调用recover-frequent-tools API:', {
        isFirstTimeUse,
        localToolsCount: localData.tools?.length || 0,
        localLastUpdateTime: localData.lastUpdateTime,
        localLastSyncTime: localData.lastSyncTime
      });

      // 调用恢复接口
      const result = await recoverFrequentTools(
        deviceId,
        isFirstTimeUse,
        localData // 传递完整的本地数据
      );

      if (result.code === 0 && result.data) {
        try {
          const recoveredData = JSON.parse(result.data);

          if (recoveredData.tools && Array.isArray(recoveredData.tools)) {
            // 确保lastSyncTime是有效的时间戳
            let lastSyncTime = recoveredData.lastSyncTime;
            if (!lastSyncTime || typeof lastSyncTime !== 'number' || lastSyncTime <= 0) {
              // 如果服务器没有返回有效的lastSyncTime，使用当前时间
              lastSyncTime = Date.now();
              console.log('⚠️ 服务器未返回有效的lastSyncTime，使用当前时间:', lastSyncTime);
            } else {
              console.log('✅ 使用服务器返回的lastSyncTime:', lastSyncTime);
            }

            // 保存恢复的数据到本地存储
            saveLocalData({
              tools: recoveredData.tools,
              lastSyncTime: lastSyncTime,
              lastUpdateTime: recoveredData.lastUpdateTime || Date.now(),
              hasChanges: false
            });

            console.log('✅ recover-frequent-tools API调用成功，工具数量:', recoveredData.tools.length, 'lastSyncTime:', lastSyncTime);
            setAggregatedTools(recoveredData.tools); // 更新状态

            // 触发事件，通知其他组件数据已更新
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('FREQUENT_TOOLS_DATA_UPDATED', {
                detail: { tools: recoveredData.tools }
              }));
              console.log('✅ recover 触发 FREQUENT_TOOLS_DATA_UPDATED 事件，工具数量:', recoveredData.tools.length);
            }

            lastRecoveryTimeRef.current = Date.now(); // 记录恢复成功的时间
            return true;
          } else {
            console.warn('恢复数据格式异常');
            return false;
          }
        } catch (parseError) {
          console.error('解析恢复数据失败:', parseError);
          return false;
        }
      } else {
        console.warn('❌ recover-frequent-tools API调用失败:', result.errorMsg);
        return false;
      }
    } catch (error) {
      console.error('❌ recover-frequent-tools API调用异常:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setSyncError('恢复失败: ' + errorMessage);
      return false;
    } finally {
      setRecovering(false);
    }
  }, [deviceId, recovering]);

  
  // 检查本地数据是否有变化
  const hasLocalChanges = useCallback(() => {
    const localData = getLocalData();
    return localData.hasChanges === true;
  }, []);

  // 同步本地数据到服务器
  const syncToServer = useCallback(async () => {
    console.log('--- 开始调用sync-frequent-tools ---');

    // 直接从 localStorage 读取用户数据判断是否已登录，避免 React 状态更新延迟问题
    let actuallyLoggedIn = isAuthenticatedRef.current;
    if (!actuallyLoggedIn && typeof window !== 'undefined') {
      try {
        const userDataStr = localStorage.getItem('userData');
        if (userDataStr && userDataStr !== 'null') {
          const userData = JSON.parse(userDataStr);
          actuallyLoggedIn = !!(userData.accessToken && (userData.username || userData.userName));
        }
      } catch (error) {
        // 忽略解析错误
      }
    }

    if (!actuallyLoggedIn || !deviceId) {
      console.log('用户未登录或设备ID不存在，跳过同步');
      return null;
    }

    const localData = getLocalData();

    // 验证本地数据是否有效
    if (!localData || !localData.tools || !Array.isArray(localData.tools)) {
      console.warn('本地数据格式无效，跳过同步以避免数据丢失');
      return null;
    }

    // 额外的安全检查：确保不会同步空数据（但允许恢复后的空数据同步）
    if (localData.tools.length === 0) {
      console.log('本地工具数据为空，但仍尝试同步以获取服务器数据');
    }

    try {
      setSyncing(true);
      setSyncError(null);

      console.log('正在调用sync-frequent-tools API，工具数量:', localData.tools.length);

      // 记录同步前的数据状态，用于调试
      console.log('同步前数据状态:', {
        toolsCount: localData.tools.length,
        hasChanges: localData.hasChanges,
        lastSyncTime: localData.lastSyncTime,
        lastUpdateTime: localData.lastUpdateTime
      });

      // 使用本地的lastSyncTime进行同步
      const result = await syncFrequentTools(deviceId, localData.tools, localData.lastSyncTime);

      if (result.code === 0) {
        // 同步成功，更新本地状态
        const now = Date.now();

        // 如果服务器返回了聚合数据，考虑是否需要更新本地缓存
        if (result.data && Array.isArray(result.data)) {
          console.log('✅ sync-frequent-tools API调用成功，返回聚合数据，数量:', result.data.length);

          // 更新本地缓存的lastSyncTime和hasChanges标志
          // 使用当前时间作为同步时间戳
          const localData = getLocalData();
          saveLocalData({
            ...localData,
            lastSyncTime: now,
            hasChanges: false,
            lastUpdateTime: now
          });

          console.log('📝 更新本地同步时间戳:', {
            localLastSyncTime: now,
            hasChanges: false,
            toolsCount: localData.tools?.length || 0
          });
        } else {
          console.log('✅ sync-frequent-tools API调用成功，但未返回聚合数据');

          // 即使没有返回聚合数据，也要更新同步状态
          markLocalDataSynced();
        }

        setLastSyncTimeInternal(now);
        setSyncError(null);

        // 更新上下文的最后同步时间
        updateContextLastSyncTime(new Date(now).toLocaleString('zh-CN'));

        // 返回聚合数据
        return result.data;
      } else {
        throw new Error(result.errorMsg || '同步失败');
      }
    } catch (error) {
      console.error('❌ sync-frequent-tools API调用失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setSyncError('同步失败: ' + errorMessage);
      return null;
    } finally {
      setSyncing(false);
    }
  }, [deviceId, updateContextLastSyncTime]);

  // 手动同步方法 - 直接调用 frequent-tools 接口获取最新数据
  const manualSync = useCallback(async () => {
    console.log('🔄 开始手动同步 frequent-tools 接口');
    console.log('🔄 manualSync 调用堆栈:', new Error().stack?.split('\n').slice(1, 4).join(' | '));

    // 防止短时间内重复调用 - 10秒冷却时间
    const now = Date.now();
    if (manualSyncing || manualSyncRef.current || (now - lastManualSyncTimeRef.current < 10000)) {
      const timeDiff = now - lastManualSyncTimeRef.current;
      const remainingTime = Math.max(0, 10000 - timeDiff);
      console.log('🔄 手动同步冷却中，跳过重复调用');
      console.log('🔄 防护检查 - manualSyncing:', manualSyncing, 'manualSyncRef:', manualSyncRef.current, 'timeDiff:', timeDiff, 'remainingTime:', remainingTime);
      return false;
    }

    if (!isAuthenticated) {
      console.log('用户未登录，无法手动同步');
      return false;
    }

    try {
      lastManualSyncTimeRef.current = now;
      manualSyncRef.current = true;
      setManualSyncing(true);
      console.log('🔄 正在调用 frequent-tools 接口...');

      const result = await getUserAggregatedFrequentTools();

      if (result.code === 0 && result.data) {
        console.log('✅ 手动同步成功，工具数量:', result.data.length);
        setAggregatedTools(result.data);
        setLastSyncTimeInternal(Date.now());

        // 更新云端缓存
        saveCloudCacheData(result.data);

        // 触发事件，通知其他组件数据已更新
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('FREQUENT_TOOLS_DATA_UPDATED', {
            detail: { tools: result.data }
          }));
          console.log('✅ manualSync 触发 FREQUENT_TOOLS_DATA_UPDATED 事件，工具数量:', result.data.length);
        }

        // 只有在同步开关开启时才更新上下文的最后同步时间
        if (isSyncEnabled) {
          updateContextLastSyncTime(new Date().toLocaleString('zh-CN'));
        }

        return true;
      } else {
        console.warn('❌ 手动同步失败:', result.errorMsg);
        return false;
      }
    } catch (error) {
      console.error('❌ 手动同步异常:', error);
      return false;
    } finally {
      setManualSyncing(false);
      manualSyncRef.current = false;
      console.log('🔄 手动同步结束');
    }
  }, [isAuthenticated, manualSyncing, updateContextLastSyncTime]);

  // 获取聚合数据（用于展示）
  const fetchAggregatedTools = useCallback(async () => {
    console.log('🔍 fetchAggregatedTools 被调用');

    // 直接从 localStorage 读取用户数据判断是否已登录，避免 React 状态更新延迟问题
    let actuallyLoggedIn = isAuthenticatedRef.current;
    if (!actuallyLoggedIn && typeof window !== 'undefined') {
      try {
        const userDataStr = localStorage.getItem('userData');
        if (userDataStr && userDataStr !== 'null') {
          const userData = JSON.parse(userDataStr);
          actuallyLoggedIn = !!(userData.accessToken && (userData.username || userData.userName));
        }
      } catch (error) {
        // 忽略解析错误
      }
    }

    if (!actuallyLoggedIn) {
      console.log('🔍 用户未登录，无法获取聚合数据');
      console.log('🔍 认证状态:', {
        React状态: isAuthenticated,
        localStorage状态: actuallyLoggedIn
      });
      return [];
    }

    try {
      console.log('🔍 获取用户聚合常用工具...');
      const result = await getUserAggregatedFrequentTools();

      if (result.code === 0 && result.data) {
        console.log('✅ fetchAggregatedTools 成功获取数据，工具数量:', result.data.length);

        // 更新状态，触发UI刷新
        console.log('✅ 准备调用 setAggregatedTools，触发状态更新...');
        setAggregatedTools(result.data);
        console.log('✅ setAggregatedTools 调用完成');

        // 更新云端缓存
        saveCloudCacheData(result.data);
        console.log('✅ 云端缓存更新完成');

        // 触发事件，通知其他组件数据已更新（包括本地组件和Layout组件）
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('FREQUENT_TOOLS_DATA_UPDATED', {
            detail: { tools: result.data }
          }));
          console.log('✅ 触发 FREQUENT_TOOLS_DATA_UPDATED 事件，工具数量:', result.data.length);
        }

        console.log('✅ fetchAggregatedTools 完成');
        return result.data;
      } else {
        throw new Error(result.errorMsg || '获取失败');
      }
    } catch (error) {
      console.error('获取聚合数据失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setSyncError('获取聚合数据失败: ' + errorMessage);
      return [];
    }
  }, [isAuthenticated]);

  // 智能同步逻辑 - 根据数据状态决定是否需要同步
  const smartSync = useCallback(async () => {
    console.log('🚀 smartSync 被调用 - 调用堆栈:', new Error().stack?.split('\n').slice(1, 4).join(' | '));

    // 使用 ref 来获取最新的认证状态，避免闭包问题
    // 同时检查 localStorage 中的实际登录状态
    let actuallyLoggedIn = isAuthenticatedRef.current;
    if (!actuallyLoggedIn && typeof window !== 'undefined') {
      try {
        const userDataStr = localStorage.getItem('userData');
        if (userDataStr && userDataStr !== 'null') {
          const userData = JSON.parse(userDataStr);
          actuallyLoggedIn = !!(userData.accessToken && (userData.username || userData.userName));
        }
      } catch (error) {
        // 忽略解析错误
      }
    }

    if (!actuallyLoggedIn || !deviceId) {
      console.log('用户未登录或设备ID不存在，跳过同步');
      console.log('  - isAuthenticatedRef.current:', isAuthenticatedRef.current);
      console.log('  - localStorage登录状态:', actuallyLoggedIn);
      console.log('  - deviceId:', deviceId);
      return null;
    }

    console.log('🚀 调用 shouldRecoverData()');
    // 检查是否需要恢复数据
    const needsRecover = shouldRecoverData();
    console.log('🚀 shouldRecoverData 返回:', needsRecover);

    if (needsRecover) {
      console.log('🚀 === 情况1：需要恢复数据，调用recover-frequent-tools ===');

      const recoverResult = await smartRecoverDeviceData();
      if (!recoverResult) {
        console.warn('❌ recover-frequent-tools调用失败，跳过sync-frequent-tools');
        return null;
      }

      console.log('✅ recover-frequent-tools调用成功，检查是否需要同步...');

      // 恢复完成后，等待一小段时间确保数据已保存
      await new Promise(resolve => setTimeout(resolve, 100));

      // 检查同步开关是否开启
      if (isSyncEnabled) {
        console.log('🚀 同步开关已开启，继续调用sync-frequent-tools...');
        // 恢复成功后，直接调用同步
        const syncResult = await syncToServer();
        if (syncResult) {
          console.log('✅ sync-frequent-tools调用成功，获取最新聚合数据用于展示...');
          // sync-frequent-tools成功后，调用frequent-tools接口获取最新聚合数据用于展示
          const aggregatedData = await fetchAggregatedTools();
          setLastSyncTimeInternal(Date.now());
          return aggregatedData;
        } else {
          console.warn('❌ sync-frequent-tools调用失败');
          // 同步失败时，只有开关开启才获取聚合数据
          if (isSyncEnabled) {
            await fetchAggregatedTools();
          }
        }
      } else {
        console.log('🚀 同步开关已关闭，跳过sync-frequent-tools，但仍获取聚合数据');
        // 同步开关关闭时，不进行本地同步，但仍获取服务器数据用于展示
        console.log('🚀 获取服务器聚合数据用于展示（不影响同步）');
        const aggregatedData = await fetchAggregatedTools();
        setLastSyncTimeInternal(Date.now());
        return aggregatedData;
      }
    } else {
      console.log('🚀 === 情况2：之前已经同步过，检查是否需要同步 ===');

      // 检查是否需要同步数据
      const needsSync = shouldSyncData();
      console.log('🚀 shouldSyncData 返回:', needsSync);

      if (needsSync) {
        console.log('🚀 === 需要同步，调用sync-frequent-tools ===');
        const syncResult = await syncToServer();
        if (syncResult) {
          console.log('✅ sync-frequent-tools调用成功，获取最新聚合数据用于展示...');
          // sync-frequent-tools成功后，调用frequent-tools接口获取最新聚合数据用于展示
          const aggregatedData = await fetchAggregatedTools();
          setLastSyncTimeInternal(Date.now());
          return aggregatedData;
        } else {
          console.warn('❌ sync-frequent-tools调用失败');
          // 同步失败时，只有开关开启才获取聚合数据
          if (isSyncEnabled) {
            await fetchAggregatedTools();
          }
        }
      } else {
        console.log('🚀 === 不需要同步，获取服务器聚合数据用于展示 ===');
        // 无论同步开关是否开启，都获取服务器聚合数据用于展示
        // 这样可以确保看到最新的服务器数据，只是不进行本地同步
        console.log('🚀 获取服务器聚合数据用于展示（不影响同步）');
        const aggregatedData = await fetchAggregatedTools();
        setLastSyncTimeInternal(Date.now());
        return aggregatedData;
      }
    }

    return null;
  }, [deviceId, shouldRecoverData, shouldSyncData, smartRecoverDeviceData, syncToServer, fetchAggregatedTools, isSyncEnabled]);

  // 更新工具使用次数
  const updateToolCount = useCallback(async (uniqueKey: string, toolId?: number) => {
    // 直接从 localStorage 读取用户数据判断是否已登录，避免 React 状态更新延迟问题
    let actuallyLoggedIn = isAuthenticatedRef.current;
    if (!actuallyLoggedIn && typeof window !== 'undefined') {
      try {
        const userDataStr = localStorage.getItem('userData');
        if (userDataStr && userDataStr !== 'null') {
          const userData = JSON.parse(userDataStr);
          actuallyLoggedIn = !!(userData.accessToken && (userData.username || userData.userName));
        }
      } catch (error) {
        // 忽略解析错误
      }
    }

    if (!actuallyLoggedIn || !deviceId) {
      return false;
    }

    try {
      const result = await updateServerToolCount(deviceId, uniqueKey, toolId);
      if (result.code === 0) {
        // 注意：不要在这里重复调用incrementFrequentToolVisit
        // 因为在handleFrequentToolClick中已经调用过了
        // 只需要标记本地数据有变化即可
        markLocalDataChanged();
        return true;
      }
    } catch (error) {
      console.error('更新工具计数失败:', error);
    }
    return false;
  }, [deviceId]);

  // 定时自动同步
  useEffect(() => {
    if (!autoSync || !isAuthenticated || !deviceId) {
      return;
    }

    const interval = setInterval(() => {
      // 首先检查同步开关是否开启
      if (!isSyncEnabled) {
        console.log('定时检查：同步开关已关闭，跳过所有同步操作');
        return;
      }

      // 定时检查：如果需要恢复，则执行恢复和同步
      if (shouldRecoverData()) {
        console.log('定时检查：检测到需要恢复数据，触发恢复和同步');
        smartSync();
      } else if (hasLocalChanges()) {
        console.log('定时检查：发现本地数据变化，触发同步');
        smartSync();
      } else {
        console.log('定时检查：本地数据无变化，跳过同步');
      }
    }, syncInterval);

    return () => clearInterval(interval);
  }, [autoSync, isAuthenticated, deviceId, hasLocalChanges, shouldRecoverData, smartSync, isSyncEnabled]);

  // 监听登录成功后的常用工具数据更新事件
  useEffect(() => {
    const handleFrequentToolsDataUpdated = (event: CustomEvent) => {
      const { tools } = event.detail;
      console.log(`收到常用工具数据更新事件，工具数量: ${tools.length}`);
      setAggregatedTools(tools);
    };

    window.addEventListener('FREQUENT_TOOLS_DATA_UPDATED', handleFrequentToolsDataUpdated as EventListener);
    return () => {
      window.removeEventListener('FREQUENT_TOOLS_DATA_UPDATED', handleFrequentToolsDataUpdated as EventListener);
    };
  }, []);

  // 监听登录成功事件，自动触发常用工具同步
  useEffect(() => {
    const handleLoginSuccess = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { type, isAuthenticated: newAuthState } = customEvent.detail;
      console.log(`[useFrequentToolsSync] 收到登录状态变化事件: ${type}, 新状态: ${newAuthState ? '已登录' : '未登录'}`);

      // 登录成功后触发常用工具同步
      if (type === 'login' && newAuthState === true) {
        console.log('🚀 [useFrequentToolsSync] 登录成功，准备触发常用工具同步');

        // 不依赖 isAuthenticated 状态，直接读取 localStorage 判断
        // 因为 useLocalStorage 的状态更新是异步的，可能还未更新
        setTimeout(async () => {
          // 直接从 localStorage 读取用户数据判断是否已登录
          let actuallyLoggedIn = false;
          try {
            if (typeof window !== 'undefined') {
              const userDataStr = localStorage.getItem('userData');
              if (userDataStr && userDataStr !== 'null') {
                const userData = JSON.parse(userDataStr);
                // 检查是否有必要的认证信息（token 和 username）
                actuallyLoggedIn = !!(userData.accessToken && (userData.username || userData.userName));
              }
            }
          } catch (error) {
            console.error('[useFrequentToolsSync] 读取用户数据失败:', error);
          }

          console.log('🚀 [useFrequentToolsSync] 开始执行常用工具智能同步');
          console.log('🚀 [useFrequentToolsSync] React认证状态:', isAuthenticatedRef.current);
          console.log('🚀 [useFrequentToolsSync] localStorage实际登录状态:', actuallyLoggedIn);

          if (actuallyLoggedIn) {
            // 已登录，调用 smartSync 走完整的恢复和同步流程
            // smartSync 会自动：
            // 1. 检查是否需要恢复数据（调用 recover-frequent-tools）
            // 2. 如果需要恢复，恢复后检查是否同步（调用 sync-frequent-tools）
            // 3. 最后获取聚合数据（调用 frequent-tools）
            try {
              console.log('🚀 [useFrequentToolsSync] 调用 smartSync 执行完整的恢复和同步流程');
              await smartSync();
              console.log('✅ [useFrequentToolsSync] 常用工具智能同步完成');
            } catch (error) {
              console.error('❌ [useFrequentToolsSync] 常用工具智能同步异常:', error);
            }
          } else {
            console.warn('⚠️ [useFrequentToolsync] localStorage 中用户数据无效，等待状态更新');
          }
        }, 300);
      }
    };

    window.addEventListener('LOGIN_STATE_CHANGED', handleLoginSuccess);
    return () => {
      window.removeEventListener('LOGIN_STATE_CHANGED', handleLoginSuccess);
    };
  }, [smartSync]); // 依赖 smartSync

  return {
    // 状态
    syncing,
    recovering,              // 恢复状态
    manualSyncing,           // 手动同步状态
    lastSyncTime: lastSyncTimeInternal,
    syncError,
    aggregatedTools,

    // 方法
    syncToServer,
    fetchAggregatedTools,
    smartSync,
    manualSync,              // 手动同步方法
    updateToolCount,
    hasLocalChanges,
    smartRecoverDeviceData,  // 恢复方法
    shouldRecoverData,       // 检查是否需要恢复
    shouldSyncData,          // 检查是否需要同步

    // 云端缓存相关
    getCloudCacheData,
    clearCloudCacheData
  };
};