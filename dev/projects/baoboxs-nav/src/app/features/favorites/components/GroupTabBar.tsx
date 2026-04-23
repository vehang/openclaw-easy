'use client';

import React, { useRef, useState, useEffect } from 'react';
import GroupItemComponent from './GroupItem';
import { GroupItem } from '../types';

interface GroupTabBarProps {
  groups: GroupItem[];
  selectedGroupId: number | null;
  onGroupSelect: (groupId: number | null) => void;
  loading: boolean;
  isEditMode: boolean;
  onAddGroup: () => void;
  onEditGroup: (group: GroupItem) => void;
  onDeleteGroup: (group: GroupItem) => void;
  showText?: boolean;
  onToggleText?: () => void;
  onToggleGroupEdit?: () => void;
  onMoveUp?: (group: GroupItem) => void;
  onMoveDown?: (group: GroupItem) => void;
}

const GroupTabBar: React.FC<GroupTabBarProps> = ({
  groups,
  selectedGroupId,
  onGroupSelect,
  loading,
  isEditMode,
  onAddGroup,
  onEditGroup,
  onDeleteGroup,
  showText = true,
  onToggleText,
  onToggleGroupEdit,
  onMoveUp,
  onMoveDown
}) => {
  const allBtnRef = useRef<HTMLButtonElement>(null);
  const ungroupBtnRef = useRef<HTMLButtonElement>(null);
  const [hoverAll, setHoverAll] = useState(false);
  const [hoverUngroup, setHoverUngroup] = useState(false);
  const [posAll, setPosAll] = useState({ top: 0, left: 0 });
  const [posUngroup, setPosUngroup] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!hoverAll || showText) return;
    const update = () => {
      const rect = allBtnRef.current?.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) return;
      setPosAll({ top: rect.top + rect.height / 2, left: rect.right + 12 });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [hoverAll, showText]);

  useEffect(() => {
    if (!hoverUngroup || showText) return;
    const update = () => {
      const rect = ungroupBtnRef.current?.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) return;
      setPosUngroup({ top: rect.top + rect.height / 2, left: rect.right + 12 });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [hoverUngroup, showText]);

  return (
    <div className={`${showText ? 'sm:w-36 w-12' : 'w-12'} bg-white border-r border-gray-200 flex-shrink-0 relative transition-all duration-200`}>
      {/* 浮动切换按钮 - 仅在 >=sm 显示，手机隐藏 */}
      <div className="hidden sm:block absolute -right-4 top-2 z-30 flex flex-col gap-2">
        <button
          onClick={onToggleText}
          disabled={isEditMode}
          className={`w-4 h-6 border border-gray-300 rounded-tr-lg rounded-br-lg shadow-sm transition-all duration-200 flex items-center justify-center -ml-1 ${
            isEditMode
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-50 text-gray-600 hover:text-gray-800 hover:bg-gray-100 hover:shadow-md'
          }`}
          title={isEditMode ? '编辑模式下无法折叠' : (showText ? '隐藏文本' : '显示文本')}
        >
          {showText ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>

        {/* 分组编辑按钮 */}
        {onToggleGroupEdit && (
          <button
            onClick={onToggleGroupEdit}
            className={`w-4 h-6 border border-gray-300 rounded-tr-lg rounded-br-lg shadow-sm transition-all duration-200 flex items-center justify-center -ml-1 ${
              isEditMode
                ? 'bg-teal-100 text-teal-600 border-teal-300'
                : 'bg-gray-50 text-gray-600 hover:text-teal-600 hover:bg-teal-50 hover:border-teal-300 hover:shadow-md'
            }`}
            title={isEditMode ? '退出分组编辑' : '编辑分组'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
      </div>

      <div className="overflow-y-auto h-full group-scrollbar">
        {loading ? (
          <div className="p-4 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-teal-500"></div>
          </div>
        ) : (
          <div className="p-2">
            {/* 默认分组 - 显示所有收藏 */}
            <button
              onClick={() => onGroupSelect(null)}
              className={`w-full text-left rounded-lg text-sm font-medium transition-colors mb-1 p-2 flex justify-center ${
                showText ? 'sm:px-3 sm:py-2 sm:block sm:text-left sm:justify-start' : ''
              } ${
                selectedGroupId === null
                  ? 'bg-teal-100 text-teal-700 border border-teal-200'
                  : 'text-gray-700 hover:bg-teal-50'
              }`}
              title={!showText ? '全部收藏' : undefined}
              ref={allBtnRef}
              onMouseEnter={() => setHoverAll(true)}
              onMouseLeave={() => setHoverAll(false)}
            >
              <div className="flex items-center">
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0 sm:mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <span className={`truncate ${showText ? 'hidden sm:inline' : 'hidden'}`}>全部收藏</span>
              </div>
            </button>

            {/* 默认分组 - 未分组的收藏 */}
            <button
              onClick={() => onGroupSelect(0)}
              className={`w-full text-left rounded-lg text-sm font-medium transition-colors mb-1 p-2 flex justify-center ${
                showText ? 'sm:px-3 sm:py-2 sm:block sm:text-left sm:justify-start' : ''
              } ${
                selectedGroupId === 0
                  ? 'bg-teal-100 text-teal-700 border border-teal-200'
                  : 'text-gray-700 hover:bg-teal-50'
              }`}
              title={!showText ? '未分组' : undefined}
              ref={ungroupBtnRef}
              onMouseEnter={() => setHoverUngroup(true)}
              onMouseLeave={() => setHoverUngroup(false)}
            >
              <div className="flex items-center">
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0 sm:mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <span className={`truncate ${showText ? 'hidden sm:inline' : 'hidden'}`}>未分组</span>
              </div>
            </button>

            {/* 用户自定义分组 */}
            {groups.map((group, index) => (
              <GroupItemComponent
                key={group.id}
                group={group}
                isSelected={selectedGroupId === group.id}
                onSelect={() => onGroupSelect(group.id)}
                onEdit={() => onEditGroup(group)}
                onDelete={() => onDeleteGroup(group)}
                isEditMode={isEditMode}
                showText={showText}
                onMoveUp={isEditMode ? () => onMoveUp && onMoveUp(group) : undefined}
                onMoveDown={isEditMode ? () => onMoveDown && onMoveDown(group) : undefined}
                canMoveUp={isEditMode && index > 0}
                canMoveDown={isEditMode && index < groups.length - 1}
              />
            ))}

            {/* 编辑模式下显示新增分组按钮 */}
            {isEditMode && (
              <button
                onClick={onAddGroup}
                className={`w-full text-left rounded-lg text-sm font-medium transition-colors mb-1 border-2 border-dashed border-gray-300 text-gray-500 hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50 ${
                  showText ? 'px-3 py-2' : 'p-2 flex justify-center'
                }`}
                title={!showText ? '新增分组' : undefined}
              >
                {showText ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 mr-2 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <span className="truncate">新增分组</span>
                  </div>
                ) : (
                  <div className="w-4 h-4 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                )}
              </button>
            )}
            {/* 折叠态下 "全部收藏/未分组" 的悬浮标题卡片 */}
            {hoverAll && !showText && (
              <div
                className="fixed z-[100] p-3 bg-white rounded-lg shadow-xl border border-gray-100 max-w-xs"
                style={{ top: `${posAll.top}px`, left: `${posAll.left}px`, transform: 'translateY(-50%)' }}
              >
                <div className="text-sm font-medium text-gray-900 whitespace-nowrap">全部收藏</div>
              </div>
            )}
            {hoverUngroup && !showText && (
              <div
                className="fixed z-[100] p-3 bg-white rounded-lg shadow-xl border border-gray-100 max-w-xs"
                style={{ top: `${posUngroup.top}px`, left: `${posUngroup.left}px`, transform: 'translateY(-50%)' }}
              >
                <div className="text-sm font-medium text-gray-900 whitespace-nowrap">未分组</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupTabBar;