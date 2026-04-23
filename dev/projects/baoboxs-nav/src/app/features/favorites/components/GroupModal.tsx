'use client';

import React, { useState, useEffect } from 'react';
import IconSelector from './IconSelector';
import { GROUP_ICONS } from '../constants';
import { GroupItem } from '../types';

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: GroupItem | null;
  type: 'add' | 'edit';
  onSave: (groupName: string, description?: string, groupIcon?: string) => void;
  isLoading: boolean;
}

const GroupModal: React.FC<GroupModalProps> = ({
  isOpen,
  onClose,
  group,
  type,
  onSave,
  isLoading
}) => {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(GROUP_ICONS[0].name);

  // 当模态框打开时，设置初始值
  useEffect(() => {
    if (isOpen) {
      if (type === 'edit' && group) {
        setGroupName(group.groupName);
        setDescription(group.description || '');
        setSelectedIcon(group.groupIcon || GROUP_ICONS[0].name);
      } else {
        setGroupName('');
        setDescription('');
        setSelectedIcon(GROUP_ICONS[0].name);
      }
    }
  }, [isOpen, type, group]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (groupName.trim()) {
      // 如果选择的是默认图标且是新增分组，则不传递groupIcon（让后端使用NULL）
      const iconToSave = (type === 'add' && selectedIcon === GROUP_ICONS[0].name)
        ? undefined
        : selectedIcon;
      onSave(groupName.trim(), description.trim() || undefined, iconToSave);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all max-w-lg w-full mx-auto">
          <form onSubmit={handleSubmit}>
            {/* 标题 */}
            <div className="px-6 pt-5 pb-3">
              <h2 className="text-lg font-semibold text-gray-900 text-center">{type === 'add' ? '新增分组' : '编辑分组'}</h2>
              <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-4"></div>
            </div>

            <div className="bg-white px-4 pb-4 sm:p-6 sm:pb-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-2">
                    分组名称 *
                  </label>
                  <div className="flex items-center gap-2">
                    <IconSelector
                      selectedIcon={selectedIcon}
                      onIconSelect={setSelectedIcon}
                    />
                    <input
                      type="text"
                      id="groupName"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="请输入分组名称"
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200 bg-gray-50/50 hover:bg-white hover:border-gray-300"
                      required
                      maxLength={10}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    分组描述
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="请输入分组描述（可选）"
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200 resize-none bg-gray-50/50 hover:bg-white hover:border-gray-300"
                    maxLength={100}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 px-6 pb-6">
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
                disabled={isLoading || !groupName.trim()}
              >
                {isLoading && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                保存
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GroupModal;