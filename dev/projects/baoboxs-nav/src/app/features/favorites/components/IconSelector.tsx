'use client';

import React, { useState } from 'react';
import { GROUP_ICONS } from '../constants';

interface IconSelectorProps {
  selectedIcon: string;
  onIconSelect: (iconName: string) => void;
  disabled?: boolean;
}

const IconSelector: React.FC<IconSelectorProps> = ({
  selectedIcon,
  onIconSelect,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);

  const selectedIconData = GROUP_ICONS.find(icon => icon.name === selectedIcon) || GROUP_ICONS[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center justify-center w-6 h-6 rounded border transition-colors ${
          disabled
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-teal-400 hover:bg-teal-50'
        }`}
        title={selectedIconData.label}
      >
        <span className="text-sm">{selectedIconData.icon}</span>
      </button>

      {isOpen && !disabled && (
        <>
          {/* 背景遮罩 */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* 下拉弹窗 */}
          <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-80 max-w-80 sm:min-w-96 sm:max-w-96">
            <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto">
              {GROUP_ICONS.map((iconItem) => (
                <button
                  key={iconItem.name}
                  type="button"
                  onClick={() => {
                    onIconSelect(iconItem.name);
                    setIsOpen(false);
                  }}
                  onMouseEnter={() => setHoveredIcon(iconItem.name)}
                  onMouseLeave={() => setHoveredIcon(null)}
                  className={`flex items-center justify-center w-8 h-8 rounded border-2 transition-colors flex-shrink-0 ${
                    selectedIcon === iconItem.name
                      ? 'border-teal-500 bg-teal-50'
                      : hoveredIcon === iconItem.name
                      ? 'border-teal-300 bg-teal-50'
                      : 'border-gray-200 hover:border-teal-300 hover:bg-teal-50'
                  }`}
                  title={iconItem.label}
                >
                  <span className="text-sm">{iconItem.icon}</span>
                </button>
              ))}
            </div>

            {/* 悬停提示 */}
            {hoveredIcon && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
                {GROUP_ICONS.find(icon => icon.name === hoveredIcon)?.label}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-800"></div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default IconSelector;