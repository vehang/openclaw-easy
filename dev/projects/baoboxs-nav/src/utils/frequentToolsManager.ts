import { Tool } from '@/types/IndexToolList';

export const STORAGE_KEY_V2 = 'frequent-tools-visits-v2';
export const STORAGE_KEY = 'frequent-tools-visits-v3';
export const STORAGE_KEY_CLOUD_CACHE = 'frequent-tools-cloud-cache';
export const STORAGE_TOP_NUM = 24;

// V3 数据结构，支持同步功能
export interface FrequentToolData {
  tools: Tool[];
  lastUpdateTime?: number;  // 最后更新时间
  lastSyncTime?: number;    // 最后同步时间
  hasChanges?: boolean;     // 是否有变化需要同步
}

// 云端缓存数据结构
export interface CloudCacheData {
  tools: Tool[];
  lastUpdateTime: number;   // 最后更新时间
}

// 扩展ToolInput接口，支持各种来源的数据格式
export interface ToolInput {
  // 必需字段
  title: string;
  url: string;
  
  // 基本字段
  id?: number | string;
  desc?: string;
  description?: string;
  msg?: string;
  img?: string;
  icon?: string;
  charge?: number;
  lang?: string;
  rel?: string;
  un?: number;
  sw?: number; // 访问权限标识：0=任何人都可以访问，>0=需要登录
  sl?: string; // 短地址字段
  requireLogin?: boolean; // 是否需要登录
  
  // 书签相关字段
  urlId?: number;
  
  // 收藏相关字段
  bindId?: number; // 收藏绑定ID
  
  // 来源标识，用于判断登录状态要求
  source?: 'homepage' | 'bookmark' | 'favorite' | string;
  
  // 其他字段
  [key: string]: any;
}

/**
 * 基于URL生成稳定的哈希ID
 */
const generateHashId = (url: string): number => {
  return Math.abs(url.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0));
};

/**
 * 根据来源和工具信息生成唯一键
 * @param input 工具输入数据
 * @returns 唯一键字符串
 */
const generateUniqueKey = (input: ToolInput): string => {
  const source = input.source || 'unknown';
  
  switch (source) {
    case 'homepage':
      // 主页：source + toolId
      if (input.id) {
        return `homepage_${input.id}`;
      }
      // 如果没有ID，使用URL作为后备
      return `homepage_url_${input.url}`;
      
    case 'bookmark':
      // 书签：直接使用url
      return `bookmark_${input.url}`;
      
    case 'favorite':
      // 收藏：source + id
      if (input.id) {
        return `favorite_${input.id}`;
      }
      // 如果没有ID但有bindId，使用bindId
      if (input.bindId) {
        return `favorite_bind_${input.bindId}`;
      }
      // 最后后备方案使用URL
      return `favorite_url_${input.url}`;
      
    default:
      // 其他来源：source + url
      return `${source}_${input.url}`;
  }
};

/**
 * 智能获取图片URL
 */
const getImageUrl = (input: ToolInput): string => {
  // 优先使用明确提供的图片
  if (input.img && input.img.trim()) {
    return input.img.trim();
  }
  
  if (input.icon && input.icon.trim()) {
    return input.icon.trim();
  }
  
  // 尝试从URL生成favicon
  if (input.url) {
    try {
      const match = input.url.match(/^(https?:\/\/[^/]+)/);
      if (match && match[1]) {
        return match[1] + '/favicon.ico';
      }
    } catch (error) {
      console.error('Error generating favicon URL:', error);
    }
  }
  
  return '/icons/default-icon1.png';
};

/**
 * 标准化工具数据，将各种格式转换为统一的Tool格式
 */
export const normalizeToolData = (input: ToolInput): Tool => {
  // 生成唯一键
  const uniqueKey = generateUniqueKey(input);
  
  // 生成稳定的ID
  const id = input.id ? (typeof input.id === 'string' ? parseInt(input.id) || generateHashId(input.url) : input.id) : generateHashId(input.url);
  
  // 智能获取图片URL
  const img = getImageUrl(input);
  
  // 智能获取描述
  const desc = input.desc || input.description || input.msg || input.title || '';
  
  // 确定是否需要登录
  let requireLogin = false;
  if (typeof input.requireLogin === 'boolean') {
    requireLogin = input.requireLogin;
  } else {
    // 根据来源自动判断
    switch (input.source) {
      case 'homepage':
        requireLogin = false; // 主页工具免登录
        break;
      case 'bookmark':
      case 'favorite':
        requireLogin = true; // 书签和收藏需要登录
        break;
      default:
        requireLogin = false; // 默认免登录
    }
  }
  
  return {
    id,
    title: input.title,
    url: input.url,
    desc,
    img,
    charge: input.charge || 0,
    lang: input.lang || 'zh',
    rel: input.rel || '',
    un: input.un || 1,
    sw: input.sw || 0, // 访问权限标识，默认为0（任何人都可以访问）
    sl: input.sl, // 短地址字段
    requireLogin,
    uniqueKey,
    bindId: input.bindId
  };
};

/**
 * 添加工具到常用工具列表
 */
export const addToFrequentTools = (toolInput: ToolInput): void => {
  console.log(toolInput)
  if (typeof window === 'undefined') return;

  try {
    // 标准化数据
    const tool = normalizeToolData(toolInput);
    const source = toolInput.source || 'unknown';

    // 获取现有数据（适配新结构）
    const data = getLocalData();
    let tools = data.tools;

    // 查找是否已存在（使用uniqueKey作为唯一标识）
    const existingIndex = tools.findIndex(t => t.uniqueKey === tool.uniqueKey);

    if (existingIndex > -1) {
      // 获取旧对象的uv值
      const existingTool = tools[existingIndex];
      const oldUv = existingTool.un || 0;

      // 处理来源信息
      const sources = existingTool.sources || [];
      if (!sources.length || sources[sources.length - 1] !== source) {
        sources.push(source);
        if (sources.length > 10) {
          sources.splice(0, sources.length - 10);
        }
      }

      // 智能合并工具数据
      // 注意：不要在这里累加un值，因为incrementFrequentToolVisit会单独处理
      // 如果是点击操作，un值会通过incrementFrequentToolVisit增加
      // 如果是同步操作，un值会通过后端合并得到正确的值
      tools[existingIndex] = {
        ...existingTool,
        id: tool.id || existingTool.id,
        url: tool.url,
        title: tool.title || existingTool.title,
        desc: tool.desc || existingTool.desc,
        img: tool.img || existingTool.img,
        charge: tool.charge ?? existingTool.charge,
        lang: tool.lang || existingTool.lang,
        rel: tool.rel || existingTool.rel,
        un: existingTool.un, // 保持原有的un值，不累加
        sl: tool.sl || existingTool.sl,
        requireLogin: tool.requireLogin ?? existingTool.requireLogin,
        uniqueKey: tool.uniqueKey,
        bindId: tool.bindId || existingTool.bindId,
        sources,
        lastSource: source
      };
    } else {
      // 添加新工具
      tools.push({
        ...tool,
        sources: [source],
        lastSource: source
      });
    }

    // 更新数据结构（新增同步相关字段）
    const updatedData: FrequentToolData = {
      tools,
      lastUpdateTime: Date.now(),
      lastSyncTime: data.lastSyncTime,
      hasChanges: true
    };

    saveLocalData(updatedData);

    // 后续逻辑保持不变...
    if (source === 'homepage' && tool.id && typeof tool.id === 'number') {
      // recordToolVisitAsync(tool.id);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`添加常用工具: ${tool.title} (来源: ${source}), UV: ${tools[existingIndex]?.un || tool.un}`);
    }

    const sortedTools = tools
      .filter(tool => typeof tool.un === 'number' && tool.un > 0)
      .sort((a, b) => (b.un || 0) - (a.un || 0));
    triggerFrequentToolsUpdate(sortedTools);

  } catch (error) {
    console.error('添加常用工具失败:', error);
  }
};

/**
 * 数据迁移：为现有工具添加uniqueKey
 */
const migrateToolsData = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return;
    
    const tools = parsed as Tool[];
    let hasUpdates = false;
    
    const updatedTools = tools.map(tool => {
      // 如果工具没有uniqueKey，尝试生成一个
      if (!tool.uniqueKey) {
        // 尝试从URL推断来源和生成uniqueKey
        // 这是一个最佳努力的迁移，可能不完全准确
        let source = tool.lastSource || 'bookmark'; // 默认认为是书签
        
        // 如果有具体的ID且不是从URL生成的，可能是主页工具
        if (tool.id && tool.id !== generateHashId(tool.url)) {
          source = 'homepage';
        }
        
        const migratedInput: ToolInput = {
          ...tool,
          source: source as any
        };
        
        tool.uniqueKey = generateUniqueKey(migratedInput);
        hasUpdates = true;
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`迁移工具数据: ${tool.title} -> ${tool.uniqueKey}`);
        }
      }
      return tool;
    });
    
    if (hasUpdates) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTools));
      if (process.env.NODE_ENV === 'development') {
        console.log('工具数据迁移完成');
      }
    }
  } catch (error) {
    console.error('工具数据迁移失败:', error);
  }
};

/**
 * 异步记录工具访问统计
 */
const recordToolVisitAsync = async (toolId: number): Promise<void> => {
  try {
    // 动态导入API方法，避免循环依赖
    const { recordToolVisit } = await import('@/services/api');
    await recordToolVisit(toolId);
  } catch (error) {
    // 静默处理错误，不影响主要功能
    console.warn('记录工具访问统计失败:', error);
  }
};

/**
 * 获取排序后的常用工具列表
 */
export const getFrequentTools = (limit: number = STORAGE_TOP_NUM): Tool[] => {
  const data = getLocalData();

  // 执行数据迁移（如果需要）
  migrateToolsData();

  return data.tools
    .filter(tool => typeof tool.un === 'number' && tool.un > 0)
    .sort((a, b) => (b.un || 0) - (a.un || 0))
    .slice(0, limit);
};

/**
 * 刷新常用工具数据
 */
export const refreshFrequentTools = (): Tool[] => {
  const tools = getFrequentTools();
  triggerFrequentToolsUpdate(tools);
  return tools;
};

/**
 * 清除常用工具数据
 */
export const clearFrequentTools = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
    triggerFrequentToolsUpdate([]);
  } catch (error) {
    console.error('清除常用工具失败:', error);
  }
};

/**
 * 根据唯一键或URL查找工具的索引
 */
const findToolIndex = (tools: Tool[], identifier: string): number => {
  // 首先尝试通过uniqueKey查找
  let index = tools.findIndex(tool => tool.uniqueKey === identifier);
  
  // 如果没找到，尝试通过URL查找（向后兼容）
  if (index === -1) {
    index = tools.findIndex(tool => tool.url === identifier);
  }
  
  return index;
};

/**
 * 根据唯一键或URL查找工具
 */
const findTool = (tools: Tool[], identifier: string): Tool | null => {
  const index = findToolIndex(tools, identifier);
  return index >= 0 ? tools[index] : null;
};

/**
 * 删除特定的常用工具
 * @param identifier 唯一键或URL
 */
export const removeFrequentTool = (identifier: string): void => {
  if (typeof window === 'undefined') return;

  try {
    const data = getLocalData();
    if (!data || !data.tools || !Array.isArray(data.tools)) return;

    const tools = data.tools;
    const filteredTools = tools.filter(tool =>
      tool.uniqueKey !== identifier && tool.url !== identifier
    );

    // 更新数据结构
    data.tools = filteredTools;
    data.lastUpdateTime = Date.now();
    data.hasChanges = true;

    saveLocalData(data);

    // 触发更新事件，传递排序后的工具列表
    const sortedTools = filteredTools
      .filter(tool => typeof tool.un === 'number' && tool.un > 0)
      .sort((a, b) => (b.un || 0) - (a.un || 0));
    triggerFrequentToolsUpdate(sortedTools);
  } catch (error) {
    console.error('删除常用工具失败:', error);
  }
};

/**
 * 根据短地址删除常用工具
 * @param sl 短地址
 */
export const removeFrequentToolBySl = (sl: string): void => {
  if (typeof window === 'undefined') return;

  try {
    const data = getLocalData();
    if (!data || !data.tools || !Array.isArray(data.tools)) return;

    const tools = data.tools;
    const filteredTools = tools.filter(tool => tool.sl !== sl);

    // 检查是否有工具被删除
    if (filteredTools.length === tools.length) {
      console.warn('未找到短地址为', sl, '的常用工具');
      return;
    }

    console.log('根据短地址删除常用工具:', sl, '删除数量:', tools.length - filteredTools.length);

    // 更新数据结构
    data.tools = filteredTools;
    data.lastUpdateTime = Date.now();
    data.hasChanges = true;

    saveLocalData(data);

    // 触发更新事件，传递排序后的工具列表
    const sortedTools = filteredTools
      .filter(tool => typeof tool.un === 'number' && tool.un > 0)
      .sort((a, b) => (b.un || 0) - (a.un || 0));
    triggerFrequentToolsUpdate(sortedTools);
  } catch (error) {
    console.error('根据短地址删除常用工具失败:', error);
  }
};

/**
 * 触发常用工具更新事件
 */
export const triggerFrequentToolsUpdate = (tools: Tool[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    // 触发自定义事件，通知当前窗口数据已更新
    const event = new CustomEvent('localStorageChanged', { 
      detail: { 
        key: STORAGE_KEY, 
        newValue: JSON.stringify(tools),
        tools 
      } 
    });
    window.dispatchEvent(event);
  } catch (error) {
    console.error('触发更新事件失败:', error);
  }
};

/**
 * 统计常用工具使用情况
 */
export const getFrequentToolsStats = () => {
  const tools = getFrequentTools(1000); // 获取所有工具进行统计
  
  // 统计来源分布
  const sourceStats: Record<string, { count: number; usage: number }> = {};
  tools.forEach(tool => {
    if (tool.lastSource) {
      if (!sourceStats[tool.lastSource]) {
        sourceStats[tool.lastSource] = { count: 0, usage: 0 };
      }
      sourceStats[tool.lastSource].count++;
      sourceStats[tool.lastSource].usage += tool.un || 0;
    }
    
    // 统计所有来源历史
    if (tool.sources) {
      tool.sources.forEach(source => {
        if (!sourceStats[source]) {
          sourceStats[source] = { count: 0, usage: 0 };
        }
      });
    }
  });
  
  return {
    totalTools: tools.length,
    totalUsage: tools.reduce((sum, tool) => sum + (tool.un || 0), 0),
    topTool: tools[0] || null,
    averageUsage: tools.length > 0 ? tools.reduce((sum, tool) => sum + (tool.un || 0), 0) / tools.length : 0,
    sourceStats // 新增来源统计
  };
};

/**
 * 获取工具的来源历史信息
 * @param identifier 唯一键或URL
 */
export const getToolSourceHistory = (identifier: string): { sources: string[]; lastSource?: string } | null => {
  if (typeof window === 'undefined') return null;

  try {
    const data = getLocalData();
    if (!data || !data.tools || !Array.isArray(data.tools)) return null;

    const tools = data.tools;
    const tool = findTool(tools, identifier);

    if (tool) {
      return {
        sources: tool.sources || [],
        lastSource: tool.lastSource
      };
    }

    return null;
  } catch (error) {
    console.error('获取工具来源历史失败:', error);
    return null;
  }
};

/**
 * 监听常用工具变化的Hook工厂函数
 */
export const createFrequentToolsListener = (callback: (tools: Tool[]) => void, limit: number = STORAGE_TOP_NUM) => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      const tools = getFrequentTools(limit);
      callback(tools);
    }
  };
  
  const handleLocalChange = (e: CustomEvent) => {
    if (e.detail?.key === STORAGE_KEY) {
      // 如果事件中有工具列表，使用它，否则重新获取
      let tools: Tool[];
      if (e.detail.tools && Array.isArray(e.detail.tools)) {
        // 对传入的工具进行排序和限制
        tools = e.detail.tools
          .filter((tool: Tool) => typeof tool.un === 'number' && tool.un > 0)
          .sort((a: Tool, b: Tool) => (b.un || 0) - (a.un || 0))
          .slice(0, limit);
      } else {
        tools = getFrequentTools(limit);
      }
      callback(tools);
    }
  };
  
  // 添加监听器
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageChanged', handleLocalChange as EventListener);
  }
  
  // 返回清理函数
  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChanged', handleLocalChange as EventListener);
    }
  };
};

// 兼容性函数 - 保持向后兼容
export const saveFrequentTools = addToFrequentTools;

/**
 * 从 v2 迁移到 v3
 */
export const migrateFromV2ToV3 = (): void => {
  if (typeof window === 'undefined') return;

  try {
    // 检查是否有 v2 数据
    const v2Data = localStorage.getItem(STORAGE_KEY_V2);
    if (!v2Data) {
      console.log('没有 V2 数据，跳过迁移');
      return;
    }

    // 检查 v3 数据的状态
    const existingV3Data = localStorage.getItem(STORAGE_KEY);
    let shouldMigrate = true;

    if (existingV3Data) {
      try {
        const parsedV3Data = JSON.parse(existingV3Data);
        // 检查 V3 数据是否有效（有 tools 数组且不为空）
        if (parsedV3Data && parsedV3Data.tools && Array.isArray(parsedV3Data.tools) && parsedV3Data.tools.length > 0) {
          console.log('V3 数据已存在且有效，跳过迁移');
          shouldMigrate = false;
        } else {
          console.log('V3 数据存在但无效（空的或格式错误），需要从 V2 迁移');
        }
      } catch (error) {
        console.log('V3 数据格式错误，需要从 V2 迁移');
      }
    } else {
      console.log('V3 数据不存在，需要从 V2 迁移');
    }

    if (!shouldMigrate) {
      return;
    }

    console.log('开始从 V2 迁移到 V3...');
    const parsedV2Data = JSON.parse(v2Data);

    // 将 v2 数据转换为 v3 格式（只包含 tools 字段）
    let v3Data: FrequentToolData = migrateToNewStructure(parsedV2Data);

    // 添加必要的元数据字段
    v3Data = {
      ...v3Data,
      lastUpdateTime: Date.now(),
      hasChanges: true // 标记为需要同步
      // 注意：不设置 lastSyncTime，让它保持 undefined
    };

    // 保存 v3 数据
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v3Data));

    console.log('V2 到 V3 迁移完成，工具数量:', v3Data.tools.length);
  } catch (error) {
    console.error('V2 到 V3 迁移失败:', error);
  }
};

/**
 * 强制从 V2 迁移到 V3（用于调试和手动迁移）
 */
export const forceMigrateFromV2ToV3 = (): void => {
  if (typeof window === 'undefined') return;

  try {
    console.log('🔧 强制执行 V2 到 V3 迁移...');

    // 检查是否有 v2 数据
    const v2Data = localStorage.getItem(STORAGE_KEY_V2);
    if (!v2Data) {
      console.log('没有 V2 数据，无法迁移');
      return;
    }

    const parsedV2Data = JSON.parse(v2Data);
    console.log('V2 数据解析成功，工具数量:', Array.isArray(parsedV2Data) ? parsedV2Data.length : (parsedV2Data.tools?.length || 0));

    // 将 v2 数据转换为 v3 格式（只包含 tools 字段）
    let v3Data: FrequentToolData = migrateToNewStructure(parsedV2Data);

    // 添加必要的元数据字段
    v3Data = {
      ...v3Data,
      lastUpdateTime: Date.now(),
      hasChanges: true // 标记为需要同步
      // 注意：不设置 lastSyncTime，让它保持 undefined
    };

    // 强制保存 v3 数据
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v3Data));

    console.log('✅ 强制迁移完成，V3 工具数量:', v3Data.tools.length);
    console.log('V3 数据内容:', v3Data);
  } catch (error) {
    console.error('❌ 强制迁移失败:', error);
  }
};

/**
 * 获取本地数据（支持新旧结构兼容）
 */
export const getLocalData = (): FrequentToolData => {
  if (typeof window === 'undefined') return { tools: [] };

  // 开发环境下，添加全局调试函数
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    (window as any).forceMigrateFromV2ToV3 = forceMigrateFromV2ToV3;
    (window as any).debugLocalStorage = () => {
      console.log('=== 调试本地存储 ===');
      console.log('V2 数据:', localStorage.getItem(STORAGE_KEY_V2));
      console.log('V3 数据:', localStorage.getItem(STORAGE_KEY));
    };
  }

  // 首次调用时检查是否需要迁移
  migrateFromV2ToV3();

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { tools: [] };

    const parsed = JSON.parse(stored);
    return migrateToNewStructure(parsed);
  } catch (error) {
    console.error('获取常用工具数据失败:', error);
    return { tools: [] };
  }
};

/**
 * 保存本地数据
 */
export const saveLocalData = (data: FrequentToolData): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('保存常用工具数据失败:', error);
  }
};

/**
 * 标记本地数据有变化
 */
export const markLocalDataChanged = (): void => {
  const data = getLocalData();
  data.lastUpdateTime = Date.now();
  data.hasChanges = true;
  saveLocalData(data);
};

/**
 * 标记本地数据已同步
 */
export const markLocalDataSynced = (): void => {
  const data = getLocalData();
  data.lastSyncTime = Date.now();
  data.hasChanges = false;
  saveLocalData(data);
};

/**
 * 兼容性迁移函数
 */
export const migrateToNewStructure = (data: any): FrequentToolData => {
  // 如果是新结构，直接返回
  if (data && data.tools && Array.isArray(data.tools)) {
    return data as FrequentToolData;
  }

  // 如果是旧结构（Tool[]），包装成新结构
  if (Array.isArray(data)) {
    return {
      tools: data as Tool[],
      // V2 迁移的数据不包含同步时间，只有 tools 字段
      // lastUpdateTime, lastSyncTime, hasChanges 等字段在后续操作中设置
    };
  }

  // 空数据
  return {
    tools: []
  };
};
export const loadFrequentTools = () => {
  // 执行数据迁移
  migrateToolsData();
  return getFrequentTools(1000);
};
export const getSortedFrequentTools = getFrequentTools;

/**
 * 增加常用工具的访问次数，如果工具不存在则创建新记录
 * @param uniqueKey 工具的唯一键
 * @param toolInfo 工具信息，用于在工具不存在时创建新记录
 * @returns 更新后的工具对象，如果操作失败返回null
 */
// 防重复点击的时间戳记录
const lastClickTimestamps = new Map<string, number>();

export const incrementFrequentToolVisit = (uniqueKey: string, serverTool?: Tool): Tool | null => {
  if (typeof window === 'undefined') return null;

  try {
    // 防重复点击机制：1秒内同一工具只计数一次
    const now = Date.now();
    const lastClick = lastClickTimestamps.get(uniqueKey) || 0;
    if (now - lastClick < 1000) {
      console.log(`防止重复点击: ${uniqueKey}, 距离上次点击时间: ${now - lastClick}ms`);
      return null;
    }
    lastClickTimestamps.set(uniqueKey, now);

    // 使用新的数据结构获取函数
    const data = getLocalData();
    if (!data || !data.tools || !Array.isArray(data.tools)) {
      console.log('本地数据无效或为空');
      return null;
    }

    const tools = data.tools;
    let toolIndex = tools.findIndex(t => t.uniqueKey === uniqueKey);

    if (toolIndex === -1) {
      // 工具不存在，需要创建新记录
      if (!serverTool) {
        console.log(`未找到工具且没有提供服务器工具数据: ${uniqueKey}`);
        return null;
      }

      console.log(`工具不存在，使用服务器工具数据创建新记录: ${uniqueKey}`);

      // 直接使用服务器同步的工具对象，只设置un为1
      const newTool = {
        ...serverTool,
        un: 1 // 新工具的访问次数从1开始
      };

      // 添加到工具列表
      tools.push(newTool);
      toolIndex = tools.length - 1;

      console.log(`创建新工具记录: ${newTool.title}, uniqueKey: ${uniqueKey}`);
    } else {
      // 工具已存在，增加访问次数
      tools[toolIndex].un = (tools[toolIndex].un || 0) + 1;
      console.log(`增加现有工具访问次数: ${tools[toolIndex].title}, 新UV: ${tools[toolIndex].un}`);
    }

    // 更新数据结构中的时间戳和变更标记
    data.lastUpdateTime = Date.now();
    data.hasChanges = true; // 标记有变化需要同步

    // 保存到本地存储
    saveLocalData(data);

    // 触发更新事件
    const sortedTools = tools
      .filter(tool => typeof tool.un === 'number' && tool.un > 0)
      .sort((a, b) => (b.un || 0) - (a.un || 0));
    triggerFrequentToolsUpdate(sortedTools);

    if (process.env.NODE_ENV === 'development') {
      console.log(`增加常用工具访问次数: ${tools[toolIndex].title}, 新UV: ${tools[toolIndex].un}`);
    }

    return tools[toolIndex];
  } catch (error) {
    console.error('增加常用工具访问次数失败:', error);
    return null;
  }
};

/**
 * 获取云端缓存数据
 */
export const getCloudCacheData = (): CloudCacheData | null => {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY_CLOUD_CACHE);
    if (!stored) return null;

    const parsed = JSON.parse(stored);

    // 验证数据结构
    if (!parsed || !Array.isArray(parsed.tools)) {
      console.warn('云端缓存数据格式无效');
      return null;
    }

    return {
      tools: parsed.tools,
      lastUpdateTime: parsed.lastUpdateTime || Date.now()
    };
  } catch (error) {
    console.error('获取云端缓存数据失败:', error);
    return null;
  }
};

/**
 * 保存云端缓存数据
 */
export const saveCloudCacheData = (tools: Tool[]): void => {
  if (typeof window === 'undefined') return;

  try {
    const cloudCacheData: CloudCacheData = {
      tools,
      lastUpdateTime: Date.now()
    };

    localStorage.setItem(STORAGE_KEY_CLOUD_CACHE, JSON.stringify(cloudCacheData));

    // 触发自定义事件，通知组件更新
    const event = new CustomEvent('localStorageChanged', {
      detail: {
        key: STORAGE_KEY_CLOUD_CACHE,
        tools,
        newValue: JSON.stringify(cloudCacheData)
      }
    });
    window.dispatchEvent(event);

    if (process.env.NODE_ENV === 'development') {
      console.log('保存云端缓存数据，工具数量:', tools.length);
    }
  } catch (error) {
    console.error('保存云端缓存数据失败:', error);
  }
};

/**
 * 清除云端缓存数据
 */
export const clearCloudCacheData = (): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY_CLOUD_CACHE);

    if (process.env.NODE_ENV === 'development') {
      console.log('清除云端缓存数据');
    }
  } catch (error) {
    console.error('清除云端缓存数据失败:', error);
  }
};

/**
 * 合并云端和本地工具数据用于展示
 * 以云端数据为基础，补充本地独有的工具，按un字段排序
 * @param isAuthenticated 用户是否已登录
 * @returns 合并后的工具列表
 */
export const mergeFrequentToolsForDisplay = (isAuthenticated: boolean): Tool[] => {
  if (!isAuthenticated) {
    // 未登录状态，直接返回本地数据
    const localData = getLocalData();
    return localData.tools
      .filter(tool => typeof tool.un === 'number' && tool.un > 0)
      .sort((a, b) => (b.un || 0) - (a.un || 0));
  }

  // 登录状态，合并云端和本地数据
  const cloudCacheData = getCloudCacheData();
  const localData = getLocalData();

  // 按照优先级获取基础数据
  let baseTools: Tool[] = [];

  if (cloudCacheData && cloudCacheData.tools && cloudCacheData.tools.length > 0) {
    // 优先使用云端数据
    baseTools = cloudCacheData.tools;
    console.log('使用云端数据作为基础，工具数量:', baseTools.length);
  } else if (localData.tools && localData.tools.length > 0) {
    // 云端为空时使用本地数据
    baseTools = localData.tools;
    console.log('云端为空，使用本地数据作为基础，工具数量:', baseTools.length);
  } else {
    // 都为空，返回空数组
    console.log('云端和本地数据都为空');
    return [];
  }

  // 如果使用云端数据作为基础，需要累加本地UV并补充本地独有的工具
  if (cloudCacheData && cloudCacheData.tools && cloudCacheData.tools.length > 0) {
    // 创建一个 Map，key 是 uniqueKey，value 是工具对象
    const mergedToolsMap = new Map<string, Tool>();

    // 记录合并详情，用于日志输出
    const mergeDetails: Array<{
      title: string;
      cloudUv: number;
      localUv: number;
      totalUv: number;
      source: 'cloud' | 'local' | 'merged';
    }> = [];

    // 先放入云端数据
    baseTools.forEach(tool => {
      if (tool.uniqueKey) {
        mergedToolsMap.set(tool.uniqueKey, { ...tool });
        mergeDetails.push({
          title: tool.title,
          cloudUv: tool.un || 0,
          localUv: 0,
          totalUv: tool.un || 0,
          source: 'cloud'
        });
      }
    });

    // 累加本地数据的 UV，并补充本地独有的工具
    localData.tools.forEach(localTool => {
      if (!localTool.uniqueKey) return;

      const existingTool = mergedToolsMap.get(localTool.uniqueKey);
      if (existingTool) {
        // 云端和本地都有，累加 UV
        const localUv = typeof localTool.un === 'number' ? localTool.un : 0;
        const cloudUv = typeof existingTool.un === 'number' ? existingTool.un : 0;
        existingTool.un = cloudUv + localUv;

        // 更新合并详情
        const detail = mergeDetails.find(d => d.title === existingTool.title);
        if (detail) {
          detail.localUv = localUv;
          detail.totalUv = cloudUv + localUv;
          detail.source = 'merged';
        }
      } else {
        // 本地独有的工具，补充进去
        if (typeof localTool.un === 'number' && localTool.un > 0) {
          mergedToolsMap.set(localTool.uniqueKey, { ...localTool });
          mergeDetails.push({
            title: localTool.title,
            cloudUv: 0,
            localUv: localTool.un,
            totalUv: localTool.un,
            source: 'local'
          });
        }
      }
    });

    // 转换回数组
    baseTools = Array.from(mergedToolsMap.values());

    // 按 un 字段排序（按总UV降序）
    baseTools = baseTools.sort((a, b) => (b.un || 0) - (a.un || 0));

    // 输出详细的合并日志（排序后）
    console.log('==================== 常用工具数据合并详情 ====================');
    console.log('云端数据来源: /user/frequent-tools (其他设备聚合数据)');
    console.log('本地数据来源: frequent-tools-visits-v3 (本机点击数据)');
    console.log('合并前数量: 云端=' + cloudCacheData.tools.length + ' 个, 本地=' + localData.tools.length + ' 个');
    console.log('合并后数量: ' + baseTools.length + ' 个 (累加UV)');
    console.log('');

    // 使用 console.table 输出排序后的表格
    const tableData = baseTools.map(tool => {
      // 从 mergeDetails 中找到对应的详情
      const detail = mergeDetails.find(d => d.title === tool.title);
      return {
        '主键': tool.uniqueKey,
        '工具名称': tool.title,
        '线上UV': detail?.cloudUv ?? 0,
        '本地UV': detail?.localUv ?? 0,
        '总UV': tool.un ?? 0,
        '来源': detail?.source === 'cloud' ? '仅线上' :
                detail?.source === 'local' ? '仅本地' : '线上+本地'
      };
    });
    console.table(tableData);
    console.log('');
  }

  // 如果没有云端缓存，直接使用本地数据排序
  const mergedTools = baseTools.sort((a, b) => (b.un || 0) - (a.un || 0));

  if (process.env.NODE_ENV === 'development') {
    console.log('合并后的工具列表，总数:', mergedTools.length);
    console.log('排序后的前5个工具:');
    mergedTools.slice(0, 5).forEach((tool, index) => {
      console.log(`  ${index + 1}. ${tool.title}: UV=${tool.un}`);
    });
  }

  return mergedTools;
}; 