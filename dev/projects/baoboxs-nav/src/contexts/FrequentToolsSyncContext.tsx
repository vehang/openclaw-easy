'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface FrequentToolsSyncContextType {
  isSyncEnabled: boolean;
  setIsSyncEnabled: (enabled: boolean) => void;
  lastSyncTime: string;
  setLastSyncTime: (time: string) => void;
}

const FrequentToolsSyncContext = createContext<FrequentToolsSyncContextType | undefined>(undefined);

interface FrequentToolsSyncProviderProps {
  children: ReactNode;
}

export const FrequentToolsSyncProvider: React.FC<FrequentToolsSyncProviderProps> = ({ children }) => {
  const [isSyncEnabled, setIsSyncEnabledState] = useState(false);
  const [lastSyncTime, setLastSyncTimeState] = useState<string>('');

  // 从本地存储加载同步设置
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSyncSetting = localStorage.getItem('frequentToolsSyncEnabled');
      const savedLastSyncTime = localStorage.getItem('frequentToolsLastSyncTime');

      if (savedSyncSetting !== null) {
        setIsSyncEnabledState(JSON.parse(savedSyncSetting));
      }

      if (savedLastSyncTime) {
        setLastSyncTimeState(savedLastSyncTime);
      }
    }
  }, []);

  // 切换同步设置
  const setIsSyncEnabled = useCallback((enabled: boolean) => {
    setIsSyncEnabledState(enabled);

    if (typeof window !== 'undefined') {
      localStorage.setItem('frequentToolsSyncEnabled', JSON.stringify(enabled));

      // 如果开启同步，更新最后同步时间
      if (enabled) {
        const now = new Date().toLocaleString('zh-CN');
        setLastSyncTimeState(now);
        localStorage.setItem('frequentToolsLastSyncTime', now);
      }
    }
  }, []);

  // 设置最后同步时间
  const setLastSyncTime = useCallback((time: string) => {
    setLastSyncTimeState(time);
    if (typeof window !== 'undefined') {
      localStorage.setItem('frequentToolsLastSyncTime', time);
    }
  }, []);

  const value = {
    isSyncEnabled,
    setIsSyncEnabled,
    lastSyncTime,
    setLastSyncTime
  };

  return (
    <FrequentToolsSyncContext.Provider value={value}>
      {children}
    </FrequentToolsSyncContext.Provider>
  );
};

export const useFrequentToolsSyncContext = () => {
  const context = useContext(FrequentToolsSyncContext);
  if (context === undefined) {
    throw new Error('useFrequentToolsSyncContext must be used within a FrequentToolsSyncProvider');
  }
  return context;
};