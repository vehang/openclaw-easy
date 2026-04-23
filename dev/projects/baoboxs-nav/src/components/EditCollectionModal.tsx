import React, { useState, useEffect, useRef } from 'react';

interface CollectionItem {
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

interface GroupItem {
  id: number;
  groupName: string;
  description?: string;
  groupIcon?: string;
  sortOrder: number;
  createTime: string;
}

interface EditCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: CollectionItem;
  groups: GroupItem[]; // 添加分组列表
  onSave: (bindId: number, customTitle: string, customDesc: string, groupId?: number | null) => void;
  isLoading?: boolean;
  onRemoveFromList?: (bindId: number) => void; // 新增：从列表中移除的回调
}

// 自定义下拉选择组件
const CustomSelect: React.FC<{
  value: number | null;
  onChange: (value: number | null) => void;
  options: { value: number | null; label: string }[];
  disabled?: boolean;
  placeholder?: string;
}> = ({ value, onChange, options, disabled = false, placeholder = "请选择" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHoveredIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedOption = options.find(option => option.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 选择框按钮 */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200 bg-gray-50/50 hover:bg-white hover:border-gray-300 text-left flex items-center justify-between ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${selectedOption && selectedOption.value !== null ? 'text-teal-600 font-medium' : 'text-gray-700'}`}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 下拉选项 */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {options.map((option, index) => (
            <div
              key={option.value || 'null'}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
                setHoveredIndex(-1);
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(-1)}
              className={`px-3 py-2 text-sm cursor-pointer transition-all duration-150 ${
                value === option.value
                  ? 'bg-teal-100 text-teal-700 font-medium' // 选中项样式
                  : hoveredIndex === index
                  ? 'bg-teal-50 text-teal-600' // 悬停项样式
                  : 'text-gray-700 hover:bg-teal-50 hover:text-teal-600' // 默认和悬停样式
              }`}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const EditCollectionModal: React.FC<EditCollectionModalProps> = ({
  isOpen,
  onClose,
  collection,
  groups,
  onSave,
  isLoading = false,
  onRemoveFromList
}) => {
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  
  // 保存初始值用于比较
  const [initialTitle, setInitialTitle] = useState('');
  const [initialDesc, setInitialDesc] = useState('');
  const [initialGroupId, setInitialGroupId] = useState<number | null>(null);

  // 当模态框打开时，设置初始值
  useEffect(() => {
    if (isOpen && collection) {
      const title = collection.customTitle || collection.title || '';
      const desc = collection.customDesc || collection.msg || '';
      const groupId = collection.groupId || null;
      
      setCustomTitle(title);
      setCustomDesc(desc);
      setSelectedGroupId(groupId);
      
      // 保存初始值
      setInitialTitle(title);
      setInitialDesc(desc);
      setInitialGroupId(groupId);
    }
  }, [isOpen, collection]);

  // 检查是否有变化
  const hasChanges = () => {
    return (
      customTitle.trim() !== initialTitle.trim() ||
      customDesc.trim() !== initialDesc.trim() ||
      selectedGroupId !== initialGroupId
    );
  };

  // 检查分组是否发生变化
  const hasGroupChanged = () => {
    return selectedGroupId !== initialGroupId;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 只有有变化时才允许提交
    if (!hasChanges()) {
      return;
    }
    
    // 如果分组发生变化，先从当前列表中移除
    if (hasGroupChanged() && onRemoveFromList) {
      onRemoveFromList(collection.bindId);
    }
    
    onSave(collection.bindId, customTitle, customDesc, selectedGroupId);
  };

  // 构建下拉选项数据
  const groupOptions = [
    { value: null, label: '未分组' },
    ...groups.map(group => ({ value: group.id, label: group.groupName }))
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
        {/* 标题 */}
        <div className="px-6 pt-5 pb-3">
          <h2 className="text-lg font-semibold text-gray-900 text-center">编辑收藏</h2>
          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-4"></div>
        </div>

        {/* 内容 */}
        <form onSubmit={handleSubmit} className="px-6 pb-6">
          <div className="space-y-4">
            {/* 原始信息显示 */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">原网站信息：</p>
              <p className="text-sm font-medium text-gray-900">{collection.title}</p>
              <p className="text-xs text-gray-500 mt-1">{collection.msg || '暂无描述'}</p>
            </div>

            {/* 自定义标题 */}
            <div>
              <label htmlFor="customTitle" className="block text-sm font-medium text-gray-700 mb-2">
                自定义标题
              </label>
              <input
                type="text"
                id="customTitle"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200 bg-gray-50/50 hover:bg-white hover:border-gray-300"
                placeholder="请输入自定义标题"
                maxLength={200}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">{customTitle.length}/200</p>
            </div>

            {/* 自定义描述 */}
            <div>
              <label htmlFor="customDesc" className="block text-sm font-medium text-gray-700 mb-2">
                自定义描述
              </label>
              <textarea
                id="customDesc"
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200 resize-none bg-gray-50/50 hover:bg-white hover:border-gray-300"
                placeholder="请输入自定义描述"
                maxLength={500}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">{customDesc.length}/500</p>
            </div>

            {/* 分组选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                分组
              </label>
              <CustomSelect
                value={selectedGroupId}
                onChange={setSelectedGroupId}
                options={groupOptions}
                disabled={isLoading}
                placeholder="请选择分组"
              />
              <p className="text-xs text-gray-500 mt-1">选择收藏所属的分组，留空表示未分组</p>
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center rounded-md transition-colors px-4 py-1.5 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
              disabled={isLoading}
            >
              取消
            </button>
            <button
              type="submit"
              className="flex items-center justify-center rounded-md transition-colors px-4 py-1.5 text-sm text-white bg-teal-500 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !hasChanges()}
              title={!hasChanges() ? '没有检测到任何变化' : ''}
            >
              {isLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {hasChanges() ? '保存' : '无变化'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCollectionModal; 