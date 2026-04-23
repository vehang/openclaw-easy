export interface Tool {
  charge: number;
  desc: string;
  img: string;
  lang: string;
  rel: string;
  title: string;
  url: string;
  id: number;
  un:number;
  sw: number; // 访问权限标识：0=任何人都可以访问，>0=需要登录
  mf?: number; // 魔法访问标识：1=需要魔法访问
  sl?: string; // 短地址字段
  requireLogin?: boolean;
  sources?: string[]; // 记录访问来源历史
  lastSource?: string; // 最后一次访问的来源
  uniqueKey?: string; // 唯一键，用于去重和查找
  bindId?: number; // 收藏绑定ID（收藏工具使用）
}

export interface ToolGroup {
  groupName: string;
  tools: Tool[];
}

export interface Category {
  cid: number;
  cname: string;
  glist: ToolGroup[];
}

export type ApiResponse = Category[];