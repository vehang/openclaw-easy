// 定义分组类型
export interface GroupItem {
  id: number;
  groupName: string;
  description?: string;
  groupIcon?: string;
  sortOrder: number;
  createTime: string;
}

// 定义收藏站点类型
export interface CollectionItem {
  urlId: number;
  url: string;
  title: string;
  msg?: string;
  img?: string;
  bindId: number;
  customTitle?: string;
  customDesc?: string;
  groupId?: number; // 添加分组ID字段
}