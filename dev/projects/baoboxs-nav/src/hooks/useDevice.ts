import { useState, useEffect } from 'react';
import { getDeviceId, initDeviceId } from '@/utils/device';

export const useDevice = () => {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isDeviceReady, setIsDeviceReady] = useState(false);

  useEffect(() => {
    // 初始化设备ID
    const id = getDeviceId();
    if (id) {
      setDeviceId(id);
      setIsDeviceReady(true);
    } else {
      // 如果没有设备ID，尝试初始化
      const newId = initDeviceId();
      setDeviceId(newId);
      setIsDeviceReady(true);
    }
  }, []);

  return {
    deviceId,
    isDeviceReady
  };
};