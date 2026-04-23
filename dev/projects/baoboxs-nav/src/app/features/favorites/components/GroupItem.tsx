'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GROUP_ICONS } from '../constants';
import { GroupItem as GroupItemType } from '../types';

interface GroupItemProps {
  group: GroupItemType;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isEditMode: boolean;
  showText?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

const GroupItem: React.FC<GroupItemProps> = ({
  group,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  isEditMode,
  showText = true,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  // 更新折叠态下的浮窗位置
  useEffect(() => {
    if (!isHovered || showText) return;
    const updatePosition = () => {
      const rect = itemRef.current?.getBoundingClientRect();
      if (!rect) return;
      if (rect.width <= 0 || rect.height <= 0) return;
      setTooltipPosition({
        top: rect.top + rect.height / 2,
        left: rect.right + 12
      });
    };
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isHovered, showText]);

  return (
    <div
      className="relative mb-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      ref={itemRef}
    >
      <button
        onClick={onSelect}
        className={`w-full text-left rounded-lg text-sm font-medium transition-colors ${
          showText ? 'px-3 py-2' : 'p-2 flex justify-center'
        } ${
          isSelected
            ? 'bg-teal-100 text-teal-700 border border-teal-200'
            : 'text-gray-700 hover:bg-teal-50'
        }`}
        title={!showText ? group.groupName : undefined}
      >
        {showText ? (
          <div className="flex items-center">
            <div className="w-4 h-4 mr-2 flex items-center justify-center flex-shrink-0">
              <span className="text-sm leading-none flex items-center justify-center w-full h-full">
                {GROUP_ICONS.find(icon => icon.name === group.groupIcon)?.icon || GROUP_ICONS[0].icon}
              </span>
            </div>
            <span className="truncate">{group.groupName}</span>
          </div>
        ) : (
          <div className="w-4 h-4 flex items-center justify-center">
            <span className="text-sm leading-none flex items-center justify-center w-full h-full">
              {GROUP_ICONS.find(icon => icon.name === group.groupIcon)?.icon || GROUP_ICONS[0].icon}
            </span>
          </div>
        )}
      </button>

      {/* 悬停时显示的编辑删除按钮 */}
      {isHovered && isEditMode && (
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-teal-500/25 via-teal-400/15 to-teal-500/25 backdrop-blur-sm rounded-lg flex items-center justify-center">
          <div className="flex items-center gap-1">
            {/* 合并的上移下移按钮 */}
            {(onMoveUp || onMoveDown) && (
              <div className="relative">
                <div className="w-6 h-6 rounded-full bg-teal-500/25 shadow-sm ring-1 ring-white/30 backdrop-blur overflow-hidden">
                  {/* 上移区域 */}
                  {onMoveUp && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onMoveUp();
                      }}
                      disabled={!canMoveUp}
                      className={`absolute top-0 left-0 w-full h-1/2 flex items-center justify-center transition-colors ${
                        canMoveUp
                          ? 'hover:bg-teal-500/35 text-white'
                          : 'bg-gray-500/25 text-gray-400 cursor-not-allowed'
                      }`}
                      title="上移分组"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                  )}
                  {/* 下移区域 */}
                  {onMoveDown && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onMoveDown();
                      }}
                      disabled={!canMoveDown}
                      className={`absolute bottom-0 left-0 w-full h-1/2 flex items-center justify-center transition-colors ${
                        canMoveDown
                          ? 'hover:bg-teal-500/35 text-white'
                          : 'bg-gray-500/25 text-gray-400 cursor-not-allowed'
                      }`}
                      title="下移分组"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit();
              }}
              className="p-1.5 rounded-full bg-teal-500/25 hover:bg-teal-500/35 text-white shadow-sm ring-1 ring-white/30 transition transform hover:scale-105 backdrop-blur"
              title="编辑分组"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 rounded-full bg-teal-500/25 hover:bg-teal-500/35 text-white shadow-sm ring-1 ring-white/30 transition transform hover:scale-105 backdrop-blur"
              title="删除分组"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 折叠态下的悬浮详情卡片（仿工具卡片描述浮窗），悬停立显 */}
      {isHovered && !showText && (
        <div
          className="fixed z-[100] p-3 bg-white rounded-lg shadow-xl border border-gray-100 max-w-xs"
          style={{ top: `${tooltipPosition.top}px`, left: `${tooltipPosition.left}px`, transform: 'translateY(-50%)' }}
        >
          <div className="text-sm font-medium text-gray-900 whitespace-nowrap">{group.groupName}</div>
        </div>
      )}
    </div>
  );
};

export default GroupItem;