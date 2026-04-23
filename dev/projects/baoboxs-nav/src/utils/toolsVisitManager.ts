// 兼容性文件 - 重新导出新的频繁工具管理器
// 此文件保持向后兼容，所有新功能请使用 frequentToolsManager.ts

export {
  STORAGE_KEY,
  STORAGE_TOP_NUM,
  addToFrequentTools as saveFrequentTools,
  getFrequentTools as loadFrequentTools,
  getFrequentTools as getSortedFrequentTools,
  refreshFrequentTools,
  clearFrequentTools,
  removeFrequentTool,
  getFrequentToolsStats,
  normalizeToolData,
  type ToolInput
} from './frequentToolsManager';